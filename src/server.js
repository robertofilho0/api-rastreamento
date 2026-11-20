const app = require('./app');
const env = require('./config/env');

const server = app.listen(env.PORT, () => {
  console.log(
    `🚀 API rodando em http://localhost:${env.PORT} (provedor: ${env.TRACKING_PROVIDER})`,
  );
  console.log(`📚 Documentação em http://localhost:${env.PORT}/docs`);
});

const shutdown = (signal) => {
  console.log(`\n${signal} recebido. Encerrando...`);
  server.close(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
