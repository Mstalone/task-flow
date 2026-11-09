function criarTarefa(titulo) {
  if (typeof titulo !== "string" || titulo.trim() === "") {
    throw new Error("O título da tarefa é obrigatório.");
  }

  return {
    titulo: titulo.trim(),
    estado: "pendente"
  };
}

module.exports = { criarTarefa };
