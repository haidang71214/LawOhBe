import { BaseRepository } from './base.repository';
import { Model } from 'mongoose';

class TestEntity {
  _id: string;
  name: string;
  isDeleted?: boolean;
}

class TestRepository extends BaseRepository<TestEntity> {
  constructor(model: Model<TestEntity>) {
    super(model);
  }
}

describe('BaseRepository (Unit Test)', () => {
  let repository: TestRepository;
  let mockModel: any;

  beforeEach(() => {
    mockModel = function (data: any) {
      return {
        ...data,
        save: jest.fn().mockResolvedValue({ _id: 'generated_id', ...data }),
      };
    };

    mockModel.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: '1', name: 'Test User' }),
    });

    mockModel.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ _id: '1', name: 'Test User' }),
    });

    mockModel.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([{ _id: '1', name: 'Test User' }]),
    });

    mockModel.countDocuments = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(1),
    });

    mockModel.findByIdAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: '1', name: 'Updated User' }),
    });

    mockModel.findOneAndUpdate = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ _id: '1', name: 'Updated User' }),
    });

    mockModel.updateMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ modifiedCount: 2 }),
    });

    mockModel.deleteMany = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue({ deletedCount: 1 }),
    });

    repository = new TestRepository(mockModel as unknown as Model<TestEntity>);
  });

  it('should create an entity successfully', async () => {
    const result = await repository.create({ name: 'New Item' });
    expect(result).toBeDefined();
    expect(result._id).toBe('generated_id');
    expect(result.name).toBe('New Item');
  });

  it('should find entity by ID', async () => {
    const result = await repository.findById('1');
    expect(mockModel.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual({ _id: '1', name: 'Test User' });
  });

  it('should find one entity by filter', async () => {
    const result = await repository.findOne({ name: 'Test User' });
    expect(mockModel.findOne).toHaveBeenCalledWith({ name: 'Test User' });
    expect(result).toEqual({ _id: '1', name: 'Test User' });
  });

  it('should find with pagination correctly', async () => {
    const result = await repository.findWithPagination(
      { isDeleted: false },
      1,
      10,
    );
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should findByIdAndUpdate entity', async () => {
    const result = await repository.findByIdAndUpdate('1', {
      name: 'Updated User',
    });
    expect(mockModel.findByIdAndUpdate).toHaveBeenCalledWith(
      '1',
      { name: 'Updated User' },
      { new: true },
    );
    expect(result?.name).toBe('Updated User');
  });

  it('should updateMany entities', async () => {
    const result = await repository.updateMany(
      { isDeleted: true },
      { name: 'Bulk Updated' },
    );
    expect(mockModel.updateMany).toHaveBeenCalledWith(
      { isDeleted: true },
      { name: 'Bulk Updated' },
    );
    expect(result.modifiedCount).toBe(2);
  });
});
