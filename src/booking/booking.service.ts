import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { AuthService } from 'src/auth/auth.service';
import { Booking, CustomPrice, MarketPriceRange, Payment, Review, TypeLawyer, User, VipPackage } from 'src/config/database.config';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EmailService } from 'src/email/email.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BookingService {
  constructor(
    private readonly authService:AuthService,
    private readonly mailService : EmailService,
    @InjectModel(User.name) private UserModel: Model<User>,
    @InjectModel(Booking.name) private BookingModel: Model<Booking>,
    @InjectModel(VipPackage.name) private VipPackageModel: Model<VipPackage>,
    @InjectModel(TypeLawyer.name) private TypeLawyerModel: Model<TypeLawyer>,
    @InjectModel(Review.name) private ReviewModel: Model<Review>,
    @InjectModel(MarketPriceRange.name) private MarketPriceRangeModel: Model<MarketPriceRange>, // db set cứng khoảng giá
    @InjectModel(CustomPrice.name) private CustomPriceModel: Model<CustomPrice>,
    @InjectModel(Payment.name) private PaymentModel: Model<Payment>
  ){}
  // booking là của client tạo
  async create(createBookingDto: CreateBookingDto,userId:string) {
    try {
      const {lawyer_id,booking_end,booking_start,typeBooking,note} = createBookingDto
      // lấy giá từ chính cái giá mà thằng luật sư đó setup
      const findCustomPriceByLawyer = await this.CustomPriceModel.findOne({
        lawyer_id:lawyer_id,
        type:typeBooking
      })
      //check bookingDate now
      if (!findCustomPriceByLawyer) {
        throw new Error('Không tìm thấy giá cho loại tư vấn này.');
      }

      // Chuyển đổi thời gian thành đối tượng Date
      const startDate = new Date(booking_start);
      const endDate = new Date(booking_end);

      // Kiểm tra thời gian hợp lệ
      if (endDate <= startDate) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu.');
      } 
      if(startDate <= new Date()){
        throw new Error(' ít nhất bắt đầu từ hôm nay')
      }

      // Tính số ngày
      const timeDiff = endDate.getTime() - startDate.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Số ngày

      // Tính income
      const basePrice = findCustomPriceByLawyer.price;
      const totalIncome = basePrice * daysDiff; // Tổng thu nhập

      const lawyerIncome = totalIncome; // 90% cho lawyer
      
      const findBooking = await this.BookingModel.findOne({lawyer_id,client_id:userId,typeBooking})
      if(findBooking){
        await this.BookingModel.findOneAndUpdate(
          { lawyer_id, client_id: userId, typeBooking },
          {
            $set: {
              booking_end,
              booking_start,
              status: 'none',
              income: lawyerIncome,
              typeBooking,
              note
            }
          },
          { new: true } // Trả về bản ghi mới nhất sau khi cập nhật
        );
        return {
          res: 200,
          message: 'Cập nhật booking thành công', 
        };
      }
      
      

      // tính income, mình có thể lấy 10% user -> admin -> lawyer
      const respone = await this.BookingModel.create({
        lawyer_id,
        client_id:userId,
        booking_end,
        booking_start,
        status:'none',
        income:lawyerIncome, // income được lấy từ cái tiền, type của thằng lawyer
        typeBooking,
        note
      });
      return{
        res:200,
        message:respone
      }
    } catch (error) {
      throw new Error(error)
    }
  }
// thuật toán chỗ này cần chặt chẽ hơn
// thanh toán 
// có 1 chỗ income ở đây, nó sẽ tự tính dựa trên cái type mà luật sư đó set/ngày

  async acceptBooking(lawyerid:string,client_id:string,booking_id:string){
    // thêm 1 cái là bookingId nữa, khi accept thì nó tự cập nhật cái đó
    try {
      const check = await this.authService.checkLawyer(lawyerid);
      if(check){
        //'none','accept','reject'
        // ủa lỡ nó update 1 cái type là ăn cứt ??, lấy thêm điều kiện là
       const bookingData =  await this.BookingModel.findOneAndUpdate({client_id,lawyer_id:lawyerid},{
          status:"accept"   
        })
 // cái lồn này accept cái là mấy cái khác xóa,check thêm 1 điều kiện về type nữa
          await this.BookingModel.deleteMany({
          client_id,
          lawyer_id: { $ne: lawyerid }, // nó sẽ tự xóa những cái mà nó liên kết với những lawyer khác
          typeBooking : bookingData?.typeBooking
       });
       const clientData = await this.UserModel.findById(bookingData?.client_id);
       const lawyerData = await this.UserModel.findById(bookingData?.lawyer_id);
         // to, tittle, content
       
       if (clientData?.email) {
         try {
           await this.mailService.sendMail(
             clientData.email,
             `Luật sư ${lawyerData?.name} đã accept mẫu booking của bạn`,
             `Vui lòng thanh toán chi phí trang web `
           );
           console.log("Email đã được gửi tới khách hàng.");
         } catch (mailError) {
           console.error("Lỗi khi gửi email:", mailError);
         }
       } else {
         console.error("Không có email của khách hàng");
       }
// lôi cái booking ra 


 const bookingShiet = await this.BookingModel.findOne({
  client_id,
  lawyer_id:lawyerid,
  _id: new Types.ObjectId(booking_id) // ép kiểu về obj
 })
// tạo mới 1 cái payment cho client và admin
      const orderId = uuidv4();
      await this.PaymentModel.create({
        transaction_no: orderId,
        amount:bookingShiet?.income,
        payment_method: 'VNPAY',
        status: 'pending',
        client_id: new Types.ObjectId(client_id),
        lawyer_id: new Types.ObjectId(lawyerid),
      });
      } 

      return{
        status:200,
        message:"Đã accept thành công"
      }
    } catch (error) {
      throw new Error(error)
    }
  }

  async findAll(userId:string) {
    try {
      const results = await this.BookingModel.find({lawyer_id:userId})
      
      return{
        status:200,
        results
      }
    } catch (error) {
      throw new Error(error)
    }
  }
