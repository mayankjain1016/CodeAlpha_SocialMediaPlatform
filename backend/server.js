const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const startServer = async () => {
  try {
    await connectDB();
    const server = app.listen(env.PORT, () => {
      console.log(`Sangam server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      console.log(`Access the platform at: http://localhost:${env.PORT}`);
    });

    const shutdown = () => {
      console.log('Shutting down gracefully...');
      server.close(() => {
        console.log('Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Fatal error during server startup:', err.message);
    process.exit(1);
  }
};

startServer();
