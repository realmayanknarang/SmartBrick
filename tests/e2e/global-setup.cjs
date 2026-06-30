const { spawn } = require('node:child_process');
const path = require('node:path');
const { MongoMemoryServer } = require('../../server/node_modules/mongodb-memory-server');

const rootDir = path.resolve(__dirname, '../..');
const clientDir = path.join(rootDir, 'client');
const serverDir = path.join(rootDir, 'server');

const requiredCredentials = ['E2E_CLERK_EMAIL', 'E2E_CLERK_PASSWORD'];
const hasCredentials = requiredCredentials.every(name => Boolean(process.env[name]));

function waitForUrl(url, { timeoutMs = 60_000 } = {}) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    async function check() {
      try {
        const response = await fetch(url);
        if (response.ok) {
          resolve();
          return;
        }
      } catch {
        // Service is not ready yet.
      }

      if (Date.now() - startedAt > timeoutMs) {
        reject(new Error(`Timed out waiting for ${url}`));
        return;
      }

      setTimeout(check, 500);
    }

    check();
  });
}

function runCommand(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
    child.on('error', reject);
  });
}

function startProcess(command, args, options) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...options,
  });

  child.on('exit', code => {
    if (code && code !== 0) {
      console.error(`${command} ${args.join(' ')} exited with ${code}`);
    }
  });

  return child;
}

async function insertTestUser(mongoUri) {
  const { default: mongoose } = await import('../../server/node_modules/mongoose/index.js');
  const { default: User } = await import('../../server/models/User.js');

  await mongoose.connect(mongoUri);
  await User.findOneAndUpdate(
    { email: process.env.E2E_CLERK_EMAIL.toLowerCase() },
    {
      name: process.env.E2E_CLERK_NAME || 'SmartBrick E2E User',
      email: process.env.E2E_CLERK_EMAIL.toLowerCase(),
      role: process.env.E2E_CLERK_ROLE || 'owner',
    },
    { upsert: true, setDefaultsOnInsert: true },
  );
  await mongoose.disconnect();
}

module.exports = async function globalSetup() {
  if (!hasCredentials) {
    console.warn('Skipping local e2e harness: E2E_CLERK_EMAIL and E2E_CLERK_PASSWORD are required.');
    return;
  }

  const mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri('smartbrick_e2e');
  const serverEnv = {
    ...process.env,
    MONGODB_URI: mongoUri,
    FRONTEND_URL: 'http://127.0.0.1:5173',
    PORT: '3001',
  };
  const clientEnv = {
    ...process.env,
    VITE_API_URL: 'http://127.0.0.1:3001/api',
  };

  await runCommand('npm', ['run', 'seed'], { cwd: serverDir, env: serverEnv });
  await insertTestUser(mongoUri);

  const server = startProcess('npm', ['run', 'start'], { cwd: serverDir, env: serverEnv });
  const client = startProcess(
    'npm',
    ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173'],
    { cwd: clientDir, env: clientEnv },
  );

  await waitForUrl('http://127.0.0.1:3001/api/health');
  await waitForUrl('http://127.0.0.1:5173');

  return async () => {
    server.kill('SIGTERM');
    client.kill('SIGTERM');
    await mongo.stop();
  };
};
