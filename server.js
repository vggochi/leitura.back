require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { createClient } = require('@supabase/supabase-js');

const app = express();

app.use(cors());
app.use(express.json());

/* =========================================
   SUPABASE
========================================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* =========================================
   TESTE API
========================================= */

app.get('/', (req, res) => {
  res.json({
    mensagem: 'API Leitura funcionando 🚀'
  });
});

/* =========================================
   LISTAR TURMAS
========================================= */

app.get('/api/turmas', async (req, res) => {

  try {

    const { data, error } = await supabase
      .from('turmas')
      .select('*');

    if (error) throw error;

    res.json(data);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao buscar turmas.'
    });

  }

});

/* =========================================
   LOGIN
========================================= */

app.post('/api/login', async (req, res) => {

  const { rm, senha } = req.body;

  try {

    const { data, error } = await supabase

      .from('alunos')

      .select('*')

      .eq('rm', rm)

      .eq('senha', senha)

      .single();

    if (error || !data) {

      return res.status(401).json({
        erro: 'RM ou senha inválidos.'
      });

    }

    res.json({

      mensagem: 'Login realizado.',

      aluno: data

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao realizar login.'
    });

  }

});

/* =========================================
   CADASTRAR ALUNO
========================================= */

app.post('/api/alunos', async (req, res) => {

  const {
    nome,
    rm,
    email,
    turma_id,
    senha
  } = req.body;

  try {

    const { data, error } = await supabase

      .from('alunos')

      .insert([{
        nome,
        rm,
        email,
        turma_id,
        senha
      }])

      .select();

    if (error) {

      console.log(error);

      return res.status(500).json({
        erro: error.message
      });

    }

    res.json({

      mensagem: 'Aluno cadastrado.',

      aluno: data

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao cadastrar aluno.'
    });

  }

});

/* =========================================
   LISTAR ALUNOS
========================================= */

app.get('/api/alunos', async (req, res) => {

  try {

    const { data, error } = await supabase
      .from('alunos')
      .select('*');

    if (error) throw error;

    res.json(data);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao buscar alunos.'
    });

  }

});

/* =========================================
   EDITAR ALUNO
========================================= */

app.put('/api/alunos/:id', async (req, res) => {

  const { id } = req.params;

  const {
    nome,
    rm,
    email,
    turma_id,
    senha
  } = req.body;

  try {

    const { data, error } = await supabase

      .from('alunos')

      .update({
        nome,
        rm,
        email,
        turma_id,
        senha
      })

      .eq('id', id)

      .select();

    if (error) throw error;

    res.json({

      mensagem: 'Aluno atualizado.',

      aluno: data

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao atualizar aluno.'
    });

  }

});

/* =========================================
   DELETAR ALUNO
========================================= */

app.delete('/api/alunos/:id', async (req, res) => {

  const { id } = req.params;

  try {

    const { error } = await supabase

      .from('alunos')

      .delete()

      .eq('id', id);

    if (error) throw error;

    res.json({
      mensagem: 'Aluno deletado.'
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao deletar aluno.'
    });

  }

});

/* =========================================
   REGISTRAR LEITURA
========================================= */

app.post('/api/registrar', async (req, res) => {

  const {
    aluno_id,
    minutos
  } = req.body;

  if (!aluno_id || !minutos || minutos <= 0) {

    return res.status(400).json({
      erro: 'Dados inválidos.'
    });

  }

  try {

    const inicioDoDia = new Date();

    inicioDoDia.setHours(0, 0, 0, 0);

    const fimDoDia = new Date();

    fimDoDia.setHours(23, 59, 59, 999);

    const {
      data: leiturasHoje,
      error: erroBusca
    } = await supabase

      .from('leituras')

      .select('minutos')

      .eq('aluno_id', aluno_id)

      .gte(
        'created_at',
        inicioDoDia.toISOString()
      )

      .lte(
        'created_at',
        fimDoDia.toISOString()
      );

    if (erroBusca) throw erroBusca;

    const totalHoje = leiturasHoje.reduce(

      (acc, leitura) =>
        acc + leitura.minutos,

      0

    );

    if (totalHoje + minutos > 16) {

      const restante = 16 - totalHoje;

      if (restante <= 0) {

        return res.status(400).json({
          erro: 'Você já atingiu o limite diário.'
        });

      }

      return res.status(400).json({
        erro: `Você só pode registrar mais ${restante} minutos.`
      });

    }

    const { error: erroInsert } = await supabase

      .from('leituras')

      .insert([{
        aluno_id,
        minutos
      }]);

    if (erroInsert) throw erroInsert;

    res.json({
      mensagem: 'Leitura registrada.'
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao registrar leitura.'
    });

  }

});

/* =========================================
   LISTAR LEITURAS
========================================= */

app.get('/api/leituras', async (req, res) => {

  try {

    const { data, error } = await supabase

      .from('leituras')

      .select('*')

      .order('created_at', {
        ascending: true
      });

    if (error) throw error;

    res.json(data);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao buscar leituras.'
    });

  }

});

/* =========================================
   ESTATÍSTICAS
========================================= */

app.get('/api/estatisticas', async (req, res) => {

  try {

    const { data, error } = await supabase

      .from('leituras')

      .select('minutos');

    if (error) throw error;

    const total_escola = data.reduce(

      (acc, leitura) =>
        acc + leitura.minutos,

      0

    );

    res.json({
      total_escola
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao buscar estatísticas.'
    });

  }

});

/* =========================================
   RANKING DAS TURMAS
========================================= */

app.get('/api/ranking', async (req, res) => {

  try {

    const { data: leituras, error } = await supabase

      .from('leituras')

      .select(`
        minutos,
        aluno_id,
        alunos (
          turma_id
        )
      `);

    if (error) throw error;

    const ranking = {};

    leituras.forEach(leitura => {

      const turma =
        leitura.alunos?.turma_id;

      if (!turma) return;

      if (!ranking[turma]) {
        ranking[turma] = 0;
      }

      ranking[turma] += leitura.minutos;

    });

    const rankingFinal = Object.entries(ranking)

      .map(([turma_id, minutos]) => ({
        turma_id,
        minutos
      }))

      .sort((a, b) =>
        b.minutos - a.minutos
      );

    res.json(rankingFinal);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      erro: 'Erro ao gerar ranking.'
    });

  }

});

/* =========================================
   SERVIDOR
========================================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `🚀 Servidor rodando na porta ${PORT}`
  );

});
