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
const url = require('node:url');
const { parse } = require('querystring');
require('dotenv').config();

const hostname = "0.0.0.0";
const port = 80;

const frontendDir = join(__dirname, "../frontend");
const anotherFrontendDir = join(__dirname, "../frontend"); // Directory for another website

// Create the connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5,
});

const server = createServer(async (req, res) => {
  try {
    if (req.url === '/api/createProvider') {
      // Parse the JSON body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        const { name, websiteURL, contactInfo } = JSON.parse(body);

        try {
          // Insert into the database
          const query = "INSERT INTO `content_provider` (`Name`, `WebsiteURL`, `ContactInfo`) VALUES (?, ?, ?)";
          const [result] = await pool.query(query, [name, websiteURL, contactInfo]);

          // Get the inserted provider ID
          const newProviderId = result.insertId;

          // Respond with success and the newly created provider's ID
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Provider created successfully!', id: newProviderId }));
        } catch (error) {
          console.error('Database Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Internal Server Error' }));
        }
      });
    }
    
    else if (req.url === '/api/createActivity') {
      // Parse the JSON body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      req.on('end', async () => {
        const { title, url, language,providerId, templateId } = JSON.parse(body);

        try {
          // Insert into the database
          const query = "INSERT INTO `content` (`Title`, `URL`, `Language`,`ContentProviderID`, `templateID`) VALUES (?, ?, ?,?,?)";
          const [result] = await pool.query(query, [title, url, language, providerId,templateId]);

          // Get the inserted provider ID
          //const newProviderId = result.insertId;

          // Respond with success and the newly created provider's ID
          res.statusCode = 201;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Activity created successfully!'}));
        } catch (error) {
          console.error('Database Error:', error);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'Internal Server Error' }));
        }
      });
    }
    
    else if (req.url.startsWith('/api/getProviderActivities')) {
      const query = parse(req.url.split('?')[1]); // Parse query string
    
      try {
        const id = query.id; // Get provider ID from query string
    
        if (!id) {
          // If ID is not provided, return a 400 error
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Provider ID is required" }));
          return;
        }
    
        const [rows] = await pool.query(
          'SELECT title, url, language,templateID FROM content WHERE ContentProviderID = ?', 
          [id]
        );
    
        // Return the results as JSON
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(rows)); // Send the response as JSON
      } catch (err) {
        console.error(err);
        // Handle server errors
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
      }
    }
     else if (req.url === '/favicon.ico') {
      // You can handle the favicon request here, or just ignore it
      res.statusCode = 404;
      res.end();
      return;
    }

    else if (req.url === '/api/getAllProviders' ) {
      const query = "SELECT `id`, `Name` AS `name`, `WebsiteURL` AS `websiteURL`, `ContactInfo` AS `contactInfo` FROM `content_provider`";
      const [rows] = await pool.query(query);
    
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(rows));
    }
    else if (req.url === '/api/getTemplates' ) {
      const query = "SELECT `id`, `name` FROM `template`";
      const [rows] = await pool.query(query);
    
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(rows));
    }
    else {
      const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
      // Existing code for serving HTML files
      let isAnotherWebsite = req.url.startsWith("/provider");
      let filePath = isAnotherWebsite
        ? join(anotherFrontendDir, req.url === "/provider" ? "providers_main.html" : req.url)
        : join(frontendDir, req.url === "/" ? "koali_content.html" : req.url);

        if (pathname === "/provider_content.html") {
          filePath = join(frontendDir, "provider_content.html");
        }
        else if(pathname === "/create_activity.html"){
          filePath = join(frontendDir, "create_activity.html");
        }

      let [rows] = await pool.query("SELECT * FROM `content_provider`;");
      let links = rows.map((row) => `<a href="${row.WebsiteURL}" target="_blank">${row.Name}</a>`).join("");

      const ext = extname(filePath);
      let contentType = "text/html; charset=utf-8";
      switch (ext) {
        case ".css": contentType = "text/css"; break;
        case ".png": contentType = "image/png"; break;
        case ".js": contentType = "application/javascript"; break;
      }

      let html = await readFile(filePath, "utf-8");
      html = html.replace("<!-- LINKS_PLACEHOLDER -->", links);

      res.statusCode = 200;
      res.setHeader("Content-Type", contentType);
      res.end(html);
    }
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "text/plain");
    res.end("Internal Server Error");
  }

});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});