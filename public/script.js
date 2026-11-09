
const formulario = document.getElementById("form-tarefa");
const campoTitulo = document.getElementById("titulo-tarefa");
const campoPrioridade = document.getElementById("prioridade-tarefa");
const campoPrazo = document.getElementById("prazo-tarefa");

const listaTarefas = document.getElementById("lista-tarefas");
const mensagemVazia = document.getElementById("mensagem-vazia");
const mensagemFeedback = document.getElementById("mensagem-feedback");

const total = document.getElementById("total");
const pendentes = document.getElementById("pendentes");
const emProgresso = document.getElementById("em-progresso");
const concluidas = document.getElementById("concluidas");

const pesquisa = document.getElementById("pesquisa-tarefas");
const filtroEstado = document.getElementById("filtro-estado");
const filtroPrioridade = document.getElementById("filtro-prioridade");

const dialogoEditar = document.getElementById("dialogo-editar");
const formEditar = document.getElementById("form-editar");
const editarTitulo = document.getElementById("editar-titulo");
const editarPrioridade = document.getElementById("editar-prioridade");
const editarPrazo = document.getElementById("editar-prazo");

const prioridades = {
  alta: "Alta",
  media: "Média",
  baixa: "Baixa"
};

const estados = {
  pendente: "Pendente",
  em_progresso: "Em progresso",
  concluida: "Concluída"
};

let tarefas = [];
let idEmEdicao = null;

// Recuperar as tarefas existentes e adaptar o formato antigo
try {
  const guardadas = JSON.parse(
    localStorage.getItem("taskflow_tarefas") || "[]"
  );

  if (Array.isArray(guardadas)) {
    tarefas = guardadas
      .filter(
        t => t &&
        typeof t.titulo === "string" &&
        t.titulo.trim()
      )
      .map(t => ({
        id: typeof t.id === "string"
          ? t.id
          : crypto.randomUUID(),

        titulo: t.titulo.trim().slice(0, 120),

        prioridade: Object.hasOwn(prioridades, t.prioridade)
          ? t.prioridade
          : "media",

        prazo: typeof t.prazo === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(t.prazo)
          ? t.prazo
          : "",

        estado: Object.hasOwn(estados, t.estado)
          ? t.estado
          : (t.concluida ? "concluida" : "pendente")
      }));
  }
} catch (erro) {
  console.error("Não foi possível carregar as tarefas:", erro);

  mensagemFeedback.textContent =
    "Não foi possível recuperar as tarefas guardadas.";
}

// Guardar as tarefas no navegador
function guardarTarefas() {
  try {
    localStorage.setItem(
      "taskflow_tarefas",
      JSON.stringify(tarefas)
    );
  } catch (erro) {
    console.error("Não foi possível guardar as tarefas:", erro);

    mensagemFeedback.textContent =
      "Erro ao guardar as tarefas neste navegador.";
  }
}

// Formatar a data para português
function formatarPrazo(prazo) {
  if (!prazo) {
    return "Sem prazo";
  }

  const [ano, mes, dia] = prazo.split("-");

  return `${dia}/${mes}/${ano}`;
}

// Verificar se uma tarefa está atrasada
function prazoAtrasado(tarefa) {
  if (!tarefa.prazo || tarefa.estado === "concluida") {
    return false;
  }

  const hoje = new Date();

  const dataLocal =
    `${hoje.getFullYear()}-` +
    `${String(hoje.getMonth() + 1).padStart(2, "0")}-` +
    `${String(hoje.getDate()).padStart(2, "0")}`;

  return tarefa.prazo < dataLocal;
}

