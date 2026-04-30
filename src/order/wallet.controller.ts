import { Controller, Param, Patch, Req } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly OrderService: OrderService) {}

  @Patch('/:amount')
  async charge(@Req() req, @Param('amount') amount: number) {
    const data = await this.OrderService.chargeWalletRequest(amount, 1);
    return data
  }
}
