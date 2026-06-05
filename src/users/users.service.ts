import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enums/role.enum';
import { User } from 'src/entity/user.entity';
import { Session } from 'src/entity/session.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  /** Admin: all sessions a user is involved in (as student or teacher). */
  async getUserSessions(id: string): Promise<Session[]> {
    await this.findOne(id); // 404 if the user does not exist

    return this.sessionsRepository.find({
      where: [{ studentId: id }, { teacherId: id }],
      order: { startDateTime: 'DESC' },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const user = this.usersRepository.create({
      ...createUserDto,
      balance: createUserDto.balance || 0,
    });
    console.log(user, createUserDto);
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },relations:{teacher:true,}
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findByRole(role: Role): Promise<User[]> {
    return this.usersRepository.find({
      where: { role },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    Object.assign(user, updateUserDto);
    return this.usersRepository.save(user);
  }

  /** Self-service profile update (name/email/phone/country only). */
  async updateProfile(
    id: string,
    dto: {
      name?: string;
      email?: string;
      phone?: string;
      country?: string;
    },
  ): Promise<User> {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.findByEmail(dto.email);
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.country !== undefined) user.country = dto.country;

    return this.usersRepository.save(user);
  }

  /** Verifies the current password and sets a new one (re-hashed by the entity hook). */
  async changePassword(
    id: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOne(id);
    const ok = await user.validatePassword(currentPassword);
    if (!ok) {
      throw new BadRequestException('Current password is incorrect.');
    }
    user.password = newPassword; // hashed by the @BeforeUpdate hook on save
    await this.usersRepository.save(user);
  }

  /** Soft-deletes the account (deactivates it); login is then blocked. */
  async deactivate(id: string): Promise<void> {
    const user = await this.findOne(id);
    user.isActive = false;
    await this.usersRepository.save(user);
  }

  async updateBalance(id: string, amount: number): Promise<User> {
    const user = await this.findOne(id);

    const newBalance = Number(user.balance) + amount;

    if (newBalance < 0) {
      throw new BadRequestException('Insufficient balance');
    }

    user.balance = newBalance;
    return this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async searchUsers(query: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query OR user.email ILIKE :query', {
        query: `%${query}%`,
      })
      .getMany();
  }

  async getStatistics() {
    const totalUsers = await this.usersRepository.count();
    const activeUsers = await this.usersRepository.count({
      where: { isActive: true },
    });
    const usersByRole = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    return {
      totalUsers,
      activeUsers,
      usersByRole,
    };
  }
}
