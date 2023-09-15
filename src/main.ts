import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Microsserviço-SEBRAE')
    .setDescription(
      'Microsserviço verificação de associação do usuário GroodMe a entidade SEBRAE',
    )
    .setVersion('1.0')
    .addTag('Verificação')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const PORT = process.env.PORT || 3333;
  await app.listen(PORT);
}
bootstrap();
