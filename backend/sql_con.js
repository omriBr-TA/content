const mysql = require("mysql2/promise");

try {
  const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "avi19091994",
    database: "koali_content",
  });

  const [results, fields] = con.execute("SELECT * FROM `content_provider`;");
  console.log(results, fields);
} catch (err) {
  console.log(err);
}
