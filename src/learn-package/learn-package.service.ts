import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';
import { LearnPackage, User } from 'src/config/database.config';
import { CreateLearnPackageDto } from './dto/create-learn-package.dto';
import { UpdateLearnPackageDto } from './dto/update-learn-package.dto';

@Injectable()
export class LearnPackageService {
  constructor(
    @InjectModel(LearnPackage.name)
    private readonly learnPackageModel: Model<LearnPackage>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly authService: AuthService,
  ) {}

  async create(createDto: CreateLearnPackageDto, userId: string) {
    const isAdmin = await this.authService.checkAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Chỉ quản trị viên mới có quyền tạo gói học',
      );
    }

    const newPackage = await this.learnPackageModel.create(createDto);
    return {
      status: 201,
      message: 'Tạo gói học thành công',
      data: newPackage,
    };
  }

  async findAll() {
    const packages = await this.learnPackageModel
      .find()
      .sort({ createdAt: -1 });
    return {
      status: 200,
      total: packages.length,
      data: packages,
    };
  }

  async findOne(id: string) {
    const pack = await this.learnPackageModel.findById(id);
    if (!pack) {
      throw new NotFoundException('Không tìm thấy gói học');
    }
    return {
      status: 200,
      data: pack,
    };
  }

  async update(id: string, updateDto: UpdateLearnPackageDto, userId: string) {
    const isAdmin = await this.authService.checkAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Chỉ quản trị viên mới có quyền chỉnh sửa gói học',
      );
    }

    const updated = await this.learnPackageModel.findByIdAndUpdate(
      id,
      updateDto,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('Không tìm thấy gói học để cập nhật');
    }
    return {
      status: 200,
      message: 'Cập nhật gói học thành công',
      data: updated,
    };
  }

  async remove(id: string, userId: string) {
    const isAdmin = await this.authService.checkAdmin(userId);
    if (!isAdmin) {
      throw new ForbiddenException(
        'Chỉ quản trị viên mới có quyền xóa gói học',
      );
    }

    const deleted = await this.learnPackageModel.findByIdAndDelete(id);
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy gói học để xóa');
    }
    return {
      status: 200,
      message: 'Xóa gói học thành công',
    };
  }

  async subscribe(packageId: string, userId: string) {
    const pack = await this.learnPackageModel.findById(packageId);
    if (!pack) {
      throw new NotFoundException('Không tìm thấy gói học');
    }

    const user = await this.userModel
      .findByIdAndUpdate(userId, { learn_package: pack._id }, { new: true })
      .populate('learn_package');

    return {
      status: 200,
      message: 'Đăng ký gói học thành công',
      data: user,
    };
  }
}
