
const fs = require("node:fs/promises");
const path = require("node:path");

// Caminhos dos ficheiros
const ficheiroCodigo = path.join(__dirname, "..", "src", "tarefas.js");
const ficheiroConfig = path.join(__dirname, "..", "config", "ia", "config.json");

// Endereço do Ollama
const urlOllama = "http://127.0.0.1:11434/api/generate";

async function analisarCodigo() {
  try {
    // Ler as configurações da IA
    const config = JSON.parse(
      await fs.readFile(ficheiroConfig, "utf8")
    );

    // Ler o código que vai ser analisado
    const codigo = await fs.readFile(ficheiroCodigo, "utf8");

    // Criar as instruções para a análise
    const prompt = `Analisa o seguinte código JavaScript.
Identifica no máximo ${config.parametros.limite_alertas} problemas.
Não repitas recomendações.
Responde de forma breve.

${codigo}`;

    // Enviar o código para o Ollama
    const resposta = await fetch(urlOllama, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.modelo,
        prompt: prompt,
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

    // Obter o resultado da análise
    const resultado = await resposta.json();

    console.log("\n=== ANÁLISE DE CÓDIGO COM IA ===\n");
    console.log(resultado.response);

    // Mostrar as configurações utilizadas
    console.log("\n=== CONFIGURAÇÃO P2 ===");
    console.log("Ferramenta:", config.ferramenta);
    console.log("Modelo:", resultado.model);
    console.log("Versão da configuração:", config.versao_configuracao);

    // Guardar o resultado num ficheiro JSON
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
        prompt: prompt,
        analise: resultado.response
      };

      const nomeFicheiro = `analise-${Date.now()}.json`;

      await fs.writeFile(
        path.join(pastaResultados, nomeFicheiro),
        JSON.stringify(registo, null, 2),
        "utf8"
      );

      console.log(
        "Resultado guardado em:",
        path.join("resultados", "ia", nomeFicheiro)
      );
    }

  } catch (erro) {
    console.error("Erro na análise com IA:", erro);
    process.exitCode = 1;
  }
}

analisarCodigo();
