require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

app.use(cors());
app.use(express.json());

/* ==========================
   SUPABASE
========================== */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

/* ==========================
   TESTE API
========================== */

app.get("/", (req, res) => {
  res.json({
    mensagem: "API Leitura funcionando 🚀",
  });
});

/* ==========================
   LISTAR TURMAS
========================== */

app.get("/api/turmas", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("turmas")
      .select("*")
      .order("id");

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao buscar turmas.",
    });
  }
});

/* ==========================
   CRIAR TURMA
========================== */

app.post("/api/turmas", async (req, res) => {
  try {
    const { nome, serie, professor } = req.body;

    if (!nome || !serie || !professor) {
      return res.status(400).json({
        erro: "Campos obrigatórios não preenchidos.",
      });
    }

    const { data, error } = await supabase
      .from("turmas")
      .insert([
        {
          nome,
          serie,
          professor,
        },
      ])
      .select();

    if (error) throw error;

    res.status(201).json({
      mensagem: "Turma criada com sucesso.",
      turma: data?.[0] || null,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao criar turma.",
    });
  }
});

/* ==========================
   EDITAR TURMA
========================== */

app.put("/api/turmas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, serie, professor } = req.body;

    const { data, error } = await supabase
      .from("turmas")
      .update({
        nome,
        serie,
        professor,
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    res.json({
      mensagem: "Turma atualizada com sucesso.",
      turma: data?.[0] || null,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao atualizar turma.",
    });
  }
});

/* ==========================
   DELETAR TURMA
========================== */

app.delete("/api/turmas/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from("turmas").delete().eq("id", id);

    if (error) throw error;

    res.json({
      mensagem: "Turma deletada com sucesso.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao deletar turma.",
    });
  }
});

/* ==========================
   LOGIN ALUNO
========================== */

app.post("/api/login", async (req, res) => {
  try {
    const { rm, senha } = req.body;

    const { data, error } = await supabase
      .from("alunos")
      .select("*")
      .eq("rm", rm)
      .eq("senha", senha)
      .single();

    if (error || !data) {
      return res.status(401).json({
        erro: "RM ou senha inválidos.",
      });
    }

    res.json({
      mensagem: "Login realizado.",
      aluno: data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao realizar login.",
    });
  }
});

/* ==========================
   CADASTRAR ALUNO
========================== */

app.post("/api/alunos", async (req, res) => {
  try {
    const { nome, rm, email, senha, turma_id } = req.body;

    const { data, error } = await supabase
      .from("alunos")
      .insert([{ nome, rm, email, senha, turma_id }])
      .select();

    if (error) throw error;

    res.json({
      mensagem: "Aluno cadastrado.",
      aluno: data?.[0] || null,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao cadastrar aluno.",
    });
  }
});

/* ==========================
   LISTAR ALUNOS
========================== */

app.get("/api/alunos", async (req, res) => {
  try {
    const { data, error } = await supabase.from("alunos").select("*");

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao buscar alunos.",
    });
  }
});

/* ==========================
   CADASTRAR PROFESSOR
========================== */

app.post("/api/professores", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    const { data, error } = await supabase
      .from("professores")
      .insert([{ nome, email, senha }])
      .select();

    if (error) throw error;

    res.json({
      mensagem: "Professor cadastrado.",
      professor: data?.[0] || null,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao cadastrar professor.",
    });
  }
});

/* ==========================
   LOGIN PROFESSOR
========================== */

app.post("/api/professores/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    const { data, error } = await supabase
      .from("professores")
      .select("*")
      .eq("email", email)
      .eq("senha", senha)
      .single();

    if (error || !data) {
      return res.status(401).json({
        erro: "Email ou senha inválidos.",
      });
    }

    res.json({
      mensagem: "Login realizado.",
      professor: data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao realizar login.",
    });
  }
});

/* ==========================
   REGISTRAR LEITURA
========================== */

app.post("/api/registrar", async (req, res) => {
  const { aluno_id, minutos } = req.body;

  if (!aluno_id || !minutos) {
    return res.status(400).json({
      erro: "Dados inválidos.",
    });
  }

  try {
    const inicioDoDia = new Date();
    inicioDoDia.setHours(0, 0, 0, 0);

    const fimDoDia = new Date();
    fimDoDia.setHours(23, 59, 59, 999);

    const { data: leiturasHoje, error: erroBusca } = await supabase
      .from("leituras")
      .select("minutos")
      .eq("aluno_id", aluno_id)
      .gte("created_at", inicioDoDia.toISOString())
      .lte("created_at", fimDoDia.toISOString());

    if (erroBusca) throw erroBusca;

    const totalHoje = (leiturasHoje || []).reduce(
      (acc, item) => acc + item.minutos,
      0,
    );

    if (totalHoje + minutos > 16) {
      return res.status(400).json({
        erro: `Limite diário excedido. Restam ${16 - totalHoje} minutos.`,
      });
    }

    const { error } = await supabase
      .from("leituras")
      .insert([{ aluno_id, minutos }]);

    if (error) throw error;

    res.json({
      mensagem: "Leitura registrada.",
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao registrar leitura.",
    });
  }
});

/* ==========================
   LISTAR LEITURAS
========================== */

app.get("/api/leituras", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("leituras")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao buscar leituras.",
    });
  }
});

/* ==========================
   ESTATÍSTICAS
========================== */

app.get("/api/estatisticas", async (req, res) => {
  try {
    const { data, error } = await supabase.from("leituras").select("minutos");

    if (error) throw error;

    const total_escola = (data || []).reduce(
      (acc, item) => acc + item.minutos,
      0,
    );

    res.json({ total_escola });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao buscar estatísticas.",
    });
  }
});

/* ==========================
   RANKING DAS TURMAS
========================== */

app.get("/api/ranking", async (req, res) => {
  try {
    const { data, error } = await supabase.from("leituras").select(`
        minutos,
        alunos (
          turma_id
        )
      `);

    if (error) throw error;

    const ranking = {};

    (data || []).forEach((item) => {
      const turma = item.alunos?.turma_id;
      if (!turma) return;

      ranking[turma] = (ranking[turma] || 0) + item.minutos;
    });

    const rankingFinal = Object.entries(ranking)
      .map(([turma_id, minutos]) => ({
        turma_id,
        minutos,
      }))
      .sort((a, b) => b.minutos - a.minutos);

    res.json(rankingFinal);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      erro: "Erro ao gerar ranking.",
    });
  }
});

/* ==========================
   SERVIDOR
========================== */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
