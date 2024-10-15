import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PYTHON_API_URL } from './utils';

describe('AwsLambdaLayersController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/aws-lambda-layers (GET)', async () => {
    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/aws-lambda-layers`,
    );
    const pythonApiData = await pythonApiResponse.json();

    return request(app.getHttpServer())
      .get('/aws-lambda-layers')
      .expect((r) => {
        expect(r.status).toEqual(200);
        expect(r.body).toEqual(pythonApiData);
      });
  });
});
