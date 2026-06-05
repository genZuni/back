import { Global, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Notification } from "src/entity/notification.entity";
import { User } from "src/entity/user.entity";
import { NotificationController } from "./notification.controller";
import { NotificationService } from "./notification.service";

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Notification, User])],
    controllers: [NotificationController],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule {}
