import { makeDuplexRequest } from './utils/makeRequest';
import * as fs from 'fs';
describe('Flask and NestJS api responses match', () => {
  const urls = JSON.parse(
    fs.readFileSync(`${__dirname}/utils/.urls.json`, 'utf8'),
  );

  it.each(urls)('%s', async ({ url, status }) => {
    let pythonResponse,
      pythonResponseStatus,
      pythonResponseBody,
      pythonResponseHeaders;

    let nodeResponse, nodeResponseStatus, nodeResponseBody, nodeResponseHeaders;

    let attempts = 0;
    while (attempts < 3) {
      try {
        const { node, python } = await makeDuplexRequest(url);

        pythonResponseStatus = python.status;
        nodeResponseStatus = node.status;
        pythonResponseBody = python.body;
        nodeResponseBody = node.body;
        pythonResponseHeaders = python.headers;
        nodeResponseHeaders = node.headers;
        break;
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
        attempts++;
        if (attempts >= 3) {
          console.error(`Failed to fetch ${url} after 3 attempts`);
        }
      }
      if (attempts < 3) {
        pythonResponseStatus = pythonResponse?.status;
        nodeResponseStatus = nodeResponse?.status;
        pythonResponseBody = await pythonResponse?.text();
        nodeResponseBody = await nodeResponse?.text();
        pythonResponseHeaders = pythonResponse?.headers;
        nodeResponseHeaders = nodeResponse?.headers;
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    expect(pythonResponseStatus).toBe(status);
    expect(nodeResponseStatus).toBe(pythonResponseStatus);

    expect(nodeResponseHeaders).toEqual(pythonResponseHeaders);

    expect(nodeResponseBody).toEqual(pythonResponseBody);
  });
});
