import type { NextConfig } from 'next';
const config: NextConfig = {
  serverExternalPackages: ['pdf-parse'],
  outputFileTracingIncludes: {
    '/api/settings/resume': [
      './node_modules/pdf-parse/dist/pdf-parse/**/pdf.worker.mjs',
      './node_modules/@napi-rs/canvas*/**/*',
    ],
  },
};
export default config;
