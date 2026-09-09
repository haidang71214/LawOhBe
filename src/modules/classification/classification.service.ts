import {
  Injectable,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerateContentResult,
} from '@google/generative-ai';
import {
  ClassificationRequestDto,
  ResponseDto,
  ClassificationDataDto,
} from './dto';
import { ETypeLawyer } from 'libs/schemas';
import { RedisService } from 'src/shared/redis/redis.service';
import { REDIS_KEYS, REDIS_TTL } from 'src/shared/redis';
import { UsersRepository } from '../users/repository/users.repository';
import { TypeLawyerRepository } from '../lawyer/repository/type-lawyer.repository';
import { ClassificationMapper } from './mapper/classification.mapper';

@Injectable()
export class ClassificationService {
  private readonly logger = new Logger(ClassificationService.name);
  private client: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly typeLawyerRepository: TypeLawyerRepository,
    private readonly classificationMapper: ClassificationMapper,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_1') ||
      process.env['GEMINI_API_1'];

    if (apiKey && apiKey !== 'your_gemini_api_key') {
      this.client = new GoogleGenerativeAI(apiKey);
      this.model = this.client.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });
    } else {
      this.logger.warn(
        'GEMINI_API_1 is not set or using dummy key. AI classification will be disabled until a valid key is provided.',
      );
    }
  }

  async classifyText(
    request: ClassificationRequestDto,
  ): Promise<ResponseDto<ClassificationDataDto>> {
    const cacheKey = REDIS_KEYS.CLASSIFICATION_TEXT(
      request.text.trim().toLowerCase(),
    );
    const cached = await this.redisService.get<ClassificationDataDto>(cacheKey);
    if (cached) {
      return ResponseDto.success(
        cached,
        'Text classified successfully (cached)',
        HttpStatus.OK,
      );
    }

    if (!this.model) {
      throw new ServiceUnavailableException(
        'Gemini API key is not configured.',
      );
    }

    try {
      const result: GenerateContentResult = await this.model.generateContent(
        `Understand the input and perform task: ${request.text}. Task: Classify the input into one of these categories ('INSURANCE', 'CORPORATE', 'CRIMINAL', 'INTELLECTUAL_PROPERTY', 'CIVIL', 'TRANSPORTATION', 'FAMILY', 'INHERITANCE', 'LAND', 'ADMINISTRATIVE', 'LABOR', 'TAX'). Just give me only the category, not generate more text`,
      );

      let category = result.response.text().trim();
      const validCategories = Object.values(ETypeLawyer);

      if (!validCategories.includes(category as ETypeLawyer)) {
        for (const validCat of validCategories) {
          if (category.toUpperCase().includes(validCat)) {
            category = validCat;
            break;
          }
        }
        if (!validCategories.includes(category as ETypeLawyer)) {
          category = 'UNKNOWN';
        }
      }

      let lawyerList: any[] = [];

      if (category !== 'UNKNOWN') {
        const typeLawyers = await this.typeLawyerRepository.find({
          type: category,
        });

        if (typeLawyers.length > 0) {
          const lawyerIds = typeLawyers.map((tl) => tl.lawyer_id);
          const users = await this.usersRepository.find(
            { _id: { $in: lawyerIds } },
            undefined,
            undefined,
            'name avartar_url address rate',
          );

          lawyerList = users.map((user) => ({
            ...((user as any).toObject ? (user as any).toObject() : user),
            type: category,
          }));
        }
      }

      const responseData: ClassificationDataDto = {
        category,
        lawyers: lawyerList,
      };

      const finalResult =
        this.classificationMapper.toClassificationDataDto(responseData);
      await this.redisService.set(cacheKey, finalResult, REDIS_TTL.ONE_DAY);

      return ResponseDto.success(
        finalResult,
        'Text classified successfully',
        HttpStatus.OK,
      );
    } catch (error: any) {
      if (error instanceof ServiceUnavailableException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error classifying text: ${error.message}`,
      );
    }
  }

  async getCategories(): Promise<ResponseDto<{ categories: string[] }>> {
    const cacheKey = REDIS_KEYS.CLASSIFICATION_CATEGORIES;
    const cached = await this.redisService.get<{ categories: string[] }>(
      cacheKey,
    );
    if (cached) {
      return ResponseDto.success(
        cached,
        'Categories retrieved successfully (cached)',
        HttpStatus.OK,
      );
    }

    const data = {
      categories: Object.values(ETypeLawyer),
    };
    await this.redisService.set(cacheKey, data, REDIS_TTL.ONE_DAY);

    return ResponseDto.success(
      data,
      'Categories retrieved successfully',
      HttpStatus.OK,
    );
  }
}
