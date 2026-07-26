// app.js - IISNode Entry Point for Windows Server / Plesk
process.env.NODE_ENV = 'production';

try {
  require('./dist/server.cjs');
} catch (err) {
  console.error("Critical IISNode startup error:", err);
  throw err;
}
