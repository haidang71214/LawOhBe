export class GetTokenDto{
   userId?: string; // ID người dùng (cho user token)
  roomId?: string; // ID phòng (cho room token)
  rest?: boolean; // Lấy REST token
}