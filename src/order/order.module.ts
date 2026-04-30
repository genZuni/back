import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from 'src/entity/transaction.entity';

@Module({
  providers: [OrderService],
  imports: [TypeOrmModule.forFeature([TransactionEntity])],
})
export class OrderModule {}
