/**
 * MySQL & Backend API Configuration for KuruMaster
 * Connects directly to the Node.js Express backend / MySQL PHP API Gateway
 */

export interface MySQLConfig {
  apiUrl: string;
  host: string;
  database: string;
  isPhpMyAdminMode: boolean;
}

// 1. Check LocalStorage configuration overrides if set by admin
const storedApiUrl = typeof window !== 'undefined' ? localStorage.getItem('MST_MYSQL_API_URL') : null;
const storedHost = typeof window !== 'undefined' ? localStorage.getItem('MST_MYSQL_HOST') : null;
const storedDb = typeof window !== 'undefined' ? localStorage.getItem('MST_MYSQL_DATABASE') : null;

// 2. Default API Endpoints
const DEFAULT_API_URL = typeof window !== 'undefined' ? window.location.origin + '/api' : '/api';

export const mysqlConfig: MySQLConfig = {
  apiUrl: storedApiUrl || DEFAULT_API_URL,
  host: storedHost || 'localhost',
  database: storedDb || 'kuru_master_db',
  isPhpMyAdminMode: Boolean(storedApiUrl && storedApiUrl.endsWith('.php'))
};

export const saveMySQLConfig = (apiUrl: string, host: string, dbName: string) => {
  localStorage.setItem('MST_MYSQL_API_URL', apiUrl);
  localStorage.setItem('MST_MYSQL_HOST', host);
  localStorage.setItem('MST_MYSQL_DATABASE', dbName);
  window.location.reload();
};

export const clearMySQLConfig = () => {
  localStorage.removeItem('MST_MYSQL_API_URL');
  localStorage.removeItem('MST_MYSQL_HOST');
  localStorage.removeItem('MST_MYSQL_DATABASE');
  window.location.reload();
};

export const isConfigured = true;
