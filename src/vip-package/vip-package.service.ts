import { Injectable } from '@nestjs/common';
import { UpdateVipPackageDto } from './dto/update-vip-package.dto';
import { User, VipPackage } from 'src/config/database.config';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateVipPackageDto } from './dto/create-vippackage.dto';

@Injectable()
export class VipPackageService {
  constructor(
     @InjectModel(User.name) private readonly UserModel: Model<User>,
     @InjectModel(VipPackage.name) private VipPackageModel: Model<VipPackage>,
  ){}
   async create(createVipPackagedto: CreateVipPackageDto,userId :string){
      try {
        const {name,type,price,vip_expired,benefits} = createVipPackagedto 
        const checkAdmin = await this.UserModel.findById(userId);
        if(checkAdmin?.role === 'admin'){
        const results =  await this.VipPackageModel.create({
          name,
          type,
          price,
          vip_expired,
          benefits
        })
        return {
        status:200,
        message:results
        }
        }else{
          return {
            status:400,
            message:"Không phải Admin"
          }
        }
      } catch (error) {
       throw new Error(error)
      }
    }

  // lấy hết gói vip
  async findAll() {
    try {
      const result = await this.VipPackageModel.find();
      return{
        status:200,
        result
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  async findOne(id: string) {
    try {
      const results = await this.VipPackageModel.findById(id);
      return{
        status:200,
        results
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  async update(id: string, updateVipPackageDto: UpdateVipPackageDto) {
   try {
    const result = await this.VipPackageModel.findByIdAndUpdate(id,{
      desctiption:updateVipPackageDto.description,
      price:updateVipPackageDto.price,
      vip_expired:updateVipPackageDto.vip_expired,
      benefits:updateVipPackageDto.benefits
    })
    return{
      status:200,
      result
    }
   } catch (error) {
    throw new Error(error)
   }
  }

  async remove(id: string) {
    try {
      await this.VipPackageModel.findByIdAndDelete(id)
      return{status:200,result:"Xóa thành công"}
    } catch (error) {
      throw new Error(error)
    }
  }
}
