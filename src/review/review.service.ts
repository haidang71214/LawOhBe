import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Booking, Review, User } from 'src/config/database.config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name) private ReviewModel: Model<Review>,
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Booking.name) private BookingModel: Model<Booking>
  ){}
  
  async create(createReviewDto: CreateReviewDto,
    lawyer_id:string,
    client_id:string
  ) {
    try {
      // review date
      const {rating,comment} = createReviewDto

      const newReview = await this.ReviewModel.create({
        client_id,
        lawyer_id,
        rating,
        comment,
        review_date:new Date()
      })
      // tổng số sao / số người review

      const reviews = await this.ReviewModel.find({ lawyer_id }).lean();
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length; // Số sao trung bình
      const roundedAverageRating = Math.ceil(averageRating); // Quy tròn lên
      
      const lawyerUpdated =  await this.UserModel.findByIdAndUpdate(lawyer_id,{
        $push: { reviews: newReview._id }, // Thêm review vào mảng reviews
        star: roundedAverageRating, // Cập nhật số sao trung bình (đã quy tròn)
      },);
      // xóa booking sau khi review xong

      const deleteBooking = await this.BookingModel.findOneAndDelete({
        client_id:client_id,
        lawyer_id

      })
      return{
        status:200,
        message:"tạo review luật sư thành công"
      }
    } catch (error) {
      throw new Error(error)
    }
  }

//
  async findAll(lawyer_id:string) {
   try {
      const data = await this.ReviewModel.find({lawyer_id}).populate({
       path:'client_id', // lấy cái path này 
        model:'User'
      })
      return data
   } catch (error) {
    throw new Error(error)
   }
  }

  findOne(id: number) {
    return `This action returns a #${id} review`;
  }

  update(id: number, updateReviewDto: UpdateReviewDto) {
    return `This action updates a #${id} review`;
  }

  remove(id: number) {
    return `This action removes a #${id} review`;
  }
}
