import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

const PYTHON_API_PORT = 5031;
const PYTHON_API_URL = `http://localhost:${PYTHON_API_PORT}`;

describe('PackagesController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/packages (GET)', async () => {
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/packages`);
    const pythonApiData = await pythonApiResponse.json();

    return request(app.getHttpServer())
      .get('/packages')
      .expect((r) => {
        expect(r.status).toEqual(200);
        expect(r.body).toEqual(pythonApiData);
      });
  });

  it('/packages/:packageName/versions (GET)', async () => {
    const packageName = 'npm:@sentry/angular';

    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/packages/${packageName}/versions`,
    );
    const pythonApiData = await pythonApiResponse.json();

    return request(app.getHttpServer())
      .get(`/packages/${packageName}/versions`)
      .expect((r) => {
        expect(r.status).toEqual(200);
        const { versions, latest } = r.body;
        expect(versions.length).toEqual(pythonApiData.versions.length);
        expect(versions.sort()).toEqual(pythonApiData.versions.sort());
        expect(latest).toEqual(pythonApiData.latest);
      });
  });

  it('/packages/:packageName/:version (GET)', async () => {
    const packageName = 'npm:@sentry/angular';
    const version = '8.0.0';

    const pythonApiResponse = await fetch(
      `${PYTHON_API_URL}/packages/${packageName}/${version}`,
    );
    const pythonApiData = await pythonApiResponse.json();

    return request(app.getHttpServer())
      .get(`/packages/${packageName}/${version}`)
      .expect((r) => {
        expect(r.status).toEqual(200);
        expect(r.body).toEqual(pythonApiData);
      });
  });
});
