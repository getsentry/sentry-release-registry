import { makeDuplexRequest } from './utils/makeRequest';

describe('HealthCheckController (e2e)', () => {
  it('/healthz (GET)', async () => {
    const { python, node } = await makeDuplexRequest('/healthz');

    expect(node.status).toEqual(200);
    expect(node.status).toEqual(python.status);

    expect(node.headers).toEqual(python.headers);

    expect(node.body).toEqual(python.body);
  });
});