// logic để lấy đã đặt là nằm ở đây
  async findOne(id: string,userId:string) {
   try {
    const response = await this.BookingModel.findOne({
      client_id:id,
      lawyer_id:userId
    })
    return{
      status:200,
      response
    }
   } catch (error) {
    throw new Error(error)
   }
  }

// reject thì sẽ có mail báo lại user
  async DeleteBooking(lawyerid :string,client_id:string,booking_id:string){
    try {
      // check có phải lawyer không 
      const check = await this.authService.checkLawyer(lawyerid);
      console.log("check Laywer Result",check);
      
      if(check){
        console.log(check);
      // reject thì giữ nguyên, không xóa
      const bookingData = await this.BookingModel.findOneAndUpdate({client_id,lawyer_id:lawyerid,_id:new Types.ObjectId(booking_id)},{
          status:"reject"   
        })
        
      const clientData = await this.UserModel.findById(bookingData?.client_id);
      const lawyerData = await this.UserModel.findById(bookingData?.lawyer_id);
        // to, tittle, content
      
      if (clientData?.email) {
        try {
          await this.mailService.sendMail(
            clientData.email,
            `Luật sư ${lawyerData?.name} đã từ chối mẫu booking của bạn`,
            "Vui lòng tìm luật sư khác phù hợp hơn ạ"
          );
          console.log("Email đã được gửi tới khách hàng.");
        } catch (mailError) {
          console.error("Lỗi khi gửi email:", mailError);
        }
      } else {
        console.error("Không có email của khách hàng");
      }
      


      } 
      return{
        status:200,
        message:"Đã Reject thành công"
      }
    } catch (error) {
      throw new Error(error)
    }
}

async cancelBooking(
userId:string,
id:string
){
try {
  const checkStatus = await this.BookingModel.findOne({client_id:userId,_id:id})
  if(checkStatus?.status === 'accept' || checkStatus?.status === 'reject'){
    return{
      status:409,
      message:`Đã được luật sư ${checkStatus.status}, cần liên hệ với admin để hủy trạng thái booking`
    }
  }
  // check trong trường hợp chưa được accept hoặc reject
  await this.BookingModel.findOneAndDelete({client_id:userId,_id:id})
  return{
    status:200,
    message:'Đã reject thành công'
  }
  // trong trường hợp chưa accept hoặc reject thì xóa được
  
} catch (error) {
  throw new Error(error)
}
}
async autoClearBooking(){
  try {
   await this.BookingModel.deleteMany(
    { status: 'reject' }
  );
    return{
      status:200,
      message:"Delete successfull"
    }
  } catch (error) {
    throw new Error(error)
  }
}
async sendEmailsForClient() {
  try {
    const currentDate = new Date(); // 08:42 AM 19/05/2025 +07
    const oneDayInMs = 24 * 60 * 60 * 1000;

    // Sử dụng type LeanBooking
    const acceptedBookings = await this.BookingModel.find({
      status: 'accepted',
    });

    // Update trạng thái là done nếu booking_end nó đã quá hạn so với ngày hiện tại
    for (const booking of acceptedBookings) {
      const bookingEnd = new Date(booking.booking_end);
      // Kiểm tra nếu booking đã quá hạn
      if(bookingEnd < currentDate){
          await this.BookingModel.updateOne(
          { _id: booking._id }, // Cập nhật booking theo id
          // nếu tự động cập nhật booking quá ngày sang trạng thái done -> đông thời gửi review
          { status: 'done' }
        );
        // email
        const findUserDone = await this.UserModel.findById(booking.client_id)
        const lawyerDone = await this.UserModel.findById(booking.lawyer_id)
        await this.mailService.sendMail(
          `${findUserDone?.email}`,
          `Mời vô review luật sư ${lawyerDone?.name}`,
          "cảm ơn bạn đã sử dụng dịch vụ",
        )
      }
   // sau khi đánh giá xong thì tự động xóa cái booking
    }
  } catch (error) {
    throw new BadRequestException('Lỗi khi xử lý gửi email.');
  }
}

}
