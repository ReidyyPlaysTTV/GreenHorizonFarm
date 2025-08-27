
import mysql from 'mysql2/promise';
import * as bcrypt from 'bcryptjs';

const DATABASE_URL = "mysql://zap1311701-2:J2IAJKgRfnrCphFq@mysql-mariadb16-lon-101.zap-srv.com/zap1311701-2";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

// Create and export the connection pool directly.
// Connections will be requested from this pool in the action files.
const pool = mysql.createPool(DATABASE_URL);

export default pool;
