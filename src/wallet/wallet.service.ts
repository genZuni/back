import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { Wallet } from '../entity/wallet.entity';
import {
  ETransaction,
  ETransactionStatus,
  TransactionEntity,
} from '../entity/transaction.entity';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { WalletBalanceDto } from './dto/wallet-balance.dto';
import { PaginatedTransactionsDto } from './dto/paginated-transactions.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /** The fixed destination bank card number users transfer money to. */
  getBankCardNumber(): string {
    return (
      this.configService.get<string>('BANK_CARD_NUMBER') ||
      '6037-9911-1234-5678'
    );
  }

  /**
   * Creates a pending `recharge` transaction and returns the bank card number
   * the user should transfer the money to. No balance change happens here.
   */
  async requestRecharge(
    userId: string,
    amount: number,
  ): Promise<{ transaction: TransactionResponseDto; bankCardNumber: string }> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const transaction = this.transactionRepository.create({
      userId,
      amount,
      type: ETransaction.INCOME,
      status: ETransactionStatus.WAITING,
      userConfirmed: false,
    });
    const saved = await this.transactionRepository.save(transaction);

    return {
      transaction: TransactionResponseDto.fromEntity(saved),
      bankCardNumber: this.getBankCardNumber(),
    };
  }

  /**
   * Marks a pending recharge as "user says they paid". Only the owner can
   * confirm, and only while the transaction is still pending (WAITING).
   */
  async confirmPayment(
    userId: string,
    transactionId: number,
  ): Promise<TransactionResponseDto> {
    const transaction = await this.transactionRepository.findOne({
      where: { id: transactionId },
    });
    if (!transaction) {
      throw new NotFoundException('Transaction not found.');
    }
    if (transaction.userId !== userId) {
      throw new ForbiddenException('This transaction does not belong to you.');
    }
    if (transaction.status !== ETransactionStatus.WAITING) {
      throw new ConflictException(
        'Only pending transactions can be confirmed.',
      );
    }

    transaction.userConfirmed = true;
    const saved = await this.transactionRepository.save(transaction);
    return TransactionResponseDto.fromEntity(saved);
  }

  /**
   * Approves a pending transaction and applies the balance change atomically.
   * Recharges credit the wallet; payments debit it (with a balance check).
   */
  async adminApproveTransaction(
    adminId: string,
    transactionId: number,
    note?: string,
  ): Promise<TransactionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(TransactionEntity, {
        where: { id: transactionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!transaction) {
        throw new NotFoundException('Transaction not found.');
      }
      if (transaction.status !== ETransactionStatus.WAITING) {
        throw new ConflictException(
          'Only pending transactions can be approved.',
        );
      }

      const wallet = await this.getOrCreateWalletForUpdate(
        queryRunner,
        transaction.userId,
      );
      const amount = Number(transaction.amount);
      let balance = Number(wallet.balance);

      if (transaction.type === ETransaction.INCOME) {
        balance += amount;
      } else {
        if (balance < amount) {
          throw new BadRequestException('Insufficient wallet balance.');
        }
        balance -= amount;
      }

      wallet.balance = balance;
      await queryRunner.manager.save(Wallet, wallet);

      transaction.status = ETransactionStatus.ACCEPTED;
      transaction.approvedAt = new Date();
      transaction.approvedBy = adminId;
      if (note !== undefined) {
        transaction.adminNote = note;
      }
      const saved = await queryRunner.manager.save(
        TransactionEntity,
        transaction,
      );

      await queryRunner.commitTransaction();
      return TransactionResponseDto.fromEntity(saved);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Rejects a pending transaction. No balance change is applied.
   */
  async adminRejectTransaction(
    adminId: string,
    transactionId: number,
    note?: string,
  ): Promise<TransactionResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transaction = await queryRunner.manager.findOne(TransactionEntity, {
        where: { id: transactionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!transaction) {
        throw new NotFoundException('Transaction not found.');
      }
      if (transaction.status !== ETransactionStatus.WAITING) {
        throw new ConflictException(
          'Only pending transactions can be rejected.',
        );
      }

      transaction.status = ETransactionStatus.FAIL;
      transaction.approvedAt = new Date();
      transaction.approvedBy = adminId;
      if (note !== undefined) {
        transaction.adminNote = note;
      }
      const saved = await queryRunner.manager.save(
        TransactionEntity,
        transaction,
      );

      await queryRunner.commitTransaction();
      return TransactionResponseDto.fromEntity(saved);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Returns the caller's transactions, newest first, paginated. */
  async getUserTransactions(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<PaginatedTransactionsDto> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));

    const [items, total] = await this.transactionRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data: items.map((tx) => TransactionResponseDto.fromEntity(tx)),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /** Returns the current balance plus approved recharge/payment totals. */
  async getWalletSummary(userId: string): Promise<WalletBalanceDto> {
    const wallet = await this.walletRepository.findOne({ where: { userId } });
    const balance = wallet ? Number(wallet.balance) : 0;

    const totalRecharged = await this.sumApproved(userId, ETransaction.INCOME);
    const totalSpent = await this.sumApproved(userId, ETransaction.PAYMENT);

    return { balance, totalRecharged, totalSpent };
  }

  /**
   * Creates an already-approved `payment` transaction and debits the wallet
   * immediately, atomically. Used when a user buys/enrolls in a class.
   */
  async deductBalance(
    userId: string,
    amount: number,
    classId: string,
  ): Promise<TransactionResponseDto> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const wallet = await this.getOrCreateWalletForUpdate(queryRunner, userId);
      const balance = Number(wallet.balance);
      if (balance < amount) {
        throw new BadRequestException('Insufficient wallet balance.');
      }

      wallet.balance = balance - amount;
      await queryRunner.manager.save(Wallet, wallet);

      const transaction = queryRunner.manager.create(TransactionEntity, {
        userId,
        amount,
        classId,
        type: ETransaction.PAYMENT,
        status: ETransactionStatus.ACCEPTED,
        userConfirmed: true,
        approvedAt: new Date(),
      });
      const saved = await queryRunner.manager.save(
        TransactionEntity,
        transaction,
      );

      await queryRunner.commitTransaction();
      return TransactionResponseDto.fromEntity(saved);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Admin: pending transactions the user has already confirmed paying. */
  async getPendingConfirmedTransactions(
    page = 1,
    limit = 20,
  ): Promise<PaginatedTransactionsDto> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Math.floor(limit) || 20));

    const [items, total] = await this.transactionRepository.findAndCount({
      where: { status: ETransactionStatus.WAITING, userConfirmed: true },
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data: items.map((tx) => TransactionResponseDto.fromEntity(tx)),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  /** Admin: all transactions (any user/status), newest first, paginated. */
  async getAllTransactions(
    page = 1,
    limit = 50,
  ): Promise<PaginatedTransactionsDto> {
    const safePage = Math.max(1, Math.floor(page) || 1);
    const safeLimit = Math.min(200, Math.max(1, Math.floor(limit) || 50));

    const [items, total] = await this.transactionRepository.findAndCount({
      order: { createdAt: 'DESC', id: 'DESC' },
      skip: (safePage - 1) * safeLimit,
      take: safeLimit,
    });

    return {
      data: items.map((tx) => TransactionResponseDto.fromEntity(tx)),
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  // ---- escrow (session booking) -------------------------------------------

  /**
   * Debits `amount` from the student's wallet and records it as a HELD payment
   * (escrow). The money leaves the student now but is not credited to anyone
   * until the session is completed (`releaseHold`) or cancelled (`refundHold`).
   *
   * Pass `manager` to run inside an existing transaction (e.g. booking several
   * sessions atomically); omit it to run as its own transaction.
   */
  async holdBalance(
    studentId: string,
    amount: number,
    sessionId: string,
    manager?: EntityManager,
  ): Promise<TransactionEntity> {
    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero.');
    }

    return this.runInTx(manager, async (m) => {
      const wallet = await this.lockOrCreateWallet(m, studentId);
      const balance = Number(wallet.balance);
      if (balance < amount) {
        throw new BadRequestException('Insufficient wallet balance.');
      }

      wallet.balance = balance - amount;
      await m.save(Wallet, wallet);

      const transaction = m.create(TransactionEntity, {
        userId: studentId,
        amount,
        classId: sessionId,
        type: ETransaction.PAYMENT,
        status: ETransactionStatus.HELD,
        userConfirmed: true,
      });
      return m.save(TransactionEntity, transaction);
    });
  }

  /**
   * Releases a previously held payment to the teacher: finalises the student's
   * payment (HELD -> ACCEPTED, no further balance change since the money was
   * already debited) and credits the teacher's wallet with its own ACCEPTED
   * income transaction. Returns the teacher credit transaction.
   */
  async releaseHold(
    heldTransactionId: number,
    teacherId: string,
    manager?: EntityManager,
  ): Promise<TransactionEntity> {
    return this.runInTx(manager, async (m) => {
      const held = await m.findOne(TransactionEntity, {
        where: { id: heldTransactionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!held) {
        throw new NotFoundException('Held transaction not found.');
      }
      if (held.status !== ETransactionStatus.HELD) {
        throw new ConflictException('Transaction is not in a held state.');
      }

      const amount = Number(held.amount);

      // Finalise the student-side payment (already debited at hold time).
      held.status = ETransactionStatus.ACCEPTED;
      held.approvedAt = new Date();
      await m.save(TransactionEntity, held);

      // Credit the teacher's wallet.
      const teacherWallet = await this.lockOrCreateWallet(m, teacherId);
      teacherWallet.balance = Number(teacherWallet.balance) + amount;
      await m.save(Wallet, teacherWallet);

      // Record the teacher credit as its own transaction.
      const credit = m.create(TransactionEntity, {
        userId: teacherId,
        amount,
        classId: held.classId,
        type: ETransaction.INCOME,
        status: ETransactionStatus.ACCEPTED,
        userConfirmed: true,
        approvedAt: new Date(),
        describe: 'Session payment release',
      });
      return m.save(TransactionEntity, credit);
    });
  }

  /**
   * Refunds a held payment back to the student (used when a booked session is
   * cancelled). The held transaction is marked FAIL and the amount is returned
   * to the student's wallet.
   */
  async refundHold(
    heldTransactionId: number,
    manager?: EntityManager,
  ): Promise<TransactionEntity> {
    return this.runInTx(manager, async (m) => {
      const held = await m.findOne(TransactionEntity, {
        where: { id: heldTransactionId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!held) {
        throw new NotFoundException('Held transaction not found.');
      }
      if (held.status !== ETransactionStatus.HELD) {
        throw new ConflictException('Transaction is not in a held state.');
      }

      const amount = Number(held.amount);

      const wallet = await this.lockOrCreateWallet(m, held.userId);
      wallet.balance = Number(wallet.balance) + amount;
      await m.save(Wallet, wallet);

      held.status = ETransactionStatus.FAIL;
      held.approvedAt = new Date();
      held.adminNote = 'Refunded: session cancelled.';
      return m.save(TransactionEntity, held);
    });
  }

  // ---- helpers -------------------------------------------------------------

  /**
   * Runs `work` inside `manager` if provided, otherwise inside a fresh
   * transaction (connect / commit / rollback / release), mirroring the
   * QueryRunner pattern used elsewhere in this service.
   */
  private async runInTx<T>(
    manager: EntityManager | undefined,
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    if (manager) {
      return work(manager);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await work(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /** Like getOrCreateWalletForUpdate but against an EntityManager. */
  private async lockOrCreateWallet(
    manager: EntityManager,
    userId: string,
  ): Promise<Wallet> {
    let wallet = await manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      wallet = manager.create(Wallet, { userId, balance: 0 });
      wallet = await manager.save(Wallet, wallet);
    }

    return wallet;
  }

  private async sumApproved(
    userId: string,
    type: ETransaction,
  ): Promise<number> {
    const raw = await this.transactionRepository
      .createQueryBuilder('tx')
      .select('COALESCE(SUM(tx.amount), 0)', 'sum')
      .where('tx.userId = :userId', { userId })
      .andWhere('tx.type = :type', { type })
      .andWhere('tx.status = :status', { status: ETransactionStatus.ACCEPTED })
      .getRawOne<{ sum: string }>();

    return Number(raw?.sum ?? 0);
  }

  /**
   * Loads the user's wallet with a write lock inside the given query runner,
   * creating one (balance 0) if it does not exist yet.
   */
  private async getOrCreateWalletForUpdate(
    queryRunner: QueryRunner,
    userId: string,
  ): Promise<Wallet> {
    let wallet = await queryRunner.manager.findOne(Wallet, {
      where: { userId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!wallet) {
      wallet = queryRunner.manager.create(Wallet, { userId, balance: 0 });
      wallet = await queryRunner.manager.save(Wallet, wallet);
    }

    return wallet;
  }
}
