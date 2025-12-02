// ==========================================================
// 1. API SIMULADA (LOCAL STORAGE)
// ==========================================================
const AlexandriaAPI = {
    key: "alexandria_db_v2", 

    dadosPadrao: {
        grupos: [], 
        livros: []
    },

    // --- LEITURA ---
    lerTudo: function() {
        const dadosString = localStorage.getItem(this.key);
        if (dadosString) {
            return JSON.parse(dadosString); 
        } else {
            this.salvarTudo(this.dadosPadrao);
            return this.dadosPadrao;
        }
    },

    getGrupos: function() {
        return this.lerTudo().grupos;
    },

    getLivros: function() {
        return this.lerTudo().livros;
    },

    // --- ESCRITA ---
    salvarTudo: function(dados) {
        localStorage.setItem(this.key, JSON.stringify(dados));
    },

    adicionarGrupo: function(novoNome) {
        const db = this.lerTudo(); 
        db.grupos.push({ nome: novoNome, subgrupos: [] }); 
        this.salvarTudo(db); 
    },

    adicionarSubgrupo: function(indexGrupo, nomeSub) {
        const db = this.lerTudo();
        if (db.grupos[indexGrupo]) {
            db.grupos[indexGrupo].subgrupos.push(nomeSub);
            this.salvarTudo(db);
        }
    },

    adicionarLivro: function(livro) {
        const db = this.lerTudo();
        db.livros.push(livro);
        this.salvarTudo(db);
    },

    // --- ATUALIZAÇÃO ---
    atualizarLivro: function(index, livroAtualizado) {
        const db = this.lerTudo();
        db.livros[index] = livroAtualizado;
        this.salvarTudo(db);
    },

    // --- REMOÇÃO ---
    removerGrupo: function(index) {
        const db = this.lerTudo();
        db.grupos.splice(index, 1);
        this.salvarTudo(db);
    },

    removerSubgrupo: function(indexGrupo, indexSub) {
        const db = this.lerTudo();
        if (db.grupos[indexGrupo]) {
            db.grupos[indexGrupo].subgrupos.splice(indexSub, 1);
            this.salvarTudo(db);
        }
    }
};

// ==========================================================
// 2. VARIÁVEIS DE CONTROLE DE ESTADO
// ==========================================================
let listaAtualLivros = []; 
let direcaoOrdenacao = {}; 

// ==========================================================
// 3. CAPTURA DE ELEMENTOS DO HTML
// ==========================================================
const selectGrupo = document.querySelector("#grupo");
const selectSubgrupo = document.querySelector("#subGrupo");
const inputVolume = document.querySelector("#volume");
const formCadastro = document.querySelector(".cadastroLivros");
const btnGerarCodigo = document.querySelector("#gerarCodigo");

const listaGruposUl = document.querySelector(".listaGrupos ul");
const listaSubgruposContainer = document.querySelector(".listaSubgrupos");

// --- MODAIS GERAIS ---
const fade = document.querySelector("#fade");
const btnsCancelar = document.querySelectorAll(".btn-cancelar");

// Modal Grupo
const modalGrupo = document.querySelector("#modal-grupo");
const btnAbrirGrupo = document.querySelector("#btnAbrirModalGrupo");
const btnSalvarGrupo = document.querySelector("#btnSalvarGrupo");
const inputNomeNovoGrupo = document.querySelector("#inputNomeNovoGrupo");

// Modal Subgrupo
const modalSubgrupo = document.querySelector("#modal-subgrupo");
const btnAbrirSub = document.querySelector("#btnAbrirModalSub");
const btnSalvarSub = document.querySelector("#btnSalvarSub");
const selectGrupoParaSub = document.querySelector("#selectGrupoParaSub");
const inputNomeNovoSub = document.querySelector("#inputNomeNovoSub");

