# Web Backend-for-Frontend for the Shared API

The web browser will reach protected authentication and maintenance operations through a thin same-origin web backend-for-frontend, while the mobile app calls the shared API directly. The web layer may proxy credentials and transport contracts but must not contain maintenance authorization, validation, orchestration, or persistence rules; this preserves TanStack Start server rendering and host-only web cookies without requiring cross-origin browser credentials or a cookie shared across every `coinarchive.app` subdomain.

Protected maintenance routes do not grant cross-origin browser access. The web backend-for-frontend validates same-origin mutation requests before forwarding credentials, the native mobile client calls the API outside the browser CORS model, and the API still authenticates and authorizes every request; the existing public read CORS policy and short-lived direct R2 upload authorizations remain separate exceptions.
