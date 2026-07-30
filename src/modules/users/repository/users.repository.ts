import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class UsersRepository extends BaseRepository<User> {
  constructor(
    @InjectModel(UserModelName) private readonly userModel: Model<User>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findOne({ email });
  }

  async findByPhone(phone: number): Promise<User | null> {
    return this.findOne({ phone });
  }
}