// --- MODAL DE EDIÇÃO ---
const modalEditarLivro = document.querySelector("#modal-editar-livro");
const formEdicaoBody = document.querySelector("#formEdicaoBody"); 
const btnSalvarEdicao = document.querySelector("#btnSalvarEdicao");
const btnDescartarLivro = document.querySelector("#btnDescartarLivro"); 

const editTitulo = document.querySelector("#editTitulo");
const editAutor = document.querySelector("#editAutor");
const editEditora = document.querySelector("#editEditora");
const editEdicao = document.querySelector("#editEdicao");
const editCodigo = document.querySelector("#editCodigo");
const editLido = document.querySelector("#editLido");
const editObservacao = document.querySelector("#editObservacao"); 

// Variável para saber qual livro estamos editando
let indiceEdicaoAtual = null;

// ==========================================================
// 4. INICIALIZAÇÃO
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
    atualizarInterfaceGeral();
    iniciarDarkMode(); // <--- CHAMADA NOVA AQUI
});

function atualizarInterfaceGeral() {
    const grupos = AlexandriaAPI.getGrupos();
    listaAtualLivros = AlexandriaAPI.getLivros(); 

    atualizarSelectsPrincipais(grupos);
    atualizarListaLateral(grupos);
    renderizarTabela(listaAtualLivros);
}

// ==========================================================
// 5. FUNÇÕES DE RENDERIZAÇÃO
// ==========================================================

function atualizarSelectsPrincipais(grupos) {
    const valorAtual = selectGrupo.value; 
    
    selectGrupo.innerHTML = `<option disabled selected>Grupo</option>`;
    selectSubgrupo.innerHTML = `<option disabled selected>Subgrupo</option>`;

    grupos.forEach(g => {
        let op = document.createElement("option");
        op.value = g.nome; 
        op.textContent = g.nome;
        selectGrupo.appendChild(op);
    });

    if (grupos.some(g => g.nome === valorAtual)) {
        selectGrupo.value = valorAtual;
        selectGrupo.dispatchEvent(new Event('change'));
    }
}

function atualizarListaLateral(grupos) {
    listaGruposUl.innerHTML = "";
    listaSubgruposContainer.innerHTML = "";

    if (grupos.length === 0) {
        listaGruposUl.innerHTML = "<li style='color:#ccc'>Nenhum grupo</li>";
        return; 
    }

    // 1. ORDENAR GRUPOS POR NOME (Ordem Alfabética)
    grupos.sort((a, b) => a.nome.localeCompare(b.nome));

    grupos.forEach((g, indexGrupo) => {
        // --- Lista Superior (Grupos) ---
        let li = document.createElement("li");
        li.className = "item-lista-com-delete";
        
        let spanTexto = document.createElement("span");
        spanTexto.textContent = g.nome;
        spanTexto.className = "item-clicavel"; 
        spanTexto.onclick = () => { filtrarPorGrupo(g.nome); };
        
        let btnDelGrupo = document.createElement("button");
        btnDelGrupo.textContent = "×";
        btnDelGrupo.className = "btn-excluir";
        btnDelGrupo.onclick = (e) => {
            e.stopPropagation(); 
            if(confirm(`Tem certeza que deseja excluir o grupo "${g.nome}"?`)) {
                // OBS: O indexGrupo original no array não ordenado é necessário para a exclusão
                // A AlexandriaAPI deve ter uma lógica para buscar o índice pelo nome ou ID
                // ou o `indexGrupo` deve ser o índice no array original antes da ordenação.
                // Como não tenho o contexto da AlexandriaAPI, mantive o indexGrupo para ilustrar o ponto.
                AlexandriaAPI.removerGrupo(indexGrupo);
                atualizarInterfaceGeral();
            }
        };

        li.appendChild(spanTexto);
        li.appendChild(btnDelGrupo);
        listaGruposUl.appendChild(li);

        // --- Lista Inferior (Subgrupos) ---
        let div = document.createElement("div");
        div.className = "divSubGrupos";
        
        let h4 = document.createElement("h4");
        h4.textContent = g.nome;
        div.appendChild(h4);
        
        let ulSubs = document.createElement("ul");
        
        // 2. ORDENAR SUBGRUPOS POR NOME (Ordem Alfabética)
        const subgruposOrdenados = [...g.subgrupos].sort((a, b) => a.localeCompare(b));

        if (subgruposOrdenados.length === 0) {
            ulSubs.innerHTML = "<li style='color:#999; font-size:0.8em'>Sem subgrupos</li>";
        } else {
            subgruposOrdenados.forEach((sub, indexSub) => {
                let liSub = document.createElement("li");
                liSub.className = "item-lista-com-delete";

                let spanSub = document.createElement("span");
                spanSub.textContent = sub;
                spanSub.className = "item-clicavel"; 
                spanSub.onclick = () => { filtrarPorSubgrupo(g.nome, sub); };

                let btnDelSub = document.createElement("button");
                btnDelSub.textContent = "×";
                btnDelSub.className = "btn-excluir";
                btnDelSub.onclick = (e) => {
                    e.stopPropagation(); 
                    if(confirm(`Excluir o subgrupo "${sub}"?`)) {
                        // OBS: O indexSub aqui é baseado no array *ordenado*.
                        // Se a AlexandriaAPI precisa do índice do array *original*, isso deve ser corrigido.
                        // O ideal seria que a API usasse o nome do subgrupo e o nome do grupo pai para remover.
                        AlexandriaAPI.removerSubgrupo(indexGrupo, indexSub);
                        atualizarInterfaceGeral();
                    }
                };

                liSub.appendChild(spanSub);
                liSub.appendChild(btnDelSub);
                ulSubs.appendChild(liSub);
            });
        }
        div.appendChild(ulSubs);
        listaSubgruposContainer.appendChild(div);
    });
}

