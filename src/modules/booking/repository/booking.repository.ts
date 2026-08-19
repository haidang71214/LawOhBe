import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Booking, BookingModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class BookingRepository extends BaseRepository<Booking> {
  constructor(
    @InjectModel(BookingModelName)
    private readonly bookingModel: Model<Booking>,
  ) {
    super(bookingModel);
  }

  async findConflictingBooking(
    lawyerId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<Booking | null> {
    return this.findOne({
      lawyer_id: lawyerId,
      booking_start: { $lt: endDate },
      booking_end: { $gt: startDate },
      status: { $in: ['pending', 'accept', 'paid'] },
      isDeleted: { $ne: true },
    });
  }
}
