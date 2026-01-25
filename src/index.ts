import dotenv from 'dotenv';

// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config();

import app from './app';

const port = parseInt(process.env.PORT || '3001', 10);

app.listen(port, () => {
  console.log(`\n🚀 Agent For You API Server`);
  console.log(`   Local:   http://localhost:${port}`);
  console.log(`   Mode:    ${process.env.NODE_ENV || 'development'}\n`);
});
