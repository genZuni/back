import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import {
  ETransaction,
  ETransactionStatus,
  TransactionEntity,
} from 'src/entity/transaction.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
  ) {}

  async chargeWalletRequest(amount: number, userId: number) {
    const api = await axios.post(
      'https://sandbox.zarinpal.com/pg/v4/payment/request.json',
      {
        merchant_id: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        amount: amount,
        currency: 'IRT',
        callback_url: 'http://localhost:3002/wallet/autoAccept',
        description: 'charge wallet',
      },
    );
    if (api.data.data.message == 'Success' && api.data.data.code == 100) {
      const newTransaction = this.transactionRepository.create({
        amount,
        authority: api.data.data.authority,
        type: ETransaction.PAYMENT,
        status: ETransactionStatus.WAITING,
      });
      await this.transactionRepository.save(newTransaction);
      const link = `https://sandbox.zarinpal.com/pg/StartPay/${api.data.data.authority}`;
      return { d: api.data, link };
    }
  }
  async chargeWalletAccept(authority: string) {}
}
