import {
  BAD_REQUEST_HTML,
  getRedirectHtml,
  NOT_FOUND_HTML,
} from '../src/common/htmlTemplates';
import { makeDuplexRequest } from './utils/makeRequest';

describe('AppsController (e2e)', () => {
  it('/apps (GET)', async () => {
    const { python, node } = await makeDuplexRequest('/apps');

    expect(node.status).toEqual(200);
    expect(node.status).toEqual(python.status);

    expect(node.headers).toEqual(python.headers);

    expect(node.body).toEqual(python.body);
  });

  describe('/apps/:appId/:version (GET)', () => {
    it('no query params, with latest version', async () => {
      const appId = 'sentry-cli';
      const version = 'latest';
      const { python, node } = await makeDuplexRequest(
        `/apps/${appId}/${version}`,
      );
      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });

    it('no query params, with fixed version', async () => {
      const appId = 'sentry-cli';
      const version = '2.0.0';
      const { python, node } = await makeDuplexRequest(
        `/apps/${appId}/${version}`,
      );

      expect(node.status).toEqual(200);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(python.body);
    });

    it('with response=download', async () => {
      const appId = 'sentry-cli';
      const version = '2.36.3';
      const arch = 'x86_64';
      const platform = 'linux';
      const pkgName = 'sentry-cli';

      const urlPath = `/apps/${appId}/${version}?${new URLSearchParams({
        response: 'download',
        arch,
        platform,
        package: pkgName,
      })}`;

      const { python, node } = await makeDuplexRequest(urlPath);

      expect(node.status).toEqual(302);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.headers.location).toEqual(
        `https://downloads.sentry-cdn.com/sentry-cli/${version}/sentry-cli-Linux-x86_64`,
      );
      expect(node.headers.digest).toEqual(
        'sha256=8cs/OTYjDCCuSrIIAmFPoggGPWI599KeBquwkXqTQRg=',
      );

      expect(node.body).toEqual(getRedirectHtml(node.headers.location));
      expect(node.body).toEqual(python.body);
    });

    it('with invalid appId', async () => {
      const appId = 'invalid-app';
      const version = 'latest';
      const { python, node } = await makeDuplexRequest(
        `/apps/${appId}/${version}`,
      );

      expect(node.status).toEqual(404);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(NOT_FOUND_HTML);
      expect(node.body).toEqual(python.body);
    });

    it('with response=download and missing parameters', async () => {
      const appId = 'sentry-cli';
      const version = 'latest';
      const { python, node } = await makeDuplexRequest(
        `/apps/${appId}/${version}?response=download`,
      );

      expect(node.status).toEqual(400);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(BAD_REQUEST_HTML);
      expect(node.body).toEqual(python.body);
    });

    it('with response=download and invalid parameters', async () => {
      const appId = 'sentry-cli';
      const version = 'latest';
      const arch = 'invalid-arch';
      const platform = 'invalid-platform';
      const pkgName = 'invalid-package';
      const { python, node } = await makeDuplexRequest(
        `/apps/${appId}/${version}?response=download&arch=${arch}&platform=${platform}&package=${pkgName}`,
      );

      expect(node.status).toEqual(404);
      expect(node.status).toEqual(python.status);

      expect(node.headers).toEqual(python.headers);

      expect(node.body).toEqual(NOT_FOUND_HTML);
      expect(node.body).toEqual(python.body);
    });
  });
});
