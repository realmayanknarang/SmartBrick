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

## Forecasting Service (Phase 10)

Demand forecasting runs as a **separate Python microservice** (`/forecasting-service`), not inside the Node server. It uses Prophet to read `UsageHistory` from the same MongoDB database.

### Local development

```bash
cd forecasting-service
pip install -r requirements.txt --break-system-packages   # if needed on your system
python app.py
# Health: http://localhost:5001/health
```

Set `FORECASTING_SERVICE_URL=http://localhost:5001` in `server/.env`.

### Render deployment (separate service)

1. Create a new **Web Service** on Render (or use `forecasting-service/render.yaml` as a Blueprint).
2. **Root directory:** `forecasting-service`
3. **Build command:** `pip install -r requirements.txt`
4. **Start command:** `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120`
5. **Environment variables:** `MONGODB_URI` (same value as the main Node backend)
6. After deploy, set `FORECASTING_SERVICE_URL` on the **main Node backend** Render service to the forecasting service's public URL (e.g. `https://smartbrick-forecasting.onrender.com`).

The main dashboard degrades gracefully if this service is down — users see "Forecasting temporarily unavailable" instead of a broken page.

<!-- Deployed forecasting service URL (update after Render deploy): -->
<!-- FORECASTING_SERVICE_URL=https://smartbrick-forecasting.onrender.com -->

