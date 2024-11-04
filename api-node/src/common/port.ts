const DEFAULT_PORT = 3000;

export function getPort(): number {
  try {
    if (process.env.PORT) {
      return parseInt(process.env.PORT);
    }
  } catch (error) {
    console.error('Invalid port number', error);
  }
  return DEFAULT_PORT;
}
