// Vercel serverless entry point - imports compiled TypeScript
const app = require('../dist/app').default;

module.exports = app;
