import { initTracing } from 'libs/observable';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ExpressPeerServer } from 'peer';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from 'libs/interceptor/http-exception.filter';
import { ResponseTransformInterceptor } from 'libs/interceptor/Exception.interceptor';

// Initialize OpenTelemetry Tracing
initTracing('law-ohbe');

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, { bufferLogs: true });
    const logger = app.get(Logger);
    app.useLogger(logger);

    const configService = app.get(ConfigService);

    const globalPrefix = configService.get<string>('GLOBAL_PREFIX');
    if (globalPrefix) {
      app.setGlobalPrefix(globalPrefix);
    }

    const expressApp = app.getHttpAdapter().getInstance();
    const httpServer = app.getHttpServer();
    const peerServer = ExpressPeerServer(httpServer, {
      path: '/',
    });
    expressApp.use('/peerjs', peerServer);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseTransformInterceptor());

    app.enableCors({
      origin: true,
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

    const port =
      configService.get<number>('APP.PORT') ||
      configService.get<number>('PORT') ||
      process.env.PORT ||
      3300;

    await app.listen(port);
    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📑 Swagger Documentation: http://localhost:${port}/Swagger`);
    logger.log(`📊 Prometheus Metrics: http://localhost:${port}/metrics`);
  } catch (error: any) {
    console.error('❌ Failed to start application:', error.stack || error);
    process.exit(1);
  }
}

bootstrap();
