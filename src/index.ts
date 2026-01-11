import dotenv from 'dotenv';

// Load .env.local first, then .env as fallback
dotenv.config({ path: '.env.local' });
dotenv.config();

import app from './app';

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Agent For You API running on http://localhost:${port}`);
});
