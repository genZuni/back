import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.detector';
import { WalletService } from './wallet.service';
import { AdminApproveDto } from './dto/admin-approve.dto';
import { DeductBalanceDto } from './dto/deduct-balance.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { PaginatedTransactionsDto } from './dto/paginated-transactions.dto';

@ApiTags('Wallet (Admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminWalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions/pending')
  @ApiOperation({
    summary: 'List pending transactions the user has confirmed paying',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Pending + userConfirmed transactions awaiting review.',
    type: PaginatedTransactionsDto,
  })
  @ApiResponse({ status: 403, description: 'Admin role required.' })
  async getPending(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedTransactionsDto> {
    return this.walletService.getPendingConfirmedTransactions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('transactions/:id/approve')
  @ApiOperation({
    summary: 'Approve a pending transaction',
    description: 'Credits/debits the wallet atomically and marks it approved.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction approved and balance updated.',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Insufficient balance (payments).' })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  @ApiResponse({ status: 409, description: 'Transaction is not pending.' })
  async approve(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminApproveDto,
  ): Promise<TransactionResponseDto> {
    return this.walletService.adminApproveTransaction(
      req.user.id,
      id,
      dto.adminNote,
    );
  }

  @Post('transactions/:id/reject')
  @ApiOperation({
    summary: 'Reject a pending transaction',
    description: 'Marks the transaction rejected. No balance change.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transaction rejected.',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  @ApiResponse({ status: 409, description: 'Transaction is not pending.' })
  async reject(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AdminApproveDto,
  ): Promise<TransactionResponseDto> {
    return this.walletService.adminRejectTransaction(
      req.user.id,
      id,
      dto.adminNote,
    );
  }

  @Post('wallet/deduct')
  @ApiOperation({
    summary: 'Deduct balance for a class (testing/admin)',
    description:
      'Creates an already-approved payment transaction and debits the ' +
      "user's wallet immediately.",
  })
  @ApiResponse({
    status: 201,
    description: 'Payment recorded and balance debited.',
    type: TransactionResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Insufficient balance.' })
  async deduct(@Body() dto: DeductBalanceDto): Promise<TransactionResponseDto> {
    return this.walletService.deductBalance(dto.userId, dto.amount, dto.classId);
  }
}
