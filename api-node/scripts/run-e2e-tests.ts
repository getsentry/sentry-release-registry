// A script that runs the e2e tests
// 1. Starts the NestJS and Flask APIs in Docker
// 2. Runs the tests
// 3. Stops the NestJS and Flask APIs

import * as childProcess from 'child_process';

const nodeApi = childProcess.spawn('yarn', ['start:prod']);

let nodeApiStarted = false;
let pythonApiStarted = false;

nodeApi.stdout.on('data', (data) => {
  console.log('[NestJS]', data.toString());
  if (data.toString().includes('application successfully started')) {
    nodeApiStarted = true;
    checkAndRunTests();
  }
});

nodeApi.stderr.on('data', (data) => {
  console.error('[NestJS]', data.toString());
});

const pythonApi = childProcess.spawn('yarn', ['python-api:start']);

pythonApi.stdout.on('data', (data) => {
  console.log('[Flask]', data.toString());
  if (data.toString().includes('Flask API started successfully')) {
    pythonApiStarted = true;
    checkAndRunTests();
  }
});

pythonApi.stderr.on('data', (data) => {
  console.error('[Flask]', data.toString());
});

function checkAndRunTests(): void {
  console.log('checkAndRunTests', { nodeApiStarted, pythonApiStarted });
  if (nodeApiStarted && pythonApiStarted) {
    console.log('Both APIs are running. Starting e2e tests...');
    const tests = childProcess.spawn('yarn', ['test:e2e']);

    tests.stdout.on('data', (data) => {
      console.log('[Tests]', data.toString());
    });

    tests.stderr.on('data', (data) => {
      console.error('[Tests]', data.toString());
    });

    tests.on('close', (code) => {
      console.log(`Tests finished with code ${code}`);
      cleanup(code);
    });
  }
}

function cleanup(code: number): void {
  console.log('Cleaning up...');
  nodeApi.kill();
  pythonApi.kill();
  childProcess.execSync('yarn python-api:stop');
  process.exit(code);
}

process.on('SIGINT', () => cleanup(0));