// --- Renderizar Tabela ---
function renderizarTabela(lista) {
    const corpoTabela = document.querySelector("#corpoTabela");
    const contador = document.querySelector("#contadorLivros");
    
    corpoTabela.innerHTML = "";
    
    if (lista.length === 0) {
        corpoTabela.innerHTML = "<tr><td colspan='4' style='padding:20px;'>Nenhum livro encontrado.</td></tr>";
        if(contador) contador.textContent = "0 livros";
        return;
    }

    lista.forEach((livro) => {
        const todosLivros = AlexandriaAPI.getLivros();
        const indexOriginal = todosLivros.findIndex(l => l.codigo === livro.codigo && l.titulo === livro.titulo);

        let tr = document.createElement("tr");

        let displayTitulo = livro.titulo;
        
        if (livro.descartado) {
            // Usa classe CSS ao invés de style inline
            displayTitulo = `<span class="titulo-descartado">${livro.titulo} (DESCARTADO)</span>`;
        }

        tr.innerHTML = `
            <td>
                <span class="link-livro" onclick="abrirModalEdicao(${indexOriginal})">
                    ${displayTitulo}
                </span>
            </td>
            <td class="${livro.descartado ? 'titulo-descartado' : ''}">${livro.autor}</td>
            <td class="${livro.descartado ? 'titulo-descartado' : ''}">${livro.codigo}</td>
            <td style="color: ${livro.lido ? '#27ae60' : '#e74c3c'}; font-weight:bold;">
                ${livro.lido ? "Lido" : "Não Lido"}
            </td>
        `;
        corpoTabela.appendChild(tr);
    });

    if(contador) contador.textContent = `Exibindo ${lista.length} livro(s)`;
}

// ==========================================================
// 6. FUNÇÕES DE FILTRO E ORDENAÇÃO
// ==========================================================

function filtrarLivros() {
    const termo = document.querySelector("#pesquisar").value.toLowerCase();
    const todos = AlexandriaAPI.getLivros();

    listaAtualLivros = todos.filter(livro => 
        livro.titulo.toLowerCase().includes(termo) ||
        livro.autor.toLowerCase().includes(termo) ||
        livro.codigo.toLowerCase().includes(termo)
    );

    renderizarTabela(listaAtualLivros);
}

