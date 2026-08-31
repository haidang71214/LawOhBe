import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateLearnPackageDto,
  UpdateLearnPackageDto,
  ResponseDto,
  LearnPackageItemResponseDto,
  LearnPackageListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { LearnPackageService } from './learn-package.service';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';

@ApiTags('Learn Package')
@Controller('learn-package')
export class LearnPackageController {
  constructor(private readonly learnPackageService: LearnPackageService) {}

  @Post()
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin creates a new learning package' })
  async createPackage(
    @Body() createDto: CreateLearnPackageDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<LearnPackageItemResponseDto>> {
    return this.learnPackageService.createPackage(createDto, user.userId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all learning packages with pagination and soft delete filter',
  })
  async findAllPackages(
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<LearnPackageListResponseDataDto>> {
    return this.learnPackageService.findAllPackages(queryDto);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get learning package details by ID' })
  async findPackageById(
    @Param('id') id: string,
  ): Promise<ResponseDto<LearnPackageItemResponseDto>> {
    return this.learnPackageService.findPackageById(id);
  }

  @Patch('/:id')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin updates learning package info' })
  async updatePackage(
    @Param('id') id: string,
    @Body() updateDto: UpdateLearnPackageDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<LearnPackageItemResponseDto>> {
    return this.learnPackageService.updatePackage(id, updateDto, user.userId);
  }

  @Delete('/:id')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  @ApiOperation({ summary: 'Admin deletes a learning package' })
  async removePackage(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<null>> {
    return this.learnPackageService.removePackage(id, user.userId);
  }

  @Post('/:id/subscribe')
  @AuthorizerDecorator({ secured: true })
  @ApiOperation({ summary: 'User subscribes to a learning package' })
  async subscribePackage(
    @Param('id') id: string,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.learnPackageService.subscribePackage(id, user.userId);
  }
}
