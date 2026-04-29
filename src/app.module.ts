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
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
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
      // useFactory: (config: ConfigService) => ({
      //   type: 'mysql',
      //   host: '188.121.97.243',
      //   port: 3306,
      //   driver: require('mysql2'),
      //   username: 'outUser',
      //   password: '#Test1234',
      //   database: 'react',

      //   synchronize: true,
      //   logging: true,
      // }),
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: '188.121.97.243',
        port: 3306,
        username: 'outUser',
        password: '#Test1234',
        database: 'genZni',
        connectorPackage: 'mysql2', 
        synchronize: true,
        logging: true,
        connectTimeout: 60000,
        acquireTimeout: 60000,
        extra: {
          connectionLimit: 10,
          connectTimeout: 60000,
        },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
