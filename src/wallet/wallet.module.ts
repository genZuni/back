import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from '../entity/wallet.entity';
import { TransactionEntity } from '../entity/transaction.entity';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { AdminWalletController } from './admin-wallet.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, TransactionEntity])],
  controllers: [WalletController, AdminWalletController],
  providers: [WalletService],
  // Exported so other modules (e.g. checkout/teacher enrolment) can call
  // walletService.deductBalance().
  exports: [WalletService],
})
export class WalletModule {}
