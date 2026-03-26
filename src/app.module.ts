import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { TeacherRequestsModule } from './teacher-requests/teacher-requests.module';
import { TranslateModule } from './translate/translate.mofule';
import { TeacherModule } from './teacher/teacher.module';
import { NotificationModule } from './notification/notification.module';
import { TicketModule } from './ticket/ticket.module';
@Module({
  imports: [
    AuthModule,
    ConfigModule,
    TranslateModule,
    TeacherModule,
    NotificationModule,
    TicketModule,
    TeacherRequestsModule,
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',

        host: '185.208.181.161',
        port: 31136,

        username: 'root',
        password: 'StTeBr80corzEYaOvsB03r5I',

        database: 'test',

        ssl: false,
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
