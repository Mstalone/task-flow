
const fs = require("node:fs/promises");
const path = require("node:path");

// Caminhos dos ficheiros do projeto
const ficheiroCodigo = path.join(__dirname, "..", "src", "tarefas.js");
const ficheiroConfig = path.join(__dirname, "..", "config", "ia", "config.json");

// Endereço da API REST do Ollama
const urlOllama = "http://127.0.0.1:11434/api/generate";

async function analisarCodigo() {
  try {
    // Ler a configuração versionada da IA
    const config = JSON.parse(
      await fs.readFile(ficheiroConfig, "utf8")
    );

    // Ler o código que será analisado
    const codigo = await fs.readFile(ficheiroCodigo, "utf8");

    // Preparar o pedido de análise
    const resposta = await fetch(urlOllama, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.modelo,
        prompt: `Analisa o seguinte código JavaScript.
Identifica no máximo ${config.parametros.limite_alertas} problemas reais.
Não repitas recomendações.
Responde em português de Portugal, de forma breve.

${codigo}`,
        stream: false,
        options: {
          temperature: config.parametros.temperatura,
          num_predict: config.parametros.num_predict,
          repeat_penalty: config.parametros.repeat_penalty
        }
      })
    });

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    // Obter a resposta da IA
    const resultado = await resposta.json();

    console.log("\n=== ANÁLISE DE CÓDIGO COM IA ===\n");
    console.log(resultado.response);

    // Mostrar a configuração utilizada
    console.log("\n=== CONFIGURAÇÃO P2 ===");
    console.log("Ferramenta:", config.ferramenta);
    console.log("Modelo:", resultado.model);
    console.log("Versão da configuração:", config.versao_configuracao);

    // Guardar o resultado da análise para auditoria e reprodução
    if (config.reprodutibilidade.guardar_resultados) {
      const pastaResultados = path.join(
        __dirname, "..", "resultados", "ia"
      );

      await fs.mkdir(pastaResultados, { recursive: true });

      const registo = {
        data: new Date().toISOString(),
        ficheiro_analisado: "src/tarefas.js",
        versao_configuracao: config.versao_configuracao,
        modelo: resultado.model,
        parametros: config.parametros,
        analise: resultado.response
      };

      const nomeFicheiro = `analise-${Date.now()}.json`;

      await fs.writeFile(
        path.join(pastaResultados, nomeFicheiro),
        JSON.stringify(registo, null, 2),
        "utf8"
      );

      console.log("Resultado guardado em:", path.join("resultados", "ia", nomeFicheiro));
    }


  } catch (erro) {
    console.error("Erro na análise com IA:", erro);
    process.exitCode = 1;
  }
}

analisarCodigo();
