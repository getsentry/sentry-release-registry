import { makeDuplexRequest } from './utils/makeRequest';

describe('AwsLambdaLayersController (e2e)', () => {
  it('/aws-lambda-layers (GET)', async () => {
    const { python, node } = await makeDuplexRequest('/aws-lambda-layers');

    expect(node.status).toEqual(200);
    expect(node.status).toEqual(python.status);

    expect(node.headers).toEqual(python.headers);

    expect(node.body).toEqual(python.body);
  });
});