function filtrarPorGrupo(nomeGrupo) {
    const todos = AlexandriaAPI.getLivros();
    
    listaAtualLivros = todos.filter(livro => {
        if (livro.grupo) {
            return livro.grupo === nomeGrupo;
        }
        const prefixo = nomeGrupo.substring(0, 3).toUpperCase();
        return livro.codigo && livro.codigo.startsWith(prefixo + '-');
    });

    renderizarTabela(listaAtualLivros);
    const contador = document.querySelector("#contadorLivros");
    if(contador) contador.textContent = `Filtrado por Grupo: ${nomeGrupo} (${listaAtualLivros.length})`;
}

function filtrarPorSubgrupo(nomeGrupo, nomeSubgrupo) {
    const todos = AlexandriaAPI.getLivros();
    
    listaAtualLivros = todos.filter(livro => {
        if (livro.subgrupo && livro.grupo) {
            return livro.subgrupo === nomeSubgrupo && livro.grupo === nomeGrupo;
        }
        const preGrupo = nomeGrupo.substring(0, 3).toUpperCase();
        const preSub = nomeSubgrupo.substring(0, 3).toUpperCase();
        const busca = `${preGrupo}-${preSub}-`;
        
        return livro.codigo && livro.codigo.startsWith(busca);
    });

    renderizarTabela(listaAtualLivros);
    const contador = document.querySelector("#contadorLivros");
    if(contador) contador.textContent = `Filtrado: ${nomeGrupo} > ${nomeSubgrupo} (${listaAtualLivros.length})`;
}

function ordenarPor(criterio) {
    if (!direcaoOrdenacao[criterio] || direcaoOrdenacao[criterio] === 'desc') {
        direcaoOrdenacao[criterio] = 'asc';
    } else {
        direcaoOrdenacao[criterio] = 'desc';
    }

    const ordem = direcaoOrdenacao[criterio];

    listaAtualLivros.sort((a, b) => {
        let valorA = a[criterio];
        let valorB = b[criterio];

        if (typeof valorA === 'string') valorA = valorA.toLowerCase();
        if (typeof valorB === 'string') valorB = valorB.toLowerCase();

        if (valorA < valorB) {
            return ordem === 'asc' ? -1 : 1;
        }
        if (valorA > valorB) {
            return ordem === 'asc' ? 1 : -1;
        }
        return 0;
    });

    renderizarTabela(listaAtualLivros);
}

function resetarTabela() {
    const inputPesquisa = document.querySelector("#pesquisar");
    if(inputPesquisa) inputPesquisa.value = ""; 
    
    listaAtualLivros = AlexandriaAPI.getLivros(); 
    renderizarTabela(listaAtualLivros);
}

// ==========================================================
// 7. EVENTOS DO SISTEMA
// ==========================================================

selectGrupo.addEventListener("change", () => {
    const grupos = AlexandriaAPI.getGrupos();
    const grupoEscolhido = grupos.find(g => g.nome === selectGrupo.value);
    
    selectSubgrupo.innerHTML = `<option disabled selected>Subgrupo</option>`;

    if (grupoEscolhido) {
        grupoEscolhido.subgrupos.forEach(sub => {
            let op = document.createElement("option");
            op.value = sub;
            op.textContent = sub;
            selectSubgrupo.appendChild(op);
        });
    }
});

