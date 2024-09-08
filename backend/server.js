// const { createServer } = require("node:http");
// const { readFile } = require("node:fs");
// const { join, extname } = require("node:path");

// const hostname = "0.0.0.0";
// const port = 3000;

// const frontendDir = join(__dirname, "../frontend");

// const pool = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "avi19091994",
//   database: "koali_content",
// });

// const server = createServer((req, res) => {
//   const [rows] = pool.query("SELECT * FROM `content_provider`;");
//   let links = rows.map(row => `<a href="${row.WebsiteUrl}" target="_blank">${row.Name}</a>`).join('');
//   let filePath = join(
//     frontendDir,
//     req.url === "/" ? "koali_content.html" : req.url
//   );

//   const ext = extname(filePath);
//   let contentType = "text/html; charset=utf-8";
//   switch (ext) {
//     case ".css":
//       contentType = "text/css";
//       break;
//     case ".png":
//       contentType = "image/png";
//       break;
//     case ".js":
//       contentType = "application/javascript";
//       break;
//   }
//   readFile(filePath, (err, data) => {
//     if (err) {
//       res.statusCode = 404;
//       res.setHeader("Content-Type", "text/plain");
//       res.end("404: File Not Found");
//     } else {
//       res.statusCode = 200;
//       res.setHeader("Content-Type", contentType);
//       res.end(data);
//     }
//   });
// });

// server.listen(port, hostname, () => {
//   console.log(`Server running at http://${hostname}:${port}/`);
// });

const mysql = require("mysql2/promise");
const { createServer } = require("node:http");
const { readFile } = require("node:fs").promises;
const { join, extname } = require("node:path");

const hostname = "0.0.0.0";
const port = 3000;

const frontendDir = join(__dirname, "../frontend");

// Create the connection pool
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "avi19091994",
  database: "koali_content",
});

const server = createServer(async (req, res) => {
  try {
    // Query the database for the content providers
    const [rows] = await pool.query("SELECT * FROM `content_provider`;");
    let links = rows
      .map(
        (row) => `<a href="${row.WebsiteURL}" target="_blank">${row.Name}</a>`
      )
      .join("");

    // Define the file path
    let filePath = join(
      frontendDir,
      req.url === "/" ? "koali_content.html" : req.url
    );

    // Determine the content type based on file extension
    const ext = extname(filePath);
    let contentType = "text/html; charset=utf-8";
    switch (ext) {
      case ".css":
        contentType = "text/css";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".js":
        contentType = "application/javascript";
        break;
    }

    // Read the HTML file
    let html = await readFile(filePath, "utf-8");

    // Inject the links into the HTML file (replace placeholder with actual links)
    html = html.replace("<!-- LINKS_PLACEHOLDER -->", links);

    // Send the modified HTML file as the response
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.end(html);
  } catch (err) {
    // Handle any errors (database, file read, etc.)
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error");
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