// Atualizar tarefas, filtros e contadores
function atualizarInterface() {
  listaTarefas.replaceChildren();

  total.textContent = tarefas.length;

  pendentes.textContent = tarefas.filter(
    t => t.estado === "pendente"
  ).length;

  emProgresso.textContent = tarefas.filter(
    t => t.estado === "em_progresso"
  ).length;

  concluidas.textContent = tarefas.filter(
    t => t.estado === "concluida"
  ).length;

  const termo = pesquisa.value
    .trim()
    .toLocaleLowerCase("pt-PT");

  const visiveis = tarefas.filter(t =>
    t.titulo.toLocaleLowerCase("pt-PT").includes(termo) &&
    (
      filtroEstado.value === "todos" ||
      t.estado === filtroEstado.value
    ) &&
    (
      filtroPrioridade.value === "todas" ||
      t.prioridade === filtroPrioridade.value
    )
  );

  visiveis.forEach(tarefa => {
    const item = document.createElement("li");
    item.className = "tarefa";

    if (tarefa.estado === "concluida") {
      item.classList.add("concluida");
    }

    // Informação da tarefa
    const info = document.createElement("div");
    info.className = "tarefa-info";

    const titulo = document.createElement("span");
    titulo.className = "tarefa-titulo";
    titulo.textContent = tarefa.titulo;

    const meta = document.createElement("div");
    meta.className = "tarefa-meta";

    const prioridade = document.createElement("span");
    prioridade.className =
      `etiqueta prioridade-${tarefa.prioridade}`;
    prioridade.textContent = prioridades[tarefa.prioridade];

    const prazo = document.createElement("span");
    prazo.textContent =
      `Prazo: ${formatarPrazo(tarefa.prazo)}`;

    if (prazoAtrasado(tarefa)) {
      prazo.className = "prazo-atrasado";
      prazo.textContent += " (atrasado)";
    }

    meta.append(prioridade, prazo);
    info.append(titulo, meta);

    // Selecionar o estado da tarefa
    const seletorEstado = document.createElement("select");
    seletorEstado.className = "estado-tarefa";

    seletorEstado.setAttribute(
      "aria-label",
      `Estado da tarefa: ${tarefa.titulo}`
    );

    Object.entries(estados).forEach(([valor, nome]) => {
      const opcao = document.createElement("option");
      opcao.value = valor;
      opcao.textContent = nome;
      seletorEstado.appendChild(opcao);
    });

    seletorEstado.value = tarefa.estado;

    seletorEstado.addEventListener("change", () => {
      tarefa.estado = seletorEstado.value;
      guardarTarefas();
      atualizarInterface();
    });

    // Botões de edição e eliminação
    const acoes = document.createElement("div");
    acoes.className = "acoes-tarefa";

    const botaoEditar = document.createElement("button");
    botaoEditar.type = "button";
    botaoEditar.className = "botao-editar";
    botaoEditar.textContent = "Editar";

    botaoEditar.addEventListener("click", () => {
      idEmEdicao = tarefa.id;

      editarTitulo.value = tarefa.titulo;
      editarPrioridade.value = tarefa.prioridade;
      editarPrazo.value = tarefa.prazo;

      dialogoEditar.showModal();
    });

    const botaoEliminar = document.createElement("button");
    botaoEliminar.type = "button";
    botaoEliminar.className = "botao-eliminar";
    botaoEliminar.textContent = "Eliminar";

    botaoEliminar.addEventListener("click", () => {
      const confirmar = confirm(
        `Eliminar a tarefa "${tarefa.titulo}"?`
      );

      if (!confirmar) {
        return;
      }

      tarefas = tarefas.filter(t => t.id !== tarefa.id);

      guardarTarefas();
      atualizarInterface();
    });

    acoes.append(botaoEditar, botaoEliminar);
    item.append(info, seletorEstado, acoes);

    listaTarefas.appendChild(item);
  });

  mensagemVazia.hidden = visiveis.length > 0;

  mensagemVazia.textContent = tarefas.length === 0
    ? "Ainda não existem tarefas. Adiciona a primeira!"
    : "Não existem tarefas que correspondam aos filtros.";
}

// Criar uma nova tarefa
formulario.addEventListener("submit", evento => {
  evento.preventDefault();

  const titulo = campoTitulo.value.trim();

  if (!titulo || titulo.length > 120) {
    alert("Introduz um título válido com até 120 caracteres.");
    return;
  }

  tarefas.push({
    id: crypto.randomUUID(),
    titulo: titulo,
    prioridade: campoPrioridade.value,
    prazo: campoPrazo.value,
    estado: "pendente"
  });

  guardarTarefas();

  formulario.reset();
  campoTitulo.focus();

  atualizarInterface();
});

// Guardar alterações de uma tarefa
formEditar.addEventListener("submit", evento => {
  evento.preventDefault();

  const tarefa = tarefas.find(t => t.id === idEmEdicao);

  if (!tarefa) {
    return;
  }

  const titulo = editarTitulo.value.trim();

  if (!titulo || titulo.length > 120) {
    alert("Introduz um título válido com até 120 caracteres.");
    return;
  }

  tarefa.titulo = titulo;
  tarefa.prioridade = editarPrioridade.value;
  tarefa.prazo = editarPrazo.value;

  guardarTarefas();

  dialogoEditar.close();
  atualizarInterface();
});

// Cancelar a edição
document.getElementById("cancelar-edicao")
  .addEventListener("click", () => {
    dialogoEditar.close();
  });

// Limpar a referência da tarefa em edição
dialogoEditar.addEventListener("close", () => {
  idEmEdicao = null;
});

// Atualizar a lista quando os filtros mudam
[pesquisa, filtroEstado, filtroPrioridade].forEach(campo => {
  campo.addEventListener(
    campo === pesquisa ? "input" : "change",
    atualizarInterface
  );
});

// Mostrar as tarefas ao abrir a aplicação
atualizarInterface();
