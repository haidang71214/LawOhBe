import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import { ClassificationRequestDto } from './classification.dto';
import { TypeLawyer, User, ETypeLawyer } from 'src/config/database.config';

@Injectable()
export class ClassificationService {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(TypeLawyer.name) private typeLawyerModel: Model<TypeLawyer>,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_1');
    if (!apiKey) {
      throw new Error('GEMINI_API_1 environment variable is required');
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async classifyText(request: ClassificationRequestDto){
    try {
      const result: GenerateContentResult = await this.model.generateContent(
        `Understand the input and perform task: ${request.text}. Task: Classify the input into one of these categories ('INSURANCE', 'CORPORATE', 'CRIMINAL', 'INTELLECTUAL_PROPERTY', 'CIVIL', 'TRANSPORTATION', 'FAMILY', 'INHERITANCE', 'LAND', 'ADMINISTRATIVE', 'LABOR', 'TAX'). Just give me only the category, not generate more text`
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

      let lawyerList: [] = [];

      if (category !== 'UNKNOWN') {
        const typeLawyers = await this.typeLawyerModel
          .find({ type: category })
          .exec();

        if (typeLawyers.length > 0) {
          const lawyerIds = typeLawyers.map(typeLawyer => typeLawyer.lawyer_id);

          const lawyers = await this.userModel
            .find({
              _id: { $in: lawyerIds },
              role: 'lawyer',
            }).populate('typeLawyer')
            .sort({ star: -1, experienceYear: -1 }) // Sort by star rating and experience (descending)
            .exec();

           const lawyerList = lawyers.map(lawyer => ({...(lawyer.toObject() as any),access_token: undefined, refresh_token: undefined,password:undefined,reviews:undefined}));
      
      return {
        category,
        input_text: request.text,
        lawyers: [...lawyerList],
      };
        }
      }
    console.log(lawyerList);
    
    } catch (error) {
      console.log(error);
      
      if (error instanceof Error && error.message.includes('API')) {
        throw new HttpException(
          `Lỗi khi gọi Gemini API: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        `Lỗi khi phân loại văn bản: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCategories(): Promise<any> {
    const categories = {
      INSURANCE: 'Bảo hiểm',
      CORPORATE: 'Doanh nghiệp',
      CRIMINAL: 'Hình sự',
      INTELLECTUAL_PROPERTY: 'Sở hữu trí tuệ',
      CIVIL: 'Dân sự',
      TRANSPORTATION: 'Giao thông - Vận tải',
      FAMILY: 'Hôn nhân gia đình',
      INHERITANCE: 'Thừa kế - Di chúc',
      LAND: 'Đất đai',
      ADMINISTRATIVE: 'Hành chính',
      LABOR: 'Lao động',
      TAX: 'Thuế',
    };
    return { categories };
  }
}