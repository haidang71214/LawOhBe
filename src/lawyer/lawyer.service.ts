import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';
import { Booking, CustomPrice, MarketPriceRange, Review, SubTypeLawyer, TypeLawyer, User, VipPackage } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateVipPackageDto } from '../vip-package/dto/create-vippackage.dto';
import { UpdateLawyerDto } from './dto/update-lawyer.dto';
import { FilterLawyerDto } from './dto/filterLawyer.dto';
import { CreateLawyerDto } from './dto/create-lawyer.dto';

@Injectable()
export class LawyerService {
// import chỗ schema kia vô
constructor(
  private readonly cloudUploadService : CloudUploadService,
  private readonly mailService : EmailService,
  private readonly authService : AuthService,
  @InjectModel(User.name) private readonly UserModel: Model<User>,
  @InjectModel(Review.name) private ReviewModal: Model<Review>,
  @InjectModel(TypeLawyer.name) private TypeLawyerModel: Model<TypeLawyer>,
  @InjectModel(SubTypeLawyer.name) private SubTypeLawyerModel: Model<SubTypeLawyer>,
  @InjectModel(VipPackage.name) private VipPackageModel: Model<VipPackage>,
  @InjectModel(Booking.name) private BookingModel: Model<Booking>,
  @InjectModel(MarketPriceRange.name) private MarketPriceRangeModel: Model<MarketPriceRange>,
  @InjectModel(CustomPrice.name) private CustomeerPriceModel: Model<CustomPrice>
){}
// giờ mình sẽ làm thao tác với luật sư trước xong tới thao tác với người dùng
// luật sư sẽ có : thêm các gói
// thấy user trong các gói - thông tin sdt
// accept hoặc reject user
// quản lí lịch làm việc 
// thay đổi lí lịch luật sư trước đã xong mới updat trong chỗ khống chế giá
  async findAllLawyer() {
    try {
      const response = await this.UserModel.findOne({
        role:'lawyer' // chỗ lồn này tự lấy hết cái lawyer ra
      })
      return{
        status:200,
        response
      }
    } catch (error) {
      throw new Error(error)
    }
  }


// cái update của thằng luật sư đang có chút vấn đề ở đây, ở cái chỗ type này có liên kết với cái chỗ set giá
// thay đổi cái là phải xóa cái giá không liên quan ở đây nữa luôn
  async update(updateLawyerDto:UpdateLawyerDto,userId:string) {
    try {
      const thisLawyer = await this.UserModel.findById(userId);
// check userId có phải là luật sư hay hoặc admin, nếu admin thì phải nhập thêm cái lawyerId
      if(thisLawyer?.role === 'lawyer'){
        // bước 1. lấy cái tye_lawyer mới ở đây, bước 2// so sánh với cái type_lawyer cũ, nếu không có thì
        // tâp trung vào cái này hơn nếu có thì thay thế, đồng thời phải xóa cái giá mình bỏ vào với cái type từ trước
        // để thay thế cái type mới
        const {description,type_lawyer,sub_type_lawyers,experienceYear,certificate} = updateLawyerDto
if (thisLawyer.typeLawyer === null || thisLawyer.typeLawyer === undefined ) {
  // ở chỗ này nó đang tạo 1 cái type mới
        const newTypeLawyer = await this.TypeLawyerModel.create({
          type:type_lawyer,
          lawyer_id:thisLawyer._id // chỗ này sẽ lấy cái lawyer dễ hơn
        })
        await this.UserModel.findByIdAndUpdate(userId,{
          description,
          typeLawyer:newTypeLawyer._id,
          certificate,
          experienceYear
        }) 
  // và đang tạo 1 cái subType mới
        await this.SubTypeLawyerModel.create({
          parentType: newTypeLawyer._id ,
          subType:sub_type_lawyers
        })
      }else{
        const idTypeLawyer = thisLawyer.typeLawyer;
        // mình đỉnh vl
        await this.TypeLawyerModel.replaceOne({_id:idTypeLawyer},{
          type:type_lawyer,
          lawyer_id:thisLawyer._id
        });
        // và else thì cũng phải có 1 cái user update
        await this.UserModel.findByIdAndUpdate(userId,{
          description,
          typeLawyer: idTypeLawyer,
          certificate,
          experienceYear
        })
        // sau khi update cái trên thì phải update cái cũ nữa
        await this.SubTypeLawyerModel.replaceOne({
          parentType:idTypeLawyer
        },{
          parentType:idTypeLawyer,
          subType:sub_type_lawyers
        })
        // lấy hết cái type trong chỗ id Type đó, xong mình đối chiếu, có những cái type nào, với cái lawyer_id:userId nào, trùng thì giữ lại, khác thì thay thế
        const findTypeForLawyer = await this.TypeLawyerModel.findById(idTypeLawyer);
        if (!findTypeForLawyer || !findTypeForLawyer.type || !Array.isArray(findTypeForLawyer.type)) {
          throw new BadRequestException('Không tìm thấy thông tin chuyên môn.');
        }
        
        
     // Lấy danh sách customPrices hiện tại
     const existingCustomPrices = await this.CustomeerPriceModel.find({
      lawyer_id: userId,
    }).lean();

    const existingTypes = existingCustomPrices.map((cp) => cp.type);
    const typesProcessed: string[] = [];

    // Xử lý trong map với Promise.all để đảm bảo bất đồng bộ
    await Promise.all(
      findTypeForLawyer.type.map(async (type) => {
        typesProcessed.push(type);
        console.log(`Xử lý type: ${type}`);

        const existingPrice = existingCustomPrices.find((cp) => cp.type === type);

        if (existingPrice) {
          // Giữ lại type trùng khớp (có thể cập nhật nếu cần)
          console.log(`Giữ lại type: ${type}`);
          await this.CustomeerPriceModel.updateOne(
            { lawyer_id: userId, type },
            { $set: { price: existingPrice.price } } // giữ lại giá cũ
          );
        } else {
          // Thay thế/Thêm type mới
          console.log(`Thêm mới type: ${type}`);
          await this.CustomeerPriceModel.updateOne(
            { lawyer_id: userId, type },
            {
              lawyer_id: userId,
              type,
              price: 0, // Giá mặc định
              description: 'Mặc định',
            },
            { upsert: true }
          );
        }
      })
    );

    // Xóa các type không còn trong findTypeForLawyer.type
    const typesToRemove = existingTypes.filter((type) => !typesProcessed.includes(type));
    if (typesToRemove.length > 0) {
      await this.CustomeerPriceModel.deleteMany({
        lawyer_id: userId,
        type: { $in: typesToRemove },
      });
      console.log(`Đã xóa các type không còn tồn tại: ${typesToRemove}`);
    }
        }
      return{
        status:200,
        message: "Cập nhật thành công"
      }
      }
      else{
        return{
          status:400,
          message:"Không phải lawyer thì không sửa được"
        }
      }
    } catch (error) {
      throw new Error(error)
    }
  }
  async updateLawyer(createLawyerDto: CreateLawyerDto, userId: any, id: string) {
    try {
      // Kiểm tra quyền admin
      const checkAdmin = await this.authService.checkAdmin(userId);
      if (!checkAdmin) {
        throw new UnauthorizedException('Không phải admin');
      }

      // Cập nhật role thành 'lawyer' cho user
      await this.UserModel.findByIdAndUpdate(id, { role: 'lawyer' });
      const lawyer = await this.UserModel.findById(id).lean(); // Sử dụng .lean() để lấy dữ liệu thô

      if (!lawyer) {
        throw new BadRequestException('Không tìm thấy luật sư');
      }

      // Điền dữ liệu mặc định nếu không có
      const {
        description = 'Mô tả mặc định',
        type_lawyer = 'INSURANCE',
        sub_type_lawyers = ['Pháp lý cơ bản'],
        experienceYear = 0,
        certificate = 'Chứng chỉ mặc định',
      } = createLawyerDto;

      let typeLawyerId: Types.ObjectId;

      if (!lawyer.typeLawyer) {
        // Tạo mới TypeLawyer nếu chưa có
        const newTypeLawyer = await this.TypeLawyerModel.create({
          type: type_lawyer,
          lawyer_id: id,
        });
        typeLawyerId = newTypeLawyer._id as Types.ObjectId ; // _id là ObjectId

        // Tạo SubTypeLawyer mới
        await this.SubTypeLawyerModel.create({
          parentType: typeLawyerId,
          subType: sub_type_lawyers,
        });
      } else {
        // Cập nhật TypeLawyer hiện tại
        typeLawyerId = lawyer.typeLawyer as Types.ObjectId; // Type assertion để đảm bảo là ObjectId
        await this.TypeLawyerModel.findByIdAndUpdate(typeLawyerId, {
          type: type_lawyer,
          lawyer_id: id,
        });

        // Cập nhật SubTypeLawyer
        await this.SubTypeLawyerModel.updateOne(
          { parentType: typeLawyerId },
          { subType: sub_type_lawyers },
          { upsert: true },
        );
      }

      // Cập nhật thông tin luật sư
      await this.UserModel.findByIdAndUpdate(id, {
        description,
        typeLawyer: typeLawyerId, // Lưu ObjectId
        certificate,
        experienceYear,
      });

      // Xử lý CustomeerPriceModel
      const existingCustomPrices = await this.CustomeerPriceModel.find({ lawyer_id: id }).lean();
      const existingTypes = existingCustomPrices.map((cp) => cp.type);

      await Promise.all(
        (sub_type_lawyers || []).map(async (type) => {
          const existingPrice = existingCustomPrices.find((cp) => cp.type === type);

          if (existingPrice) {
            await this.CustomeerPriceModel.updateOne(
              { lawyer_id: id, type },
              { $set: { price: existingPrice.price } },
            );
          } else {
            await this.CustomeerPriceModel.updateOne(
              { lawyer_id: id, type },
              {
                lawyer_id: id,
                type,
                price: 0,
                description: 'Mặc định',
              },
              { upsert: true },
            );
          }
        }),
      );

      return {
        status: 200,
        message: `Luật sư với ID ${id} đã được cập nhật thành công`,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new BadRequestException(`Lỗi khi cập nhật luật sư: ${error.message}`);
    }
  }
  
// xóa luật sư ? 
  remove(id: number) {
    return `This action removes a #${id} lawyer`;
  }

//
async filterLawyers(filterDto: FilterLawyerDto): Promise<{ data: any[], total: number }> {
  const { stars, typeLawyer, province, page = 1, limit = 10 } = filterDto;
  const query: any = { role: 'lawyer' };

  // Lọc theo số sao (nếu có)
  if (stars !== undefined) {
    query.star = stars; // Corrected 'start' to 'star'
  }
  console.log(filterDto);
  
  // Lọc theo loại luật sư
  if (typeLawyer) {
    const typeLawyers = await this.TypeLawyerModel
      .find({ type: { $regex: typeLawyer, $options: 'i' } })
      .select('lawyer_id')
      .exec();
    const lawyerIds = typeLawyers.map((type) => type.lawyer_id);

    if (lawyerIds.length > 0) {
      query._id = { $in: lawyerIds };
    } else {
      return { data: [], total: 0 };
    }
  }

  // Lọc theo tỉnh thành
  if (province) {
    query.province = { $regex: province, $options: 'i' };
  }

  // Tính toán phân trang
  const skip = (page - 1) * limit;
  
  // Truy vấn dữ liệu với phân trang và sắp xếp theo số sao (star) giảm dần
  const [data, total] = await Promise.all([
    this.UserModel
      .find(query)
      .populate('typeLawyer')
      .sort({ star: -1 }) // Sắp xếp theo star giảm dần (cao nhất lên đầu, 0 ở cuối)
      .skip(skip)
      .limit(limit)
      .exec(),
    this.UserModel.countDocuments(query).exec()
  ]);

  return { data, total };
}

async getDetailLawyer(id: string) {
  try {
    // Giả sử UserModel có field typeLawyer kiểu ObjectId ref 'TypeLawyer'
    console.log(id);
    
    const data = await this.UserModel.findById(id)
      .populate({
        path: 'typeLawyer', // populate đến TypeLawyer
      });

    // Lấy thêm subTypes và bảng giá
    if (data && data.typeLawyer) {
      // Lấy các subtypes của loại luật sư
      const subTypes = await this.SubTypeLawyerModel.find({
        parentType: data.typeLawyer._id,
      });
      console.log(data.id); // ??? .id thì được
      
      // Lấy giá tiền từ bảng CustomPrice cho luật sư
      const customPrice = await this.CustomeerPriceModel.find({
        lawyer_id: data.id,
      });

      // Trả về dữ liệu, bao gồm cả subtypes và customPrice
      return {
        status: 200,
        data: {
          ...data.toObject(),
          subTypes,
          customPrice, // Thêm bảng giá vào kết quả
        },
      };
    }

    return { status: 404, message: 'Lawyer not found' };
  } catch (error) {
    console.error(error);
    throw error;
  }
}


}
