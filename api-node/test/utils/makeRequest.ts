const PYTHON_API_PORT = 5031;
const API_NODE_PORT = 3000;

export const PYTHON_API_URL = `http://localhost:${PYTHON_API_PORT}`;
export const API_NODE_URL = `http://localhost:${API_NODE_PORT}`;

interface ResponseParts {
  status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: string | any;
  headers: Record<string, string>;
  originalHeaders: Record<string, string>;
}

/**
 * Make a request to both the Python and Node APIs and return the responses
 *
 * Also modifies and normalizes certain divergences in both API responses/headers
 * to allow for minimal differences but easier testing
 *
 * @param path
 * @param options
 * @returns
 */
export async function makeDuplexRequest(
  path: string,
  options: RequestInit = { redirect: 'manual' },
): Promise<{ python: ResponseParts; node: ResponseParts }> {
  const [pythonResponse, nodeResponse] = await Promise.all([
    fetch(`${PYTHON_API_URL}${path}`, options),
    fetch(`${API_NODE_URL}${path}`, options),
  ]);

  const pythonStatus = pythonResponse.status;
  const nodeStatus = nodeResponse.status;

  const originalPythonHeaders = Object.fromEntries(
    pythonResponse.headers.entries(),
  );
  const originalNodeHeaders = Object.fromEntries(
    nodeResponse.headers.entries(),
  );
  const {
    pythonHeaders: normalizedPythonHeaders,
    nodeHeaders: normalizedNodeHeaders,
  } = normalizeHeaders(originalPythonHeaders, originalNodeHeaders);

  const pythonBody = await pythonResponse.text();
  const nodeBody = await nodeResponse.text();

  return {
    python: {
      status: pythonStatus,
      body: tryJsonParse(pythonBody),
      headers: normalizedPythonHeaders,
      originalHeaders: originalPythonHeaders,
    },
    node: {
      status: nodeStatus,
      body: tryJsonParse(nodeBody),
      headers: normalizedNodeHeaders,
      originalHeaders: originalNodeHeaders,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function tryJsonParse(body: string): any | string {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

function normalizeHeaders(
  pythonHeaders: Record<string, string>,
  nodeHeaders: Record<string, string>,
): {
  pythonHeaders: Record<string, string>;
  nodeHeaders: Record<string, string>;
} {
  // The python API returns a newline at the end of the response body
  // The Node API doesn't. Since this is quite tricky to change, let's accept the difference for now
  if (pythonHeaders['content-length']) {
    const pythonContentLength = parseInt(pythonHeaders['content-length']);
    const nodeContentLength = parseInt(nodeHeaders['content-length']);
    if (pythonContentLength - nodeContentLength === 1) {
      pythonHeaders['content-length'] = nodeHeaders['content-length'];
    }
  }

  // NestJS appends "charset=utf-8" to the content-type header
  // We just set "application/json" in Flask, so we'll align it here
  // This shouldn't have any functional impact (famous last words lol)
  const nodeContentType = nodeHeaders['content-type'];
  const pythonContentType = pythonHeaders['content-type'];
  if (
    nodeContentType &&
    (nodeContentType.startsWith('application/json') ||
      nodeContentType.startsWith('text/html')) &&
    pythonContentType &&
    (pythonContentType === 'application/json' ||
      pythonContentType === 'text/html')
  ) {
    nodeHeaders['content-type'] = pythonContentType;
  }

  // caching headers might diverge, depending on number of requests made before
  // we can always check on the original headers for the correct value if important for the test
  delete nodeHeaders['x-from-cache'];
  delete pythonHeaders['x-from-cache'];

  return { pythonHeaders, nodeHeaders };
}
