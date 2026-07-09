import {
  FilterQuery,
  Model,
  PopulateOptions,
  QueryOptions,
  UpdateQuery,
  Types,
} from 'mongoose';

export abstract class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async create(doc: Partial<T> | any): Promise<T> {
    const created = new this.model(doc);
    return (await created.save()) as unknown as T;
  }

  async findById(
    id: string | Types.ObjectId,
    populate?: any,
    select?: string,
  ): Promise<T | null> {
    let query = this.model.findById(id);
    if (populate) {
      query = query.populate(populate as any);
    }
    if (select) {
      query = query.select(select);
    }
    return query.exec();
  }

  async findOne(
    filter: FilterQuery<T>,
    populate?: any,
    select?: string,
  ): Promise<T | null> {
    let query = this.model.findOne(filter);
    if (populate) {
      query = query.populate(populate as any);
    }
    if (select) {
      query = query.select(select);
    }
    return query.exec();
  }

  async find(
    filter: FilterQuery<T> = {},
    populate?: any,
    sort?: any,
    select?: string,
  ): Promise<T[]> {
    let query = this.model.find(filter);
    if (populate) {
      query = query.populate(populate as any);
    }
    if (sort) {
      query = query.sort(sort);
    }
    if (select) {
      query = query.select(select);
    }
    return query.exec();
  }

  async findWithPagination(
    filter: FilterQuery<T>,
    page = 1,
    limit = 10,
    sort: any = { createdAt: -1 },
    populate?: any,
    select?: string,
  ): Promise<{ data: T[]; total: number }> {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    let query = this.model.find(filter).sort(sort).skip(skip).limit(limitNum);
    if (populate) {
      query = query.populate(populate as any);
    }
    if (select) {
      query = query.select(select);
    }

    const [data, total] = await Promise.all([
      query.exec(),
      this.model.countDocuments(filter).exec(),
    ]);

    return { data, total };
  }

  async findByIdAndUpdate(
    id: string | Types.ObjectId,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, update, options).exec();
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
    options: QueryOptions = { new: true },
  ): Promise<T | null> {
    return this.model.findOneAndUpdate(filter, update, options).exec();
  }

  async updateMany(
    filter: FilterQuery<T>,
    update: UpdateQuery<T>,
  ): Promise<any> {
    return this.model.updateMany(filter, update).exec();
  }

  async deleteOne(filter: FilterQuery<T>): Promise<any> {
    return this.model.deleteOne(filter).exec();
  }

  async findOneAndDelete(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOneAndDelete(filter).exec();
  }

  async deleteMany(filter: FilterQuery<T>): Promise<any> {
    return this.model.deleteMany(filter).exec();
  }

  async countDocuments(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }
}
