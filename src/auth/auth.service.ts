import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import crypto from 'crypto';
import { AppService } from 'src/app.service';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    // private appService: AppService,
  ) {}
  private newUsers: any = [];

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
  async loginAs(id: number) {
    // const user = await this.usersService.findOne(id);

    // const payload = {
    //   sub: user.id,
    //   email: user.email,
    //   role: user.role,
    // };
    // return this.jwtService.sign(payload);
  }
  async signup(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const code = 11111
    // const code = crypto.randomInt(10000);
//     await this.appService.sendHtmlEmail(
//       dto.email,
//       'Email registeration code',
//       `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Print Shop – verify your email</title>
// </head>
// <body style="margin:0; padding:20px; background-color:#e9ecef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
//     <div style="max-width:480px; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.05);">

//         <!-- very simple header: only brand name and accent -->
//         <div style="padding:24px 24px 12px 24px; text-align:center;">
//             <span style="font-size:26px; font-weight:700; color:#1e1e1e;">web<span style="color:#f5b342;">zee</span></span>
//             <div style="height:2px; width:50px; background:#f5b342; margin:8px auto 0 auto;"></div>
//         </div>

//         <!-- main content: just the essentials -->
//         <div style="padding:8px 28px 28px 28px; text-align:center;">
//             <h2 style="margin:0 0 6px 0; font-size:22px; font-weight:600; color:#1e1e1e;">verification code</h2>
//             <p style="margin:0 0 24px 0; color:#4a4a4a; font-size:15px;">Use this code to complete your registration</p>

//             <!-- big simple code box (inspired by the clean "products" vibe) -->
//             <div style="background:#f4f6f9; border-radius:16px; padding:20px; margin:16px 0 22px 0; border:1px solid #eaeef2;">
//                 <span style="font-size:42px; font-weight:700; letter-spacing:10px; color:#1e1e1e; font-family: 'Courier New', monospace;">${code}</span>
//             </div>

//             <!-- minimal helper line -->
//             <!-- <p style="margin:0 0 32px 0; color:#6c757d; font-size:14px;">⏳ valid for 10 minutes</p> -->

//             <!-- subtle action hint (no big button, just a clean link) -->
//             <a href="${'https://printshop.designme.at/en-US/register/' + dto.email}" style="display:inline-block; background:#f5b342; color:#1e1e1e; font-weight:600; padding:12px 38px; border-radius:40px; text-decoration:none; font-size:15px; border:none; box-shadow:0 2px 6px rgba(245,179,66,0.3);">verify now →</a>

//             <!-- short info with support (simpler than previous) -->
//             <p style="margin:30px 0 0 0; color:#adb5bd; font-size:13px;">Not you? <a href="#" style="color:#f5b342; text-decoration:none; border-bottom:1px dotted #f5b342;">ignore this</a></p>
//         </div>


//     </div>

//     <!-- inline note: replace code & link dynamically from your email server -->
// </body>
// </html>`,
//     );

    console.log(code, dto);
    this.newUsers.push({ code, ...dto });
    return dto.email;
  }
  async AcceptSignUp(email: string, code: string) {
    const data = this.newUsers.find(
      (el: any) => el.email == email && el.code == code,
    );
    if (!data) throw new NotFoundException('data not fount');

    const user = await this.usersService.create(data);
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
