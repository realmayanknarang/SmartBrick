# SmartBrick

An AI procurement platform for construction builders.

## Setup

1. Clone the repository
2. Install dependencies in root, client, and server:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```
3. Copy .env.example to .env in both client and server:
   ```bash
   cd server && cp .env.example .env
   cd ../client && cp .env.example .env
   ```
4. Fill in real API keys and MONGODB_URI in the .env files

## Running

- Development (both client and server):
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm start
  ```

## Notes

- Features in later phases require real API keys in the .env files
