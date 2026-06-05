import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "src/entity/user.entity";
import { Session } from "src/entity/session.entity";

@Module({
    controllers:[UsersController],
    providers:[UsersService],
    exports :[UsersService],
    imports:[TypeOrmModule.forFeature([User, Session])]
})
export class UsersModule{}