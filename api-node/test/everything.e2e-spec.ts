import { PYTHON_API_URL } from './utils';
import * as fs from 'fs';
describe('python and Node api responses match', () => {
  const urls = JSON.parse(
    fs.readFileSync(`${__dirname}/utils/.urls.json`, 'utf8'),
  );

  it.each(urls)('%s', async ({ url, status }) => {
    let pythonResponse, nodeResponse, pythonResponseStatus, nodeResponseStatus;
    let pythonResponseBody, nodeResponseBody;
    let attempts = 0;
    while (attempts < 3) {
      try {
        pythonResponse = await fetch(`${PYTHON_API_URL}${url}`, {
          redirect: 'manual',
        });
        nodeResponse = await fetch(`http://localhost:3000${url}`, {
          redirect: 'manual',
        });
        if (pythonResponse?.status < 400 && nodeResponse?.status < 400) {
          pythonResponseStatus = pythonResponse?.status;
          nodeResponseStatus = nodeResponse?.status;
          pythonResponseBody = await pythonResponse?.text();
          nodeResponseBody = await nodeResponse?.text();
          break;
        }
      } catch (error) {
        console.error(`Attempt ${attempts + 1} failed:`, error);
      }
      attempts++;
      if (attempts < 3) {
        pythonResponseStatus = pythonResponse?.status;
        nodeResponseStatus = nodeResponse?.status;
        pythonResponseBody = await pythonResponse?.text();
        nodeResponseBody = await nodeResponse?.text();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retrying
      }
    }

    if (attempts === 3) {
      console.error(`Failed to fetch ${url} after 3 attempts`);
    }

    expect(pythonResponseStatus).toBe(status);
    expect(nodeResponseStatus).toBe(pythonResponseStatus);

    if (pythonResponseStatus === 200) {
      try {
        const pythonResponseJson = JSON.parse(pythonResponseBody);
        const nodeResponseJson = JSON.parse(nodeResponseBody);
        expect(nodeResponseJson).toEqual(pythonResponseJson);
      } catch {
        expect(nodeResponseBody).toEqual(pythonResponseBody);
      }
    }
  });
});