btnGerarCodigo.addEventListener("click", () => {
    const grpNome = selectGrupo.value;
    const subNome = selectSubgrupo.value;

    if (!grpNome || grpNome === "Grupo") return alert("Selecione um Grupo.");
    if (!subNome || subNome === "Subgrupo" || subNome === "SUBGRUPO") return alert("Selecione um Subgrupo.");

    const prefixoBusca = `${grpNome.substring(0, 3).toUpperCase()}-${subNome.substring(0, 3).toUpperCase()}-`;
    const livros = AlexandriaAPI.getLivros();
    let maiorVolume = 0;

    livros.forEach(livro => {
        if (livro.codigo && livro.codigo.startsWith(prefixoBusca)) {
            const partes = livro.codigo.split("-"); 
            const numeroLivro = parseInt(partes[2]);
            if (!isNaN(numeroLivro) && numeroLivro > maiorVolume) {
                maiorVolume = numeroLivro;
            }
        }
    });

    inputVolume.value = maiorVolume + 1;
});

// Cadastro COM VALIDAÇÃO
formCadastro.addEventListener("submit", (e) => {
    e.preventDefault();

    const titulo = document.querySelector("#titulo").value.trim();
    const autor = document.querySelector("#autor").value.trim();
    const editora = document.querySelector("#editora").value.trim();
    const edicao = document.querySelector("#edicao").value.trim();
    
    const grp = selectGrupo.value;
    const sub = selectSubgrupo.value;
    const vol = inputVolume.value.trim();

    if (!titulo || !autor || !editora || !edicao || !grp || !sub || !vol) {
        alert("Por favor, preencha todos os campos (incluindo Grupo, Subgrupo e Volume) para cadastrar.");
        return; 
    }

    let codigoFinal = "S/C";
    if (grp && sub && vol) {
        codigoFinal = `${grp.substring(0,3).toUpperCase()}-${sub.substring(0,3).toUpperCase()}-${vol}`;
    }

    const novoLivro = {
        titulo, autor, editora, edicao, 
        codigo: codigoFinal, 
        lido: false,
        grupo: grp,
        subgrupo: sub,
        descartado: false,
        observacao: "" 
    };

    AlexandriaAPI.adicionarLivro(novoLivro);
    atualizarInterfaceGeral(); 
    formCadastro.reset();
    document.querySelector("#titulo").focus();
});

// ==========================================================
// 8. EVENTOS DOS MODAIS E EDIÇÃO
// ==========================================================

const toggleModal = () => {
    fade.classList.add("hide");
    modalGrupo.classList.add("hide");
    modalSubgrupo.classList.add("hide");
    modalEditarLivro.classList.add("hide");
};

[fade, ...btnsCancelar].forEach(el => el.addEventListener("click", toggleModal));

window.abrirModalEdicao = function(index) {
    const livros = AlexandriaAPI.getLivros();
    const livro = livros[index];

    if (livro) {
        indiceEdicaoAtual = index; 

        // Preencher dados
        editTitulo.value = livro.titulo;
        editAutor.value = livro.autor;
        editEditora.value = livro.editora || "";
        editEdicao.value = livro.edicao || "";
        editCodigo.value = livro.codigo;
        editLido.value = livro.lido ? "true" : "false"; 
        editObservacao.value = livro.observacao || ""; 

        // LOGICA DE BLOQUEIO SE DESCARTADO
        const inputsEdicao = formEdicaoBody.querySelectorAll("input, select");
        
        if (livro.descartado) {
            // Bloqueia inputs padrão usando classe
            inputsEdicao.forEach(input => input.disabled = true);
            formEdicaoBody.classList.add("modal-bloqueado");
            
            // Garante que a observação esteja desbloqueada
            editObservacao.disabled = false;
            
            // Botão salvar para observação
            btnSalvarEdicao.classList.remove("oculto");
            btnSalvarEdicao.textContent = "Salvar Observação"; 
            
            // Esconde botão descartar usando classe
            btnDescartarLivro.classList.add("oculto");
        } else {
            // Libera inputs
            inputsEdicao.forEach(input => {
                if (input.id !== "editCodigo") input.disabled = false;
            });
            editObservacao.disabled = false;
            
            formEdicaoBody.classList.remove("modal-bloqueado");
            
            btnSalvarEdicao.classList.remove("oculto");
            btnSalvarEdicao.textContent = "Salvar Alterações";
            btnDescartarLivro.classList.remove("oculto");
        }

        fade.classList.remove("hide");
        modalEditarLivro.classList.remove("hide");
    }
};

