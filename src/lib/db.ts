
import mysql from 'mysql2/promise';
import { seedDatabase } from './db-seed';

const DATABASE_URL = "mysql://zap1311701-2:J2IAJKgRfnrCphFq@mysql-mariadb16-lon-101.zap-srv.com/zap1311701-2";

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set.');
}

const pool = mysql.createPool(DATABASE_URL);

// Seed the database on application startup
seedDatabase(pool).catch(err => {
    console.error("Failed to seed database:", err);
});


export default pool;
