import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService); 
    
    app.useGlobalPipes(new ValidationPipe());
    app.enableCors({
      origin: ['http://localhost:3000'],
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      credentials: true, // cho phép gửi cookie
    });

    const configSwagger = new DocumentBuilder()
      .setTitle('API LAWOH')
      .setDescription('LAWOH API LIST')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const swagger = SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup('Swagger', app, swagger);
    
    const port = configService.get<number>('PORT') || 8080;
    await app.listen(port);

    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`MongoDB URI: ${configService.get<string>('MONGODB_URI')}`);
  } catch (error) {
    console.error('Application failed to start:', error);
  }
}

bootstrap();
