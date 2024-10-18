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

  describe('/packages/:packageName/versions (GET)', () => {
    it('returns versions for existing package', async () => {
      const packageName = 'npm:@sentry/angular';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/packages/${packageName}/versions`,
      );
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get(`/packages/${packageName}/versions`)
        .expect((r) => {
          expect(r.status).toEqual(200);
          expect(r.body).toEqual(pythonApiData);
        });
    });

    it('returns 404 for non-existing package', async () => {
      const nonExistingPackage = 'npm:@sentry/non-existing-package';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/packages/${nonExistingPackage}/versions`,
      );
      expect(pythonApiResponse.status).toEqual(404);

      return request(app.getHttpServer())
        .get(`/packages/${nonExistingPackage}/versions`)
        .expect(404);
    });
  });

  describe('/packages/:packageName/:version (GET)', () => {
    it('returns package info for existing package', async () => {
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

    it('returns 404 for non-existent package', async () => {
      const nonExistentPackage = 'npm:@sentry/non-existent-package';
      const version = 'latest';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/packages/${nonExistentPackage}/${version}`,
      );

      expect(pythonApiResponse.status).toEqual(404);

      return request(app.getHttpServer())
        .get(`/packages/${nonExistentPackage}/${version}`)
        .expect(404);
    });
  });
});
