import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TransactionEntity } from 'src/entity/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(TransactionEntity)
    transactionRepository: Repository<TransactionEntity>,
  ) {}

  async chargeWalletRequest(amount: number, userId: number) {
    

  }
}
