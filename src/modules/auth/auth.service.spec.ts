import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/repository/users.repository';
import { AuthMapper } from './mapper/auth.mapper';
import { JwtService } from '@nestjs/jwt';
import { KeyService } from 'src/shared/key/key.service';
import { EmailService } from 'src/shared/email/email.service';
import { RedisService } from 'src/shared/redis';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService (Unit Test)', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<any>;
  let jwtService: jest.Mocked<any>;
  let redisService: jest.Mocked<any>;

  const mockUser = {
    _id: 'user_123',
    email: 'test@example.com',
    password: 'hashed_password',
    name: 'Test User',
    role: 'user',
    isEmailVerified: true,
  };

  beforeEach(async () => {
    usersRepository = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn().mockResolvedValue(true),
      create: jest.fn(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
    };

    redisService = {
      set: jest.fn().mockResolvedValue(true),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthMapper,
        { provide: UsersRepository, useValue: usersRepository },
        { provide: JwtService, useValue: jwtService },
        {
          provide: KeyService,
          useValue: {
            getPrivateKey: jest.fn().mockReturnValue('private_key'),
            getRefTokenPrivateKey: jest.fn().mockReturnValue('ref_private_key'),
          },
        },
        {
          provide: EmailService,
          useValue: { sendMail: jest.fn().mockResolvedValue(true) },
        },
        { provide: RedisService, useValue: redisService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw BadRequestException if user is not found on login', async () => {
    usersRepository.findByEmail.mockResolvedValueOnce(null);

    await expect(
      service.login({ email: 'unknown@test.com', password: 'password123' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('should throw ForbiddenException if account is not email verified', async () => {
    usersRepository.findByEmail.mockResolvedValueOnce({
      ...mockUser,
      isEmailVerified: false,
    });

    await expect(
      service.login({ email: 'test@example.com', password: 'password123' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('should throw UnauthorizedException if password does not match', async () => {
    usersRepository.findByEmail.mockResolvedValueOnce(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

    await expect(
      service.login({ email: 'test@example.com', password: 'wrongpassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should login successfully and return access token', async () => {
    usersRepository.findByEmail.mockResolvedValueOnce(mockUser);
    (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

    const result = await service.login({
      email: 'test@example.com',
      password: 'correctpassword',
    });

    expect(result.data?.token).toBe('mock_jwt_token');
    expect(result.data?.user.email).toBe('test@example.com');
  });

  it('should verify email using Redis cached OTP', async () => {
    redisService.get.mockResolvedValueOnce('123456');
    usersRepository.findByEmail.mockResolvedValueOnce(mockUser);

    const result = await service.verifyEmail('test@example.com', '123456');

    expect(result.message).toBe(
      'Email verified successfully. You can now login.',
    );
    expect(usersRepository.findByIdAndUpdate).toHaveBeenCalledWith(
      'user_123',
      expect.objectContaining({
        isEmailVerified: true,
      }),
    );
  });

  it('should issue new access token on valid refresh token', async () => {
    usersRepository.findOne.mockResolvedValueOnce(mockUser);

    const result = await service.refreshToken('valid_refresh_token');

    expect(result.data?.accessToken).toBe('mock_jwt_token');
  });
});
