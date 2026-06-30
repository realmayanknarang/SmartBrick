# SmartBrick Data Sources

Last updated: July 1, 2026

This document records what SmartBrick treats as real, external, generated, or synthetic across the application.

| Area | Source | Real vs synthetic | Notes |
| --- | --- | --- | --- |
| Authentication | Clerk | Real service | User sessions and identity are handled by Clerk. SmartBrick stores app roles in MongoDB. |
| Users and roles | MongoDB `User` collection | Real app data / seeded demo data | Roles drive access checks. User responses should expose only name, email, and role where possible. |
| Sites, projects, materials, vendors, purchase orders, usage history | MongoDB collections | Seeded demo data unless replaced by production records | Core dashboards, analytics, alerts, approvals, pooling, forecasting history, and reports read from these collections. |
| Vendor names and pricing | MongoDB seed data | Synthetic demo data | Vendor names, scores, cities, delays, and prices are fictional for demonstration. |
| Spending analytics | MongoDB purchase orders | Derived from demo or production records | Aggregations are computed from stored purchase orders. |
| Stock and budget alerts | MongoDB materials/projects | Derived from demo or production records | Alert thresholds are computed from stored stock, reorder, budget, and spend fields. |
| Invoice scanner | Groq/Gemini-compatible model configuration in server | AI-generated extraction | Uploaded invoice content is processed by the configured model. Results should be reviewed before business use. |
| AI Copilot | Groq/Gemini-compatible model configuration in server | AI-generated response using app context | Context is assembled from app data and sanitized prompts. Answers are decision support, not an authoritative record. |
| Natural-language vendor search | Groq/Gemini-compatible model configuration plus MongoDB | AI parsing + real app query | The model extracts filters; MongoDB returns matching vendor records. |
| Weather risk alerts | OpenWeatherMap forecast API | Real external forecast | The app evaluates forecast periods against construction risk thresholds. |
| Route and delivery map | OpenRouteService + OpenStreetMap tiles | Real external routing/map data | Route distance, duration, and geometry come from OpenRouteService. Map attribution remains with OpenStreetMap contributors. |
| Carbon calculator | Climatiq plus local fallback factors | Real external estimate when available; fallback estimates otherwise | Transport and production emissions use Climatiq when configured. If a factor call fails, local documented fallback factors are used. |
| Demand forecasting | Python forecasting service + MongoDB usage history | Model-generated forecast from app data | Forecasts use historical usage records. The Python service is protected by a shared service secret (X-Forecasting-Secret header) added in Phase 13F to prevent direct public access. |
| PDF and Excel reports | MongoDB plus local generators | Derived documents | Reports package existing app data; they do not introduce new source data. |
| Legal pages | Static templates | Template content | Privacy and terms pages are generated starter templates and have not been lawyer-reviewed. |
| Error monitoring | Sentry | Real service when DSN configured | Frontend, Node server, and Python service initialize Sentry only when a DSN is present. |

## Credential Notes

MongoDB and OpenWeatherMap credentials were previously exposed in project chat history and must be rotated in their provider dashboards if they have not already been rotated after exposure. Rotation cannot be completed purely from the repository; update local `.env`, Vercel, Render Node, and Render forecasting-service environments after generating new values.
