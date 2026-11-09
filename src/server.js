const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const carpetaPublica = path.join(__dirname, "..", "public");

const arquivosPermitidos = {
  "/": {
    arquivo: "index.html",
    tipo: "text/html; charset=utf-8"
  },
  "/style.css": {
    arquivo: "style.css",
    tipo: "text/css; charset=utf-8"
  },
  "/script.js": {
    arquivo: "script.js",
    tipo: "text/javascript; charset=utf-8"
  }
};

const servidor = http.createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Endpoint utilizado para verificar o estado do servidor
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({ estado: "ok" }));
    return;
  }

  // Permitir apenas pedidos GET para os ficheiros públicos
  if (req.method !== "GET") {
    res.writeHead(405, {
      "Content-Type": "application/json; charset=utf-8",
      "Allow": "GET"
    });

    res.end(JSON.stringify({ erro: "Método não permitido" }));
    return;
  }

  const recurso = arquivosPermitidos[req.url];

  if (!recurso) {
    res.writeHead(404, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({ erro: "Página não encontrada" }));
    return;
  }

  const caminhoFicheiro = path.join(
    carpetaPublica,
    recurso.arquivo
  );

  fs.readFile(caminhoFicheiro, (erro, conteudo) => {
    if (erro) {
      res.writeHead(500, {
        "Content-Type": "application/json; charset=utf-8"
      });

      res.end(JSON.stringify({
        erro: "Não foi possível carregar o ficheiro"
      }));
      return;
    }

    res.writeHead(200, {
      "Content-Type": recurso.tipo
    });

    res.end(conteudo);
  });
});

const porta = process.env.PORT || 3000;

if (require.main === module) {
  servidor.listen(porta, "0.0.0.0", () => {
    console.log(
      `TaskFlow disponível em http://127.0.0.1:${porta}`
    );
  });
}

module.exports = { servidor };
