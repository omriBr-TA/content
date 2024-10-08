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
        const { title, url, language,providerId, templateId,ageMin,ageMax } = JSON.parse(body);

        try {
          // Insert into the database
          const query = "INSERT INTO `content` (`Title`, `URL`, `Language`,`ContentProviderID`, `templateID`,`age_min`,`age_max`) VALUES (?, ?, ?,?,?,?,?)";
          const [result] = await pool.query(query, [title, url, language, providerId,templateId,ageMin,ageMax]);

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
          'SELECT ID,title, url, language,templateID,age_min,age_max FROM content WHERE ContentProviderID = ?', 
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
    else if (req.url.startsWith('/api/deleteProvider')) {
      const query = parse(req.url.split('?')[1]); // Parse query string
    
      try {
        const id = query.id; // Get provider ID from query string
    
        if (!id) {
          // If ID is not provided, return a 400 error
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Provider ID is required" }));
          return;
        }
    
        // First, delete all activities associated with the provider
        await pool.query('DELETE FROM content WHERE ContentProviderID = ?', [id]);
    
        // Then, delete the provider itself
        const [result] = await pool.query('DELETE FROM content_provider WHERE id = ?', [id]);
    
        if (result.affectedRows > 0) {
          // If the provider was deleted successfully
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Provider deleted successfully' }));
        } else {
          // If no provider was found with the given ID
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Provider not found' }));
        }
      } catch (err) {
        console.error(err);
        // Handle server errors
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
      }
    }
    else if (req.url.startsWith('/api/deleteActivity')) {
      const query = parse(req.url.split('?')[1]); // Parse query string
    
      try {
        const id = query.id; // Get activity ID from query string
    
        if (!id) {
          // If ID is not provided, return a 400 error
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Activity ID is required" }));
          return;
        }
    
        // Delete the activity from the content table
        const [result] = await pool.query('DELETE FROM content WHERE id = ?', [id]);
    
        if (result.affectedRows > 0) {
          // If the activity was deleted successfully
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Activity deleted successfully' }));
        } else {
          // If no activity was found with the given ID
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Activity not found' }));
        }
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
    else if (req.url.startsWith('/api/updateProvider') && req.method === 'PUT') {
      let body = '';
    
      // Gather the request body
      req.on('data', chunk => {
        body += chunk.toString(); // Convert chunk to string and append
      });
    
      req.on('end', async () => {
        try {
          const providerData = JSON.parse(body); // Parse the body to get the provider data
          const { id, name, contactInfo, websiteURL } = providerData; // Destructure the provider fields
    
          if (!id || !name || !contactInfo || !websiteURL) {
            // If required fields are missing, return a 400 error
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "All provider fields are required" }));
            return;
          }
    
          // Update the provider in the database
          const [result] = await pool.query(
            'UPDATE content_provider SET name = ?, contactInfo = ?, websiteURL = ? WHERE id = ?',
            [name, contactInfo, websiteURL, id]
          );
    
          if (result.affectedRows > 0) {
            // If the provider was updated successfully
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Provider updated successfully' }));
          } else {
            // If no provider was found with the given ID
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Provider not found' }));
          }
        } catch (err) {
          console.error(err);
          // Handle server errors
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Internal Server Error' }));
        }
      });
    } 
    else if (req.url.startsWith('/api/updateActivity')) {
      let body = '';
    
      // Gather the request body
      req.on('data', chunk => {
        body += chunk.toString(); // Convert chunk to string and append
      });
    
      req.on('end', async () => {
        try {
          const activityData = JSON.parse(body); // Parse the body to get the activity data
          const { id, title, url, language, templateID, ageMin,ageMax } = activityData; // Destructure the activity fields
    
          if (!id || !title || !url || !language || !templateID|| !ageMin|| !ageMax) {
            // If required fields are missing, return a 400 error
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: "All activity fields are required" }));
            return;
          }
    
          // Update the activity in the database
          const [result] = await pool.query(
            'UPDATE content SET title = ?, url = ?, language = ?, templateID = ?, age_min = ?, age_max = ?, WHERE id = ?',
            [title, url, language, templateID,ageMin,ageMax, id]
          );
    
          if (result.affectedRows > 0) {
            // If the activity was updated successfully
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Activity updated successfully' }));
          } else {
            // If no activity was found with the given ID
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Activity not found' }));
          }
        } catch (err) {
          console.error(err);
          // Handle server errors
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Internal Server Error' }));
        }
      });
    }
    else if (req.url.startsWith('/api/getActivityById') ) {
      const query = parse(req.url.split('?')[1]); // Parse query string
    
      try {
        const id = query.activityId; // Get activity ID from query string
    
        if (!id) {
          // If ID is not provided, return a 400 error
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: "Activity ID is required" }));
          return;
        }
    
        const [rows] = await pool.query(
          'SELECT ID, title, url, language, templateID,age_min,age_max FROM content WHERE id = ?',
          [id]
        );
    
        if (rows.length > 0) {
          // If activity is found, return it as JSON
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rows[0]));
        } else {
          // If no activity was found with the given ID
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Activity not found' }));
        }
      } catch (err) {
        console.error(err);
        // Handle server errors
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
      }
    }
    else if (req.url.startsWith('/api/getProviderById')) {
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
          'SELECT ID, name, contactInfo, websiteURL FROM content_provider WHERE id = ?',
          [id]
        );
    
        if (rows.length > 0) {
          // If provider is found, return it as JSON
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(rows[0]));
        } else {
          // If no provider was found with the given ID
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'Provider not found' }));
        }
      } catch (err) {
        console.error(err);
        // Handle server errors
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Internal Server Error' }));
      }
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
        else if(pathname === "/edit_activity.html"){
          filePath = join(frontendDir, "edit_activity.html");
        }
        else if(pathname === "/edit_provider.html"){
          filePath = join(frontendDir, "edit_provider.html");
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