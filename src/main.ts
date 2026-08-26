import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { setupSocketIo } from './config/socket-io';
import { ChatService } from './message/message.service';
import { PeerServer } from 'peer';

export const URL_PRODUCTION = 'https://lawohfe.onrender.com'
async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    const peerServer = PeerServer({
      path: "/peerjs"
    });
    const expressApp = app.getHttpAdapter().getInstance(); // ✅ Lấy instance của Express
expressApp.use('/peerjs', peerServer); // ✅ Mount PeerServer tại /peerjs

    // Cấu hình global pipes
    app.useGlobalPipes(new ValidationPipe());
 
    // Cấu hình CORS
    app.enableCors({
      //  deploy fe, thay đổi những thứ có ở cái localhost
      // gán cái fe vào đây
      // ,'http://localhost:3000'
      origin: [process.env.NODE_ENV === 'production' ? `${URL_PRODUCTION}` : '*','http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true,
    });

    // Cấu hình Swagger
    const configSwagger = new DocumentBuilder()
      .setTitle('API LAWOH')
      .setDescription('LAWOH API LIST')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swagger = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('Swagger', app, swagger);

    // Lấy port từ process.env.PORT (Render) hoặc ConfigService
    // const port = process.env.PORT || configService.get<number>('PORT') || 8080;

    // Khởi tạo và setup Socket.io
    const chatService = app.get(ChatService);
    setupSocketIo(app, chatService);

    // Khởi động ứng dụng trên 0.0.0.0 kệ mẹ cái env vì env đéo chạy được
    //process.env.PORT ||
    const port =  10000; // Mặc định 10000 theo tài liệu Render
await app.listen(port, '0.0.0.0');
console.log(`Ứng dụng đang chạy trên port: http://0.0.0.0:${port}`);
  } catch (error) {
    console.error('Ứng dụng không khởi động được:', error.stack);
    process.exit(1);
  }
}

bootstrap();