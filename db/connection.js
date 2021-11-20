const mysql = require('mysql');
const util = require('util');
const dotenv = require('dotenv');
dotenv.config();
const CONFIG = require("../config/config");

const pool = mysql.createPool({
  connectionLimit: 10,
  host: CONFIG.DB_HOST,
  user: CONFIG.DB_USER,
  password: CONFIG.DB_PASSWORD,
  database: CONFIG.DB_NAME,
  port: 3306
});
pool.getConnection((error, connection) => {
  if (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused by Database');
    }
    if (error.code === 'ER_CON_COUNT_ERROR') {
      console.error('Connection limit reached for Database');
    }
    if (error.code === 'PROTOCOL_CONNECTION_LOST') {
      console.error('Connection was closed.');
    }
  }
  if (connection) connection.release();
});

pool.query = util.promisify(pool.query);

module.exports = pool;
