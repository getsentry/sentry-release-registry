import { makeDuplexRequest } from './utils/makeRequest';

describe('PackagesController (e2e)', () => {
  it('/packages (GET)', async () => {
    const { python, node } = await makeDuplexRequest('/packages');

    expect(node.status).toEqual(200);
    expect(node.status).toEqual(python.status);

    expect(node.headers).toEqual(python.headers);

    expect(node.body).toEqual(python.body);
  });

  describe('/packages/:packageName/versions (GET)', () => {
    it('returns versions for existing package', async () => {
      const packageName = 'npm:@sentry/angular';
      const { python, node } = await makeDuplexRequest(
        `/packages/${packageName}/versions`,
      );

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });

    it('returns 404 for non-existing package', async () => {
      const nonExistingPackage = 'npm:@sentry/non-existing-package';
      const { python, node } = await makeDuplexRequest(
        `/packages/${nonExistingPackage}/versions`,
      );

      expect(node.status).toEqual(404);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });
  });

  describe('/packages/:packageName/:version (GET)', () => {
    it('returns package info for existing package', async () => {
      const packageName = 'npm:@sentry/angular';
      const version = '8.0.0';

      const { python, node } = await makeDuplexRequest(
        `/packages/${packageName}/${version}`,
      );

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });

    it('returns 404 for non-existent package', async () => {
      const nonExistentPackage = 'npm:@sentry/non-existent-package';
      const version = 'latest';

      const { python, node } = await makeDuplexRequest(
        `/packages/${nonExistentPackage}/${version}`,
      );

      expect(node.status).toEqual(404);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });
  });
});
