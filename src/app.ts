import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { notFound, errorHandler } from './middleware/errorHandler';
import indexRouter from './routes/index.router';
import authRouter from './routes/auth.router';

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://www.agentforyou.ca',
  'https://agentforyou.ca'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use(requestLogger);

// Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);

// Error handling (must be after routes)
app.use(notFound);
app.use(errorHandler);

export default app;
