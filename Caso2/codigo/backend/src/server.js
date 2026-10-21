require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/prompts', require('./routes/promptRoutes'));

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'PromptVault API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a PromptVault API - Repositorio de Ingeniería de Prompts en LLMs',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      prompts: '/api/prompts',
      health: '/api/health',
    },
  });
});

app.use(errorHandler);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`PromptVault Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
