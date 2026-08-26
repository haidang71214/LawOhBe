import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { GetTokenDto } from './dto/GetTokenDto';
import { CreateStringGeesetupDto } from './dto/create-string-geesetup.dto';

@Injectable()
export class StringGeesetupService {
  private readonly projectId: string;
  private readonly projectSecret: string;
  private readonly baseUrl: string;
  private readonly tokenHelperUrl: string;
  private restToken: string = '';

  constructor(private configService: ConfigService) {
    this.projectId = process.env.PROJECT_ID || '';
    this.projectSecret = process.env.PROJECT_SECRET || '';
    this.baseUrl = process.env.BASE_STRINGEE || 'https://api.stringee.com/v1/room2';
    this.tokenHelperUrl = process.env.TOKEN_HELPER_URL || '';
  }

  private _authHeader() {
    return { 'X-STRINGEE-AUTH': this.restToken };
  }

  async createRoom(dto: CreateStringGeesetupDto) {
    try {
      const roomName = dto.name || Math.random().toFixed(4);
      const uniqueName = dto.uniqueName || roomName;
      const response = await axios.post(
        `${this.baseUrl}/create`,
        { name: roomName, uniqueName },
        { headers: this._authHeader() },
      );
      console.log(response);
      return response.data;
      
      
    } catch (error) {
      throw new InternalServerErrorException('Không thể tạo phòng');
    }
  }

  async setRestToken() {
    try {
      const tokens = await this.getToken({ rest: true });
      this.restToken = tokens.rest_access_token;
      return this.restToken;
    } catch (error) {
      throw new InternalServerErrorException('Không thể lấy REST token');
    }
  }

  async getUserToken(userId: string) {
    try {
      const tokens = await this.getToken({ userId });
      return tokens.access_token;
    } catch (error) {
      throw new InternalServerErrorException('Không thể lấy user token');
    }
  }

  async getRoomToken(roomId: string) {
    try {
      const tokens = await this.getToken({ roomId });
      return tokens.room_token;
    } catch (error) {
      throw new InternalServerErrorException('Không thể lấy room token');
    }
  }

  async deleteRoom(roomId: string) {
    try {
      const response = await axios.put(
        `${this.baseUrl}/delete`,
        { roomId },
        { headers: this._authHeader() },
      );
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException('Không thể xóa phòng');
    }
  }

  private async getToken({ userId, roomId, rest }: GetTokenDto) {
    try {
      const response = await axios.get(this.tokenHelperUrl, {
        params: {
          keySid: this.projectId,
          keySecret: this.projectSecret,
          userId,
          roomId,
          rest,
        },
      });
      console.log(response);
      
      return response.data;
    } catch (error) {
      throw new InternalServerErrorException('Không thể lấy token');
    }
  }
}