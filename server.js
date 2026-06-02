<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <title>Gerenciar Turmas</title>

    <script src="https://cdn.tailwindcss.com"></script>

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap"
      rel="stylesheet"
    />

    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: "Poppins", sans-serif;
      }

      body {
        background: #020617;
        color: white;
        min-height: 100vh;
      }

      .blur-circle {
        position: fixed;
        width: 350px;
        height: 350px;
        border-radius: 50%;
        filter: blur(140px);
        z-index: -1;
      }

      .blue {
        background: #2563eb;
        top: -100px;
        left: -100px;
      }

      .purple {
        background: #9333ea;
        bottom: -100px;
        right: -100px;
      }

      .navbar {
        padding: 25px 50px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .btn {
        background: #2563eb;
        border: none;
        padding: 14px 24px;
        color: white;
        border-radius: 16px;
        cursor: pointer;
      }

      .container {
        max-width: 1200px;
        margin: auto;
        padding: 40px;
      }

      .card {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 30px;
        padding: 30px;
        backdrop-filter: blur(20px);
      }

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr auto;
        gap: 15px;
      }

      input {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.08);
        color: white;
        padding: 16px;
        border-radius: 16px;
      }

      table {
        width: 100%;
        margin-top: 30px;
        border-collapse: collapse;
      }

      th {
        background: #1e293b;
        padding: 16px;
      }

      td {
        padding: 16px;
        text-align: center;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      .action-btn {
        border: none;
        padding: 10px 16px;
        border-radius: 12px;
        color: white;
        cursor: pointer;
      }

      .edit {
        background: #f59e0b;
      }

      .delete {
        background: #dc2626;
      }
    </style>
  </head>

  <body>
    <div class="blur-circle blue"></div>
    <div class="blur-circle purple"></div>

    <nav class="navbar">
      <h1>🏫 Gerenciar Turmas</h1>

      <button class="btn" onclick="window.location.href='professor.html'">
        Voltar
      </button>
    </nav>

    <div class="container">
      <div class="card">
        <h2 class="text-2xl mb-2">📚 Cadastro de Turmas</h2>
        <p class="text-gray-400 mb-6">Crie e gerencie as turmas da escola.</p>

        <div class="form-grid">
          <input id="nome" placeholder="Nome da turma" />
<input id="serie" placeholder="Série" />
<input id="periodo" placeholder="Período" />
<input id="sala" placeholder="Sala" />
<input id="professor_id" placeholder="ID do professor" />

          <button class="btn" onclick="criarTurma()">Salvar</button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Turma</th>
              <th>Série</th>
              <th>Professor</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody id="listaTurmas"></tbody>
        </table>
      </div>
    </div>

    <script>
      // 🔥 IMPORTANTE: SEM /api AQUI
      const API_URL = "https://leitura-back3.vercel.app";

      async function carregarTurmas() {
        try {
          const res = await fetch(`${API_URL}/api/turmas`);

          if (!res.ok) throw new Error("Erro ao carregar turmas");

          const turmas = await res.json();

          const tabela = document.getElementById("listaTurmas");
          tabela.innerHTML = "";

          (turmas || []).forEach((turma) => {
            tabela.innerHTML += `
              <tr>
                <td>${turma.id}</td>
                <td>${turma.nome}</td>
                <td>${turma.serie}</td>
                <td>${turma.professor}</td>
                <td>
                  <button class="action-btn edit" onclick="editarTurma(${turma.id})">
                    Editar
                  </button>

                  <button class="action-btn delete" onclick="excluirTurma(${turma.id})">
                    Excluir
                  </button>
                </td>
              </tr>
            `;
          });
        } catch (error) {
          console.log(error);
          alert("Erro ao carregar turmas");
        }
      }

      async function criarTurma() {
        const nome = document.getElementById("nome").value;
        const serie = document.getElementById("serie").value;
        const periodo = document.getElementById("periodo").value;
        const sala = document.getElementById("sala").value;
        const professor_id = document.getElementById("professor_id").value;

        if (!nome || !serie || !periodo || !sala || !professor_id) {
          alert("Preencha todos os campos");
          return;
        }

        try {
          const res = await fetch(`${API_URL}/api/turmas`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ nome, serie, professor }),
          });

          const data = await res.json();

          if (!res.ok) {
            alert(data.erro || "Erro ao criar turma");
            return;
          }

          alert(data.mensagem || "Turma criada!");

          document.getElementById("nome").value = "";
          document.getElementById("serie").value = "";
          document.getElementById("professor").value = "";

          carregarTurmas();
        } catch (error) {
          console.log(error);
          alert("Erro na requisição");
        }
      }

      async function excluirTurma(id) {
        if (!confirm("Deseja excluir esta turma?")) return;

        try {
          await fetch(`${API_URL}/api/turmas/${id}`, {
            method: "DELETE",
          });

          carregarTurmas();
        } catch (error) {
          console.log(error);
        }
      }

      async function editarTurma(id) {
        const nome = prompt("Novo nome:");
        const serie = prompt("Nova série:");
        const professor = prompt("Novo professor:");

        if (!nome || !serie || !professor) return;

        try {
          await fetch(`${API_URL}/api/turmas/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ nome, serie, professor }),
          });

          carregarTurmas();
        } catch (error) {
          console.log(error);
        }
      }

      carregarTurmas();
    </script>
  </body>
</html>
