const { Pool } = require("pg");
const dbConfig = require("../config/db.config.js");

const pool = new Pool({
  host: dbConfig.HOST,
  user: dbConfig.USER,
  password: dbConfig.PASSWORD,
  database: dbConfig.DB
});

module.exports = pool;