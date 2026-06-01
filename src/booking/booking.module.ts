import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../entity/session.entity';
import { TeacherAvailability } from '../entity/teacher-availability.entity';
import { SessionCompletionLog } from '../entity/session-completion-log.entity';
import { Teacher } from '../entity/teacher.entity';
import { WalletModule } from '../wallet/wallet.module';
import { AvailabilityService } from './availability.service';
import { BookingService } from './booking.service';
import { SessionService } from './session.service';
import { AvailabilityController } from './availability.controller';
import { BookingController } from './booking.controller';
import {
  AdminSessionController,
  TeacherSessionController,
} from './session.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Session,
      TeacherAvailability,
      SessionCompletionLog,
      Teacher,
    ]),
    // Provides WalletService (hold / release / refund of escrow payments).
    WalletModule,
  ],
  providers: [AvailabilityService, BookingService, SessionService],
  controllers: [
    AvailabilityController,
    BookingController,
    TeacherSessionController,
    AdminSessionController,
  ],
})
export class BookingModule {}