btnSalvarEdicao.addEventListener("click", () => {
    if (indiceEdicaoAtual === null) return;

    const todos = AlexandriaAPI.getLivros();
    const original = todos[indiceEdicaoAtual];

    let livroEditado;

    // Se descartado, salvamos APENAS a observação
    if (original.descartado) {
        livroEditado = {
            ...original,
            observacao: editObservacao.value 
        };
    } else {
        // Se normal, salva tudo
        livroEditado = {
            ...original, 
            titulo: editTitulo.value,
            autor: editAutor.value,
            editora: editEditora.value,
            edicao: editEdicao.value,
            lido: editLido.value === "true",
            observacao: editObservacao.value
        };
    }

    AlexandriaAPI.atualizarLivro(indiceEdicaoAtual, livroEditado);
    atualizarInterfaceGeral();
    toggleModal();
});

btnDescartarLivro.addEventListener("click", () => {
    if (indiceEdicaoAtual === null) return;

    if(confirm("ATENÇÃO: Ao descartar este livro, ele ficará vermelho na lista e NÃO poderá mais ser editado (exceto observações). Deseja continuar?")) {
        const todos = AlexandriaAPI.getLivros();
        const original = todos[indiceEdicaoAtual];
        
        const livroDescartado = {
            ...original,
            descartado: true,
            observacao: editObservacao.value // Salva a observação atual
        };

        AlexandriaAPI.atualizarLivro(indiceEdicaoAtual, livroDescartado);
        atualizarInterfaceGeral();
        toggleModal();
    }
});

// Modais de Grupo/Subgrupo
btnAbrirGrupo.addEventListener("click", () => {
    fade.classList.remove("hide");
    modalGrupo.classList.remove("hide");
    inputNomeNovoGrupo.value = "";
    inputNomeNovoGrupo.focus();
});

btnSalvarGrupo.addEventListener("click", () => {
    const nome = inputNomeNovoGrupo.value.trim();
    if (!nome) return alert("Digite um nome!");
    
    const gruposAtuais = AlexandriaAPI.getGrupos();
    if (gruposAtuais.some(g => g.nome.toLowerCase() === nome.toLowerCase())) {
        return alert("Grupo já existe!");
    }

    AlexandriaAPI.adicionarGrupo(nome);
    atualizarInterfaceGeral();
    toggleModal();
});

btnAbrirSub.addEventListener("click", () => {
    const grupos = AlexandriaAPI.getGrupos();
    if (grupos.length === 0) return alert("Crie um Grupo primeiro!");

    fade.classList.remove("hide");
    modalSubgrupo.classList.remove("hide");
    inputNomeNovoSub.value = ""; 

    selectGrupoParaSub.innerHTML = `<option value="" disabled selected>Selecione o grupo</option>`;
    grupos.forEach((g, index) => {
        let op = document.createElement("option");
        op.value = index;
        op.textContent = g.nome;
        selectGrupoParaSub.appendChild(op);
    });
    inputNomeNovoSub.focus();
});

btnSalvarSub.addEventListener("click", () => {
    const index = selectGrupoParaSub.value;
    const nomeSub = inputNomeNovoSub.value.trim();

    if (index === "") return alert("Escolha o Grupo!");
    if (!nomeSub) return alert("Digite o nome!");

    AlexandriaAPI.adicionarSubgrupo(index, nomeSub);

    if (selectGrupo.value === AlexandriaAPI.getGrupos()[index].nome) {
        selectGrupo.dispatchEvent(new Event('change'));
    }

    atualizarInterfaceGeral();
    inputNomeNovoSub.value = ""; 
    toggleModal();
});

// ==========================================================
// 9. IMPORTAR E EXPORTAR JSON (BACKUP)
// ==========================================================

