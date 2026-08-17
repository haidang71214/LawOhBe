import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PriceRangeService } from './price-range.service';
import {
  UpdatePriceRangeDto,
  CustomPriceRangeDto,
  updatePriceBylawyerDto,
  ResponseDto,
  CustomPriceItemResponseDto,
  MarketPriceRangeItemResponseDto,
  MarketPriceRangeListResponseDataDto,
} from './dto';
import { PaginationQueryDto } from 'libs/dto/pagination.dto';
import { AuthorizerDecorator, RoleDecorator, UserData } from 'libs/decorators';
import { AuthorizedMetadata } from 'libs/interfaces/auth/authorize.response';
import { USER_ROLE } from 'libs/constant';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('price-range')
@Controller('price-range')
export class PriceRangeController {
  constructor(private readonly priceRangeService: PriceRangeService) {}

  @Post('/custom')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async createCustomPrice(
    @Body() body: CustomPriceRangeDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<CustomPriceItemResponseDto>> {
    return this.priceRangeService.createCustomPrice(user.userId, body);
  }

  @Patch('/custom')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.LAWYER)
  async updateCustomPrice(
    @UserData() user: AuthorizedMetadata,
    @Body() body: updatePriceBylawyerDto,
  ): Promise<ResponseDto<CustomPriceItemResponseDto>> {
    return this.priceRangeService.updateCustomPrice(user.userId, body);
  }

  @Get()
  async findAllPriceRanges(
    @Query() queryDto: PaginationQueryDto,
  ): Promise<ResponseDto<MarketPriceRangeListResponseDataDto>> {
    return this.priceRangeService.findAllPriceRanges(queryDto);
  }

  @Get('/:type')
  async findPriceRangeByType(
    @Param('type') id: string,
  ): Promise<ResponseDto<MarketPriceRangeItemResponseDto>> {
    return this.priceRangeService.findPriceRangeByType(id);
  }

  @Patch('/:type')
  @AuthorizerDecorator({ secured: true })
  @RoleDecorator(USER_ROLE.ADMIN)
  async updateMarketPriceRange(
    @Param('type') type: string,
    @Body() updatePriceRangeDto: UpdatePriceRangeDto,
    @UserData() user: AuthorizedMetadata,
  ): Promise<ResponseDto<any>> {
    return this.priceRangeService.updateMarketPriceRange(
      type,
      updatePriceRangeDto,
      user.userId,
    );
  }
}
