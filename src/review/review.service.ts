import { Injectable } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
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
      const {rating,comment} = createReviewDto

      const newReview = await this.ReviewModel.create({
        client_id,
        lawyer_id,
        rating,
        comment,
        review_date:new Date()
      })

      const reviews = await this.ReviewModel.find({ lawyer_id }).lean();
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length; 
      const roundedAverageRating = Math.ceil(averageRating); 
      
       await this.UserModel.findByIdAndUpdate(lawyer_id,{
        $push: { reviews: newReview._id }, 
        star: roundedAverageRating, 
      },);

       await this.BookingModel.findOneAndDelete({
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

  async findAll(lawyer_id:string) {
   try {
      const data = await this.ReviewModel.find({lawyer_id}).populate({
       path:'client_id', 
        model:'User'
      })
      return data
   } catch (error) {
    throw new Error(error)
   }
  }

}
