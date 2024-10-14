import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PYTHON_API_URL } from './utils';

describe('SdksController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('/sdks (GET)', () => {
    it('get without strict', async () => {
      const pythonApiResponse = await fetch(`${PYTHON_API_URL}/sdks`);
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get('/sdks')
        .expect((r) => {
          expect(r.status).toEqual(200);
          expect(r.body).toEqual(pythonApiData);
        });
    });

    it.each(['true', '1', 'yes'])('get with strict=%s', async (strict) => {
      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/sdks?strict=${strict}`,
      );
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get('/sdks')
        .query({ strict })
        .expect((r) => {
          expect(r.status).toEqual(200);
          expect(r.body).toEqual(pythonApiData);
        });
    });
  });

  describe('/sdks/:sdkId/:version (GET)', () => {
    it('latest', async () => {
      const sdkId = 'sentry.python';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/sdks/${sdkId}/latest`,
      );
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get(`/sdks/${sdkId}/latest`)
        .expect((r) => {
          expect(r.status).toEqual(200);
          expect(r.body).toEqual(pythonApiData);
        });
    });

    it('specific version', async () => {
      const sdkId = 'sentry.python';
      const version = '2.0.0';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/sdks/${sdkId}/${version}`,
      );
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get(`/sdks/${sdkId}/${version}`)
        .expect((r) => {
          expect(r.status).toEqual(200);
          expect(r.body).toEqual(pythonApiData);
        });
    });
  });

  describe('/sdks/:sdkId/versions (GET)', () => {
    it('python', async () => {
      const sdkId = 'sentry.python';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/sdks/${sdkId}/versions`,
      );
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get(`/sdks/${sdkId}/versions`)
        .expect((r) => {
          expect(r.status).toEqual(200);
          const { versions, latest } = r.body;
          expect(versions.sort()).toEqual(pythonApiData.versions.sort());
          expect(latest).toEqual(pythonApiData.latest);
        });
    });

    it('NextJS', async () => {
      const sdkId = 'sentry.javascript.nextjs';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/sdks/${sdkId}/versions`,
      );
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get(`/sdks/${sdkId}/versions`)
        .expect((r) => {
          expect(r.status).toEqual(200);
          const { versions, latest } = r.body;
          expect(versions.sort()).toEqual(pythonApiData.versions.sort());
          expect(latest).toEqual(pythonApiData.latest);
        });
    });
  });
});
