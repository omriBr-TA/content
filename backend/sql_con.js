const mysql = require("mysql2");

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "avi19091994",
});

con.connect(function (err) {
  if (err) throw err;
  console.log("connected to db");
});
