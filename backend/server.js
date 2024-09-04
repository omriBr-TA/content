const { createServer } = require("node:http");
const { readFile } = require("node:fs");
const { join, extname } = require("node:path");

const hostname = "127.0.0.1";
const port = 3000;

const frontendDir = join(__dirname, "../frontend");

const server = createServer((req, res) => {
  let filePath = join(
    frontendDir,
    req.url === "/" ? "koali_content.html" : req.url
  );

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
  readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      res.end("404: File Not Found");
    } else {
      res.statusCode = 200;
      res.setHeader("Content-Type", contentType);
      res.end(data);
    }
  });

  // res.statusCode = 200;
  // res.setHeader("Content-Type", "text/plain");
  // res.end("Hi from koali content server");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
