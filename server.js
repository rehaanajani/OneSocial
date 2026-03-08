/**
 * server.js
 * 
 * Local Development Proxy Entry Point
 * 
 * We moved the actual Express app into `api/index.js` for native 
 * Vercel Serverless proxying. This file simply loads that app 
 * so that `npm run dev` continues to work exactly as before locally.
 */
require('./api/index.js');