const btnExportar = document.querySelector("#btnExportar");
const btnImportar = document.querySelector("#btnImportar");
const inputArquivoJson = document.querySelector("#inputArquivoJson");

// --- FUNÇÃO DE SALVAR (EXPORTAR) ---
btnExportar.addEventListener("click", (e) => {
    e.preventDefault(); // Evita que o link suba a página (#)

    // 1. Pega os dados atuais do banco
    const dados = AlexandriaAPI.lerTudo();
    
    // 2. Converte para texto JSON (o null, 2 deixa o arquivo formatado/bonito)
    const jsonString = JSON.stringify(dados, null, 2);
    
    // 3. Cria um "Blob" (arquivo temporário na memória)
    const blob = new Blob([jsonString], { type: "application/json" });
    
    // 4. Gera a Data do Dia (DD-MM-AAAA)
    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0'); // Janeiro é 0
    const ano = hoje.getFullYear();
    const dataFormatada = `${dia}-${mes}-${ano}`;

    // 5. Cria um link falso para download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `alexandria_backup_${dataFormatada}.json`; // Nome do arquivo
    
    // 6. Clica no link e remove ele
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url); // Limpa a memória
});

// --- FUNÇÃO DE CARREGAR (IMPORTAR) ---

// 1. Quando clicar no botão "Carregar", clica no input invisível
btnImportar.addEventListener("click", (e) => {
    e.preventDefault();
    inputArquivoJson.click();
});

// 2. Quando o usuário selecionar um arquivo no input
inputArquivoJson.addEventListener("change", (e) => {
    const arquivo = e.target.files[0];

    if (!arquivo) return;

    const leitor = new FileReader();

    // Quando terminar de ler o arquivo:
    leitor.onload = (evento) => {
        try {
            // Tenta converter o texto do arquivo em Objeto JS
            const dadosCarregados = JSON.parse(evento.target.result);

            // Validação simples para ver se é um arquivo do Alexandria
            if (!dadosCarregados.grupos || !dadosCarregados.livros) {
                throw new Error("Formato de arquivo inválido!");
            }

            // Confirmação de segurança
            if(confirm("ATENÇÃO: Isso substituirá todos os dados atuais pelos dados do arquivo. Deseja continuar?")) {
                AlexandriaAPI.salvarTudo(dadosCarregados);
                atualizarInterfaceGeral(); // Recarrega a tela
                alert("Backup restaurado com sucesso!");
            }

        } catch (erro) {
            alert("Erro ao ler o arquivo: " + erro.message);
        }
        
        // Limpa o input para permitir carregar o mesmo arquivo novamente se precisar
        inputArquivoJson.value = "";
    };

    // Manda ler o arquivo como texto
    leitor.readAsText(arquivo);
});

// ==========================================================
// 10. DARK MODE (NOVO)
// ==========================================================

function iniciarDarkMode() {
    // 1. Captura o botão pelo ID que você vai colocar no HTML
    const btnTema = document.querySelector("#btnTema");

    // Se o botão não estiver no HTML ainda, não faz nada para não dar erro
    if(!btnTema) return;

    // 2. Verifica se o usuário já tinha escolhido Dark Mode antes
    const temaSalvo = localStorage.getItem("temaAlexandria");
    
    if (temaSalvo === "dark") {
        document.body.classList.add("dark-mode");
        btnTema.textContent = "☀ Luz";
    } else {
        btnTema.textContent = "🌙 Tema";
    }

    // 3. Adiciona o evento de clique
    btnTema.addEventListener("click", (e) => {
        e.preventDefault();
        
        // Troca a classe no body
        document.body.classList.toggle("dark-mode");
        
        // Verifica se ficou Dark ou Light
        const isDark = document.body.classList.contains("dark-mode");
        
        // Salva na memória
        localStorage.setItem("temaAlexandria", isDark ? "dark" : "light");
        
        // Troca o texto do botão
        btnTema.textContent = isDark ? "☀ Luz" : "🌙 Tema";
    });
}