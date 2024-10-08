import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PYTHON_API_URL } from './utils';

describe('PackagesController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/healthz (GET)', async () => {
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/healthz`);
    const pythonApiData = await pythonApiResponse.text();

    return request(app.getHttpServer())
      .get('/healthz')
      .expect(200)
      .expect(pythonApiData);
  });
});
