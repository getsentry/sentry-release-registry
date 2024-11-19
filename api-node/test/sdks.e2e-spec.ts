import { makeDuplexRequest } from './utils/makeRequest';

describe('SdksController (e2e)', () => {
  describe('/sdks (GET)', () => {
    it('get without strict', async () => {
      const { python, node } = await makeDuplexRequest('/sdks');

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });

    it.each(['true', '1', 'yes'])('get with strict=%s', async (strict) => {
      const { python, node } = await makeDuplexRequest(
        `/sdks?strict=${strict}`,
      );

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });
  });

  describe('/sdks/:sdkId/:version (GET)', () => {
    it('latest', async () => {
      const sdkId = 'sentry.python';
      const { python, node } = await makeDuplexRequest(`/sdks/${sdkId}/latest`);

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });

    it('specific version', async () => {
      const sdkId = 'sentry.python';
      const version = '2.0.0';
      const { python, node } = await makeDuplexRequest(
        `/sdks/${sdkId}/${version}`,
      );

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });
  });

  describe('/sdks/:sdkId/versions (GET)', () => {
    it.each([
      'sentry.python',
      'sentry.javascript.nextjs',
      'sentry.javascript.browser',
    ])('%s', async (sdkId) => {
      const { python, node } = await makeDuplexRequest(
        `/sdks/${sdkId}/versions`,
      );

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });
  });
});
