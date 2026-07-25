/**
 * Application Startup File for Plesk Obsidian 18.0+ / IIS / cPanel / Cloud Run
 * Domain: teachertutor.schoolos-app.com
 * File: /teachertutor.schoolos-app.com/app.js
 */

const fs = require('fs');
const path = require('path');

// 1. Set environment variables if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || process.env.HTTP_PLATFORM_PORT || 3000;

const bundlePath = path.join(__dirname, 'dist', 'server.cjs');

if (fs.existsSync(bundlePath)) {
  console.log("🚀 Starting KuruMaster Server on Plesk from dist/server.cjs...");
  require(bundlePath);
} else {
  console.log("⚠️ Bundle dist/server.cjs not found. Attempting tsx loader...");
  try {
    require('tsx/cli');
    require('./server.ts');
  } catch (e) {
    console.error("❌ Could not start application. Please run 'npm run build' in Plesk Node.js panel.");
  }
}

