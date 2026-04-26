import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes'; // Add this import

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Print Shop API')
    .setDescription(' Print Shop backend')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'JWT',
      description: 'Enter JWT token',
      in: 'header',
    })
    .build();
  config.servers = [
    { url: 'http://localhost:3002/english' },
    { url: 'http://188.121.111.209:3002/english' },
  ];
  const document = SwaggerModule.createDocument(app, config);

  // const theme = new SwaggerTheme();
  // const darkCss = theme.getBuffer(SwaggerThemeNameEnum.DARK);

  SwaggerModule.setup('api', app, document, {
    // customCss: darkCss,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}
