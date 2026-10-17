
const http = require("http");
const fs = require("fs");
const path = require("path");

const HOST = "127.0.0.1";
const PORT = 3000;

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, `http://${HOST}:${PORT}`).pathname;

  if (pathname === "/api/chat" && req.method === "POST") {
    let body = "";

    req.on("data", chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
      }
    });

    req.on("end", async () => {
      try {
        const response = await fetch(
          "http://127.0.0.1:1234/v1/chat/completions",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body
          }
        );

        const data = await response.text();

        res.writeHead(response.status, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(data);
      } catch (error) {
        console.error("Error conectando con LM Studio:", error);

        res.writeHead(502, {
          "Content-Type": "application/json; charset=utf-8"
        });
        res.end(JSON.stringify({
          error: "No se pudo conectar con LM Studio."
        }));
      }
    });

    return;
  }

  let relativePath;

  try {
    relativePath = decodeURIComponent(
      pathname === "/" ? "/index.html" : pathname
    ).slice(1);
  } catch {
    res.writeHead(400);
    return res.end("Solicitud inválida");
  }

  const filePath = path.resolve(__dirname, relativePath);

  if (!filePath.startsWith(__dirname + path.sep)) {
    res.writeHead(403);
    return res.end("Acceso denegado");
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Archivo no encontrado");
    }

    res.writeHead(200, {
      "Content-Type":
        mimeTypes[path.extname(filePath)] || "application/octet-stream"
    });
    res.end(content);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`traductor.ai funcionando en http://${HOST}:${PORT}`);
});
