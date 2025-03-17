import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';

dotenv.config();

// Cung cấp thông tin kết nối từ biến môi trường hoặc cài đặt trực tiếp
const pool = new Pool({
  host: process.env.DATABASE_POSTGRES_HOST,
  port: Number(process.env.DATABASE_POSTGRES_PORT),
  user: process.env.DATABASE_POSTGRES_USERNAME,
  password: process.env.DATABASE_POSTGRES_PASSWORD,
  database: process.env.DATABASE_NAME,
  // ssl: {
  //   rejectUnauthorized: false,
  // }
});

// Kết nối cơ sở dữ liệu
pool.connect((err, client, release) => {
  const sql = readFileSync('seed.sql').toString();
  if (err) {
    return console.error('Lỗi khi kết nối cơ sở dữ liệu:', err);
  }
  console.log('Đã kết nối thành công đến cơ sở dữ liệu PostgreSQL.');

  // Thực hiện các truy vấn cơ sở dữ liệu
  client.query(sql, (err) => {
    release(); // Giải phóng kết nối

    if (err) {
      return console.error('Lỗi khi thực hiện truy vấn:', err);
    }
    console.log('Đã thực hiện truy vấn thành công.');

    // Đóng kết nối
    pool.end();
  });
});
