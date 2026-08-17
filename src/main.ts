import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validación global de DTOs de entrada (whitelist elimina props no declaradas)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('EcoLogistics - Carbon Tracker Service')
    .setDescription(
      'Microservicio para el cálculo de la huella de carbono (CO2) de operaciones logísticas',
    )
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🌱 Carbon Tracker Service corriendo en: http://localhost:${port}`);
  console.log(`📄 Documentación Swagger en: http://localhost:${port}/api/docs`);
}
bootstrap();
