import { PYTHON_API_URL } from './utils';
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
        const [pythonResponse, nodeResponse] = await Promise.all([
          fetch(`${PYTHON_API_URL}${url}`, {
            redirect: 'manual',
          }),
          fetch(`http://localhost:3000${url}`, {
            redirect: 'manual',
          }),
        ]);
        if (pythonResponse?.status < 400 && nodeResponse?.status < 400) {
          pythonResponseStatus = pythonResponse?.status;
          nodeResponseStatus = nodeResponse?.status;
          pythonResponseBody = await pythonResponse?.text();
          nodeResponseBody = await nodeResponse?.text();
          pythonResponseHeaders = pythonResponse?.headers;
          nodeResponseHeaders = nodeResponse?.headers;
          break;
        }
      } catch {
        // console.error(`Attempt ${attempts + 1} failed:`, error);
      }
      attempts++;
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

    if (attempts === 3) {
      console.error(`Failed to fetch ${url} after 3 attempts`);
    }

    expect(pythonResponseStatus).toBe(status);
    expect(nodeResponseStatus).toBe(pythonResponseStatus);

    expect(pythonResponseHeaders).toEqual(nodeResponseHeaders);

    if (pythonResponseStatus === 200) {
      const pythonResponseJson = JSON.parse(pythonResponseBody);
      const nodeResponseJson = JSON.parse(nodeResponseBody);
      expect(nodeResponseJson).toEqual(pythonResponseJson);
    }
  });
});
