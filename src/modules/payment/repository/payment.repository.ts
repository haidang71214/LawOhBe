import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class PaymentRepository extends BaseRepository<Payment> {
  constructor(
    @InjectModel(PaymentModelName)
    private readonly paymentModel: Model<Payment>,
  ) {
    super(paymentModel);
  }

  async findByTransactionNo(transactionNo: string): Promise<Payment | null> {
    return this.findOne({ transaction_no: transactionNo });
  }
}
