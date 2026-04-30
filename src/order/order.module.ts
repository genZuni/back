import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from 'src/entity/transaction.entity';
import { WalletController } from './wallet.controller';

@Module({
  providers: [OrderService],
  controllers: [WalletController],
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
})
export class OrderModule {}
