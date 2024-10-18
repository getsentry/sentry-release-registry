import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PYTHON_API_URL } from './utils';

describe('MarketingController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/marketing-slugs (GET)', async () => {
    const pythonApiResponse = await fetch(`${PYTHON_API_URL}/marketing-slugs`);
    const pythonApiData = await pythonApiResponse.json();

    return request(app.getHttpServer())
      .get('/marketing-slugs')
      .expect((res) => {
        expect(res.status).toBe(200);
        expect(res.body.slugs).toEqual(pythonApiData.slugs);
      });
  });

  describe('/marketing-slugs/:slug (GET)', () => {
    it.each(['python', 'javascript', 'browser', 'flask', 'django', 'rust'])(
      'valid slug %s',
      async (slug) => {
        const pythonApiResponse = await fetch(
          `${PYTHON_API_URL}/marketing-slugs/${slug}`,
        );
        const pythonApiData = await pythonApiResponse.json();

        return request(app.getHttpServer())
          .get(`/marketing-slugs/${slug}`)
          .expect((res) => {
            expect(res.status).toBe(200);
            expect(res.body).toEqual(pythonApiData);
          });
      },
    );

    it('invalid slug', async () => {
      const slug = 'invalid-slug';
      const pythonApiResponse = await fetch(
        `${PYTHON_API_URL}/marketing-slugs/${slug}`,
      );

      return request(app.getHttpServer())
        .get(`/marketing-slugs/${slug}`)
        .expect((res) => {
          expect(res.status).toBe(pythonApiResponse.status);
          expect(res.status).toBe(404);
        });
    });
  });
});
