import { defineConfig } from '@hey-api/openapi-ts'

// Generates the typed API client from the running backend's OpenAPI schema.
// Run `npm run api:generate` with the backend running on port 8000.
// The schema is fetched as JSON so no YAML parsing is involved.
export default defineConfig({
  input: process.env.OPENAPI_SCHEMA_URL ?? 'http://127.0.0.1:8000/api/schema/?format=json',
  output: 'src/api/generated',
  plugins: ['@hey-api/client-fetch', '@hey-api/sdk', '@hey-api/typescript'],
})
