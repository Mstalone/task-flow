const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

// Pasta onde estão os ficheiros da interface web
const pastaPublica = path.join(__dirname, "..", "public");

// Ficheiros que podem ser disponibilizados pelo servidor
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

// Criar o servidor HTTP
const servidor = http.createServer((req, res) => {

  // Impedir a interpretação incorreta de tipos de ficheiros
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Proteger a aplicação contra ataques de clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Definir a política de segurança de conteúdos
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self'; " +
    "img-src 'self' data:; " +
    "object-src 'none'; " +
    "base-uri 'self'; " +
    "frame-ancestors 'none'; " +
    "form-action 'self'"
  );

  // Restringir funcionalidades não utilizadas pela aplicação
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  // Evitar o armazenamento de respostas em cache HTTP
  res.setHeader("Cache-Control", "no-store");

  // Restringir a incorporação de recursos entre origens
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // Endpoint para verificar o estado do servidor
  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
      estado: "ok"
    }));

    return;
  }

  // Permitir apenas pedidos HTTP GET
  if (req.method !== "GET") {
    res.writeHead(405, {
      "Content-Type": "application/json; charset=utf-8",
      "Allow": "GET"
    });

    res.end(JSON.stringify({
      erro: "Método não permitido"
    }));

    return;
  }

  // Verificar se o recurso solicitado é permitido
  const recurso = arquivosPermitidos[req.url];

  if (!recurso) {
    res.writeHead(404, {
      "Content-Type": "application/json; charset=utf-8"
    });

    res.end(JSON.stringify({
      erro: "Página não encontrada"
    }));

    return;
  }

  // Obter o caminho do ficheiro solicitado
  const caminhoFicheiro = path.join(
    pastaPublica,
    recurso.arquivo
  );

  // Ler e disponibilizar o ficheiro
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

// Definir a porta do servidor
const porta = process.env.PORT || 3000;

// Iniciar o servidor apenas quando executado diretamente
if (require.main === module) {
  servidor.listen(porta, "0.0.0.0", () => {
    console.log(
      `TaskFlow disponível em http://127.0.0.1:${porta}`
    );
  });
}

// Exportar o servidor para permitir testes automatizados
module.exports = { servidor };
