// app.js - IISNode Entry Point for Windows Server / Plesk
const path = require('path');
process.env.NODE_ENV = 'production';

// Ensure working directory is set to the application root directory
try {
  process.chdir(__dirname);
} catch (e) {
  console.warn("Could not set process.chdir:", e);
}

try {
  require(path.resolve(__dirname, './dist/server.cjs'));
} catch (err) {
  console.error("Critical IISNode startup error:", err);
  throw err;
}
