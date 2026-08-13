import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LawyerPayment, LawyerPaymentModelName } from 'libs/schemas';
import { BaseRepository } from 'libs/repository';

@Injectable()
export class LawyerPaymentRepository extends BaseRepository<LawyerPayment> {
  constructor(
    @InjectModel(LawyerPaymentModelName)
    private readonly lawyerPaymentModel: Model<LawyerPayment>,
  ) {
    super(lawyerPaymentModel);
  }

  async findByPaymentId(
    paymentId: string | Types.ObjectId,
  ): Promise<LawyerPayment | null> {
    return this.findOne({ payment_id: paymentId });
  }

  async getIncomeSummary(lawyerId: string | Types.ObjectId): Promise<{
    totalTransactions: number;
    totalGrossRevenue: number;
    totalNetIncome: number;
    totalPlatformCommission: number;
  }> {
    const lawyerObjectId =
      typeof lawyerId === 'string' ? new Types.ObjectId(lawyerId) : lawyerId;

    const result = await this.lawyerPaymentModel.aggregate([
      {
        $match: {
          lawyer_id: lawyerObjectId,
          status: 'success',
          isDeleted: { $ne: true },
        },
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalNetIncome: { $sum: '$amount' },
          totalPlatformCommission: { $sum: '$commission' },
        },
      },
    ]);

    if (!result || result.length === 0) {
      return {
        totalTransactions: 0,
        totalGrossRevenue: 0,
        totalNetIncome: 0,
        totalPlatformCommission: 0,
      };
    }

    const summary = result[0];
    const totalGrossRevenue =
      (summary.totalNetIncome || 0) + (summary.totalPlatformCommission || 0);

    return {
      totalTransactions: summary.totalTransactions || 0,
      totalGrossRevenue,
      totalNetIncome: summary.totalNetIncome || 0,
      totalPlatformCommission: summary.totalPlatformCommission || 0,
    };
  }
}
