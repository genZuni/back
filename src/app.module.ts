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
      // @ts-ignore
      useFactory: (config: ConfigService) => ({
        // @ts-ignore
        type: (config.get<string>('DB_TYPE') as 'postgres') || 'postgres',
        // type: 'postgres',
        connectorPackage:
          config.get('DB_TYPE') == 'mysql' ? 'mysql2' : undefined,
        // connectorPackage:"mysql2",

        host: config.get<string>('DB_HOST') || 'localhost',
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME') || 'rune',

        // host: 'elbrus.liara.cloud',
        // port: 30439,
        // username: 'root',
        // password: 'aJbgrOJ3A9tk4VtdKHBiJk7m',
        // database: 'rune',
        ssl: false,
        connectTimeout: 10000,
        extra: {
          connectionLimit: 100,
        },

        autoLoadEntities: true,
        synchronize: true,
        logging: true,
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
