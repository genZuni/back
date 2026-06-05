import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { Role } from 'src/common/enums/role.enum';
import { WalletService } from './wallet.service';
import { RechargeRequestDto } from './dto/recharge-request.dto';
import { TransactionResponseDto } from './dto/transaction-response.dto';
import { WalletBalanceDto } from './dto/wallet-balance.dto';
import { PaginatedTransactionsDto } from './dto/paginated-transactions.dto';

@ApiTags('Wallet')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('recharge')
  @ApiOperation({
    summary: 'Request a wallet recharge',
    description:
      'Creates a pending recharge transaction and returns the bank card ' +
      'number the user should transfer the money to.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pending recharge created; bank card number returned.',
  })
  @ApiResponse({ status: 400, description: 'Invalid amount.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async requestRecharge(@Request() req, @Body() dto: RechargeRequestDto) {
    return this.walletService.requestRecharge(req.user.id, dto.amount);
  }

  @Patch('recharge/:id/confirm')
  @ApiOperation({
    summary: 'Confirm a pending recharge payment',
    description:
      'Marks a pending recharge as paid by the user. Only the owner can ' +
      'confirm, and only while it is still pending.',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction marked as user-confirmed.',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Transaction belongs to another user.',
  })
  @ApiResponse({ status: 404, description: 'Transaction not found.' })
  @ApiResponse({ status: 409, description: 'Transaction is not pending.' })
  async confirmPayment(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TransactionResponseDto> {
    return this.walletService.confirmPayment(req.user.id, id);
  }

  @Get('transactions')
  @ApiOperation({ summary: 'List my transactions (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of the caller transactions.',
    type: PaginatedTransactionsDto,
  })
  async getMyTransactions(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedTransactionsDto> {
    return this.walletService.getUserTransactions(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get my wallet balance and totals' })
  @ApiResponse({
    status: 200,
    description: 'Balance, total recharged and total spent.',
    type: WalletBalanceDto,
  })
  async getSummary(@Request() req): Promise<WalletBalanceDto> {
    return this.walletService.getWalletSummary(req.user.id);
  }

  // ---- admin: recharge approval ----

  @Get('admin/pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: list pending (user-confirmed) recharges' })
  @ApiResponse({ status: 200, type: PaginatedTransactionsDto })
  async adminPending(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedTransactionsDto> {
    return this.walletService.getPendingConfirmedTransactions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('admin/transactions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: list all transactions (history)' })
  @ApiResponse({ status: 200, type: PaginatedTransactionsDto })
  async adminAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<PaginatedTransactionsDto> {
    return this.walletService.getAllTransactions(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Patch('admin/transactions/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: approve a transaction (applies balance)' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async adminApprove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note?: string,
  ): Promise<TransactionResponseDto> {
    return this.walletService.adminApproveTransaction(req.user.id, id, note);
  }

  @Patch('admin/transactions/:id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Admin: reject a transaction' })
  @ApiResponse({ status: 200, type: TransactionResponseDto })
  async adminReject(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body('note') note?: string,
  ): Promise<TransactionResponseDto> {
    return this.walletService.adminRejectTransaction(req.user.id, id, note);
  }
}
