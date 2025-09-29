import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from './app.module';
import { OpenAPI } from './config/openapi';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  const config = new DocumentBuilder()
    .setTitle('Sema API')
    .setDescription('The Sema API description')
    .setVersion('1.0')
    .build();

  let mergedPaths: any = {};
  let mergedComponents: any = {};
  try {
    mergedPaths = await OpenAPI.getPaths();
    mergedComponents = await OpenAPI.components;
  } catch (e) {
    console.warn('Could not load Better Auth OpenAPI parts:', e);
  }

  const mergedDocumentFactory = () => {
    const doc = SwaggerModule.createDocument(app, config);
    doc.paths = { ...(doc.paths || {}), ...(mergedPaths || {}) };
    doc.components = { ...(doc.components || {}), ...(mergedComponents || {}) };
    return doc;
  };

  SwaggerModule.setup('api', app, mergedDocumentFactory);

  app.use(
    '/docs',
    apiReference({
      theme: 'deepSpace',
      content: mergedDocumentFactory,
    }),
  );

  // expose the full Better Auth generated schema for direct consumption
  try {
    OpenAPI.fullSchema.then((schema) => {
      app.use('/api/auth/openapi.json', (_req: any, res: any) => {
        res.json(schema);
      });
    });
  } catch (e) {
    // ignore
  }

  await app.listen(process.env.PORT ?? 5000);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
