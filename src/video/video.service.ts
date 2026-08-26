import { Injectable } from '@nestjs/common';
import { CreateVideoDto } from './dto/create-video.dto';
import { Comment, User, Videos } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AcceptRejectAction, AcceptRejectDto } from './dto/acceptRejectBody';
import { EmailService } from 'src/email/email.service';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Videos.name) private VideosModel: Model<Videos>,
    @InjectModel(Comment.name) private CommentModel: Model<Comment>,
    @InjectModel(User.name) private UserModel: Model<User>,
    private readonly emailService:EmailService,
    private readonly authService : AuthService
  ){}
// người dùng tạo video mới
  async create(createVideoDto: CreateVideoDto,userId:string) {
    try {
    // lấy cái video url từ cái video gán vô
      const checkUser = await this.UserModel.findById(userId);
      if(!checkUser){
        return {
          status:404,
          message:'hong xác phải user'
        }
      }
      const {categories,video_url,description,thubnail_url} = createVideoDto
      const data = await this.VideosModel.create({
        user_id:userId,
        star:0,
        description,
        video_url,
        thumnail_url:thubnail_url,
        categories,
        accept:false
      })
      return {
        status:200,
        mnessage:data
      }
    } catch (error) {
      throw new Error(error);
      
    }
  }

  async findAll(filterObj:any) {
   try {
    const {page,limit,type} = filterObj
    const whereCondition:any = {
      accept:true
    };
    // gán khi có
    if(type){
      whereCondition.categories = type
    }
    const skip = (page - 1)*limit;
    // lấy 2 cái này từ cái hàm đồng bộ xong in ra
    const [item,total] = await Promise.all([
      this.VideosModel.find(whereCondition).skip(skip).limit(limit).exec(),
      this.VideosModel.countDocuments(whereCondition).exec()
    ])
    // item là chính nó, total: tổng. page:, limit
    return{
      item,total,page,limit
    }
   } catch (error) {
    throw new Error(error)
   }
  }

  // admin duyệt video
// admin xóa video/ nêu rõ lí do, gửi về gmail

  async findOne(id: string) {
    try {
      const data = await this.VideosModel.findById(id).populate({
        path:'user_id',
        select:'name'
      })
      const comment = await this.CommentModel.find({video_id:id}).populate({        path:'user_id',
        select:'name'})
      return {
        status:200,
        data,
        comment
      }
    } catch (error) {
      throw new Error(error)
    }
  }
  async acceptOrReject(body: AcceptRejectDto, userId: string, id: string) {
    try {
      const checkUser = await this.authService.checkAdmin(userId);
      if (!checkUser) {
        return {
          status: 404,
          message: 'Không phải admin',
        };
      }

      const { reason, action } = body;
      console.log('hehehasjhdaskjhdka',body);
      
      if (action === AcceptRejectAction.REJECT && reason) {
        // Trường hợp reject
        const findRejectVideo = await this.VideosModel.findById(id);
        if (findRejectVideo && findRejectVideo.user_id) {
          const findUserEmailPubVideo = await this.UserModel.findById(findRejectVideo.user_id);
          if (findUserEmailPubVideo && findUserEmailPubVideo.email) {
            await this.emailService.sendMail(
              findUserEmailPubVideo.email,
              reason,
              'chúng tôi xin phép từ chối up video của bạn lên, và xóa video',
            );
          }
          await this.VideosModel.findByIdAndDelete(id);
        }
        return {
          status: 200,
          message: 'Cập nhật thành công',
        };
      } else if (action === AcceptRejectAction.ACCEPT && reason) {
        // Trường hợp accept
        const findAcceptVideo = await this.VideosModel.findById(id);
        if (findAcceptVideo && findAcceptVideo.user_id) {
          const findUserEmailPubVideo = await this.UserModel.findById(findAcceptVideo.user_id);
          if (findUserEmailPubVideo && findUserEmailPubVideo.email) {
            await this.emailService.sendMail(
              findUserEmailPubVideo.email,
              reason,
              'Chúng tôi đã duyệt video của bạn ạ',
            );
          }
          await this.VideosModel.findByIdAndUpdate(id, { accept: true });
        }
        return {
          status: 200,
          message: 'Cập nhật thành công',
        };
      }

      return {
        status: 400,
        message: 'Cần có các trường để cập nhật',
      };
    } catch (error) {
      return {
        status: 500,
        message: 'Đã xảy ra lỗi',
        error: error.message,
      };
    }
  }
  async getAllForAdmin(userId: string, status: string) {
    try {
      const isAdmin = await this.authService.checkAdmin(userId); 
      if (!isAdmin) {
        return {
          status: 403,
          message: 'Bạn không có quyền truy cập',
        };
      }
      let query: any = {};
      if (status) {
        const statusValue = status.toLowerCase() === 'true';
        query = { accept: statusValue };
      } else {
        query = {};
      }
      const videos = await this.VideosModel.find(query)
        .sort({ accept: 1 }) 
        .exec();

      return {
        status: 200,
        data: videos,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getPrivateVideo(userId: string) {
    try {
      const videos = await this.VideosModel.find({ user_id: userId }).exec();
      if (!videos || videos.length === 0) {
        return {
          status: 404,
          data: 'Không tìm thấy video nào',
        };
      }

      return {
        status: 200,
        data: videos,
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

// người đăng xóa video hoặc admin xóa video
 async remove(id: string,userId:String) {
    try {
// =)))))) khỏi check
      await this.VideosModel.findByIdAndDelete(id)
      
      return{
        message:"hehe"
      }
    } catch (error) {
      throw new Error(error)
    }
  }

}
