const test = require("node:test");
const assert = require("node:assert/strict");

const { criarTarefa } = require("../src/tarefas");

test("Deve criar uma tarefa com estado pendente", () => {
  const tarefa = criarTarefa("Estudar para o exame");

  assert.equal(tarefa.titulo, "Estudar para o exame");
  assert.equal(tarefa.estado, "pendente");
});

test("Não deve permitir criar tarefas sem título", () => {
  assert.throws(() => criarTarefa(""), {
    message: "O título da tarefa é obrigatório."
  });
});
