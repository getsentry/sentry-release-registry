import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PYTHON_API_URL } from './utils';

describe('AppsController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/apps (GET)', async () => {
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/apps`);
    const pythonApiData = await pythonApiResponse.json();

    return request(app.getHttpServer())
      .get('/apps')
      .expect((r) => {
        expect(r.status).toEqual(200);
        expect(r.body).toEqual(pythonApiData);
      });
  });

  describe('/apps/:appId/:version (GET)', () => {
    it('no query params, with latest version', async () => {
      const appId = 'sentry-cli';
      const version = 'latest';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/apps/${appId}/${version}`,
      );

      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get(`/apps/${appId}/${version}`)
        .expect((r) => {
          expect(r.status).toEqual(200);
          expect(r.body).toEqual(pythonApiData);
        });
    });

    it('no query params, with fixed version', async () => {
      const appId = 'sentry-cli';
      const version = '2.0.0';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/apps/${appId}/${version}`,
      );
      const pythonApiData = await pythonApiResponse.json();

      return request(app.getHttpServer())
        .get(`/apps/${appId}/${version}`)
        .expect((r) => {
          expect(r.status).toEqual(200);
          expect(r.body).toEqual(pythonApiData);
        });
    });

    it('with response=download', async () => {
      const appId = 'sentry-cli';
      const version = '2.36.3';
      const arch = 'x86_64';
      const platform = 'linux';
      const pkgName = 'sentry-cli';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/apps/${appId}/${version}?response=download&arch=${arch}&platform=${platform}&package=${pkgName}`,
        { redirect: 'manual' },
      );

      expect(pythonApiResponse.status).toEqual(302);

      return request(app.getHttpServer())
        .get(`/apps/${appId}/${version}`)
        .query({ response: 'download', arch, platform, package: pkgName })
        .expect((r) => {
          expect(r.status).toEqual(302);
          expect(r.header.location).toEqual(
            pythonApiResponse.headers.get('location'),
          );
          expect(r.header.digest).toEqual(
            pythonApiResponse.headers.get('digest'),
          );
          expect(r.header.location).toEqual(
            pythonApiResponse.headers.get('location'),
          );
          expect(r.header.location).toEqual(
            `https://downloads.sentry-cdn.com/sentry-cli/${version}/sentry-cli-Linux-x86_64`,
          );
          expect(r.header.digest).toEqual(
            'sha256=8cs/OTYjDCCuSrIIAmFPoggGPWI599KeBquwkXqTQRg=',
          );
        });
    });

    it('with invalid appId', async () => {
      const appId = 'invalid-app';
      const version = 'latest';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/apps/${appId}/${version}`,
      );

      expect(pythonApiResponse.status).toEqual(404);

      return request(app.getHttpServer())
        .get(`/apps/${appId}/${version}`)
        .expect((r) => {
          expect(r.status).toEqual(404);
          expect(r.text).toEqual('App not found');
        });
    });

    it('with response=download and missing parameters', async () => {
      const appId = 'sentry-cli';
      const version = 'latest';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/apps/${appId}/${version}?response=download`,
      );

      expect(pythonApiResponse.status).toEqual(400);

      return request(app.getHttpServer())
        .get(`/apps/${appId}/${version}`)
        .query({ response: 'download' })
        .expect((r) => {
          expect(r.status).toEqual(400);
          expect(r.text).toEqual('Missing required query parameters');
        });
    });

    it('with response=download and invalid parameters', async () => {
      const appId = 'sentry-cli';
      const version = 'latest';
      const arch = 'invalid-arch';
      const platform = 'invalid-platform';
      const pkgName = 'invalid-package';

      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/apps/${appId}/${version}?response=download&arch=${arch}&platform=${platform}&package=${pkgName}`,
      );

      expect(pythonApiResponse.status).toEqual(404);

      return request(app.getHttpServer())
        .get(`/apps/${appId}/${version}`)
        .query({ response: 'download', arch, platform, package: pkgName })
        .expect((r) => {
          expect(r.status).toEqual(404);
          expect(r.text).toEqual('Download URL not found');
        });
    });
  });
});
