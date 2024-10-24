import { makeDuplexRequest } from './utils/makeRequest';

describe('MarketingController (e2e)', () => {
  it('/marketing-slugs (GET)', async () => {
    const { python, node } = await makeDuplexRequest('/marketing-slugs');

    expect(node.status).toEqual(200);
    expect(node.status).toEqual(python.status);

    expect(node.headers).toEqual(python.headers);

    expect(node.body).toEqual(python.body);
  });

  describe('/marketing-slugs/:slug (GET)', () => {
    it.each(['python', 'javascript', 'browser', 'flask', 'django', 'rust'])(
      'valid slug %s',
      async (slug) => {
        const { python, node } = await makeDuplexRequest(
          `/marketing-slugs/${slug}`,
        );

        expect(node.status).toEqual(200);
        expect(node.status).toEqual(python.status);

        expect(node.headers).toEqual(python.headers);

        expect(node.body).toEqual(python.body);
      },
    );

    it('invalid slug', async () => {
      const slug = 'invalid-slug';
      const { python, node } = await makeDuplexRequest(
        `/marketing-slugs/${slug}`,
      );

      expect(node.status).toEqual(404);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });
  });
});
