
import mysql from "mysql2/promise";

const db = await mysql.createConnection({
  host: "sql209.infinityfree.com",
  user: "if0_39785391",
  password: "anup1432",
  database: "if0_39785391_betwin"
});

export default db;
