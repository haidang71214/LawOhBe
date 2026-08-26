import { Injectable } from '@nestjs/common';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private CommentModel: Model<Comment>,
    private readonly authService :AuthService

  ){
  }
  async create(createCommentDto: CreateCommentDto,userId:string,id:string) {
    try {
      const {content,parent_comment_id} = createCommentDto
      const data = await this.CommentModel.create({
        user_id:userId,
        content,
        parent_comment_id: parent_comment_id || null || undefined || "",
        video_id:id
      })
      return{
        status:200,
        data
      }
    } catch (error) {
      throw new Error(error)
    }
  }


  async remove(id: string,userId:string) {
    try {
      // trường hợp có những cái comment con nhỏ nhỏ nữa
      // ý là nó chỉ cần check xem có phải đó là thằng xóa không, nếu không thì không xóa được, không cần check role
      const data = await this.CommentModel.findOne({
        _id:id,
        user_id:userId
      }); // kiếm hết cái data ở trên
      if(data){
        await Promise.all([
           this.CommentModel.deleteMany({
            parent_comment_id:data._id 
          }),
           this.CommentModel.deleteOne({
            _id:id,
            user_id:userId
          })
        ])
      }
      return {
        status:400,
        message:"Không tìm thấy comment cần xóa"
      }
    } catch (error) {
      throw new Error(error)
    }
  }
}
