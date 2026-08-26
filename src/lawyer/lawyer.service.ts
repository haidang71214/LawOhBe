import { Injectable } from '@nestjs/common';
import { CloudUploadService } from 'src/shared/cloudUpload.service';
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';
import { Booking, MarketPriceRange, Review, SubTypeLawyer, TypeLawyer, User, VipPackage } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateVipPackageDto } from '../vip-package/dto/create-vippackage.dto';
import { UpdateLawyerDto } from './dto/update-lawyer.dto';

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
  @InjectModel(MarketPriceRange.name) private MarketPriceRangeModel: Model<MarketPriceRange>
){}
// giờ mình sẽ làm thao tác với luật sư trước xong tới thao tác với người dùng
// luật sư sẽ có : thêm các gói
// thấy user trong các gói - thông tin sdt
// accept hoặc reject user
// quản lí lịch làm việc 
// thay đổi lí lịch luật sư trước đã xong mới updat trong chỗ khống chế giá
  findAll() {
    return `This action returns all lawyer`;
  }

  findOne(id: number) {
    return `This action returns a #${id} lawyer`;
  }

  // cái người luật sư đó update chuyên ngành của chính luật sư đó
  async update(updateLawyerDto:UpdateLawyerDto,userId:string) {
    try {
      const thisLawyer = await this.UserModel.findById(userId);
      if(thisLawyer?.role === 'lawyer'){
        const {description,type_lawyer,sub_type_lawyers} = updateLawyerDto

if (thisLawyer.typeLawyer === null || thisLawyer.typeLawyer === undefined) {
// giờ mình sẽ kiểm tra, có rồi thì update, chưa có thì create
// trong trường hợp dưới là chưa có
// tạo mới 1 cái typelawyer
        const newTypeLawyer = await this.TypeLawyerModel.create({
          type:type_lawyer
        })
        await this.UserModel.findByIdAndUpdate(userId,{
          description,
          typeLawyer:newTypeLawyer._id
        })
// cái này lấy cái id từ typelawyer
// bên fe sẽ duyệt mảng type_lawyer -> cho phép những cái gì có trong subtype
// tạo mới 1 cái subtype
        await this.SubTypeLawyerModel.create({
          parentType: newTypeLawyer._id ,
          subType:sub_type_lawyers
        })
      }else{
        const idTypeLawyer = thisLawyer.typeLawyer;
        console.log(idTypeLawyer);
        
        // hắn sẽ tìm đến cái id đó xong thay thế hoàn toàn bằng cái mới
        await this.TypeLawyerModel.replaceOne({_id:idTypeLawyer},{
          type:type_lawyer
        });
        // sau khi update cái trên thì phải update cái cũ nữa
        await this.SubTypeLawyerModel.replaceOne({
          parentType:idTypeLawyer
        },{
          parentType:idTypeLawyer,
          subType:sub_type_lawyers
        })
        }
// tạo 1 cái để khống chế cái booking 
        

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

  remove(id: number) {
    return `This action removes a #${id} lawyer`;
  }
}
