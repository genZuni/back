import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.detector';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @Post('as/:id')
  @ApiOperation({ summary: 'Login as another user' })
  loginAs(@Param('id') id: number) {
    return this.authService.loginAs(+id);
  }
  @Post('signup')
  async signup(@Body() dto: RegisterDto) {
    return this.authService.signup(dto);
  }
  @Post('Acceptsignup/:email/:code')
  async Acceptsignup(
    @Param('email') email: string,
    @Param('code') code: string,
  ) {
    return this.authService.AcceptSignUp(email,code);
  }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getProfile(@Req() req) {
    return req.user;
  }
}
