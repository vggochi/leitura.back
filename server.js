require('dotenv').config();

const express = require('express');
const cors = require('cors');

const {
  createClient
} = require('@supabase/supabase-js');

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
   LISTAR TURMAS
========================================= */

app.get('/api/turmas', async (req, res) => {

  try {

    const {
      data,
      error
    } = await supabase

      .from('turmas')

      .select('*');

    if (error) {

      console.log(error);

      return res.status(500).json({

        erro:
          error.message

      });

    }

    res.json(data);

  } catch (error) {

    console.log(error);

    res.status(500).json({

      erro:
        'Erro ao buscar turmas.'

    });

  }

});

/* =========================================
   LOGIN
========================================= */

app.post('/api/alunos', async (req, res) => {

  console.log(req.body);

  const {
    nome,
    rm,
    turma_id,
    senha
  } = req.body;

  try {

    const {
      data,
      error
    } = await supabase

      .from('alunos')

      .insert([{

        nome,
        rm,
        turma_id,
        senha

      }])

      .select();

    if (error) {

      console.log(error);

      return res.status(500).json({

        erro: error.message,

        detalhes: error

      });

    }

    res.json({

      mensagem:
        'Aluno cadastrado.',

      aluno: data

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      erro:
        'Erro interno.'

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

  if (
    !aluno_id ||
    !minutos ||
    minutos <= 0
  ) {

    return res.status(400).json({

      erro:
        'Dados inválidos.'

    });

  }

  try {

    const inicioDoDia =
      new Date();

    inicioDoDia.setHours(
      0,
      0,
      0,
      0
    );

    const fimDoDia =
      new Date();

    fimDoDia.setHours(
      23,
      59,
      59,
      999
    );

    const {
      data: leiturasHoje,
      error: erroBusca
    } = await supabase

      .from('leituras')

      .select('minutos')

      .eq(
        'aluno_id',
        aluno_id
      )

      .gte(
        'created_at',
        inicioDoDia.toISOString()
      )

      .lte(
        'created_at',
        fimDoDia.toISOString()
      );

    if (erroBusca)
      throw erroBusca;

    const totalHoje =
      leiturasHoje.reduce(

        (acc, leitura) =>

          acc + leitura.minutos,

        0

      );

    if (
      totalHoje + minutos > 16
    ) {

      const restante =
        16 - totalHoje;

      if (restante <= 0) {

        return res
          .status(400)
          .json({

            erro:
              'Você já atingiu o limite diário.'

          });

      }

      return res
        .status(400)
        .json({

          erro:
            `Você só pode registrar mais ${restante} minutos.`

        });

    }

    const {
      error: erroInsert
    } = await supabase

      .from('leituras')

      .insert([{

        aluno_id,
        minutos

      }]);

    if (erroInsert)
      throw erroInsert;

    res.json({

      mensagem:
        'Leitura registrada com sucesso.'

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      erro:
        'Erro interno.'

    });

  }

});

/* =========================================
   ESTATÍSTICAS
========================================= */

app.get(
  '/api/estatisticas',

  async (req, res) => {

    try {

      const {
        data,
        error
      } = await supabase

        .from('leituras')

        .select('minutos');

      if (error)
        throw error;

      const total_escola =
        data.reduce(

          (acc, leitura) =>

            acc + leitura.minutos,

          0

        );

      res.json({

        total_escola

      });

    } catch (error) {

      res.status(500).json({

        erro:
          'Erro ao buscar estatísticas.'

      });

    }

  }

);

/* =========================================
   LISTAR ALUNOS
========================================= */

app.get(
  '/api/alunos',

  async (req, res) => {

    try {

      const {
        data,
        error
      } = await supabase

        .from('alunos')

        .select('*');

      if (error)
        throw error;

      res.json(data);

    } catch (error) {

      res.status(500).json({

        erro:
          'Erro ao buscar alunos.'

      });

    }

  }

);

/* =========================================
   LISTAR LEITURAS
========================================= */

app.get(
  '/api/leituras',

  async (req, res) => {

    try {

      const {
        data,
        error
      } = await supabase

        .from('leituras')

        .select('*');

      if (error)
        throw error;

      res.json(data);

    } catch (error) {

      res.status(500).json({

        erro:
          'Erro ao buscar leituras.'

      });

    }

  }

);

/* =========================================
   RANKING DAS TURMAS
========================================= */

app.get('/api/ranking', async (req, res) => {

  try {

    // Busca todas as leituras
    const {
      data: leituras,
      error: erroLeituras
    } = await supabase

      .from('leituras')

      .select('*');

    if (erroLeituras) {

      console.log(erroLeituras);

      return res.status(500).json({

        erro:
          erroLeituras.message

      });

    }

    const ranking = {};

    // Percorre leituras
    for (const leitura of leituras) {

      // Busca turma do aluno
      const {
        data: aluno,
        error: erroAluno
      } = await supabase

        .from('alunos')

        .select('turma_id')

        .eq('id', leitura.aluno_id)

        .single();

      if (erroAluno || !aluno)
        continue;

      const turma =
        aluno.turma_id;

      // Soma minutos
      if (!ranking[turma]) {

        ranking[turma] = 0;

      }

      ranking[turma] +=
        leitura.minutos;

    }

    // Ordena ranking
    const rankingFinal =
      Object.entries(ranking)

      .sort(
        (a, b) => b[1] - a[1]
      )

      .map(item => ({

        turma_id: item[0],

        minutos: item[1]

      }));

    res.json(rankingFinal);

  } catch (error) {

    console.log(error);

    res.status(500).json({

      erro:
        'Erro ao gerar ranking.'

    });

  }

});

/* =========================================
   CADASTRAR ALUNO
========================================= */

app.post(
  '/api/alunos',

  async (req, res) => {

    const {
      nome,
      rm,
      turma,
      senha
    } = req.body;

    try {

      const {
        data,
        error
      } = await supabase

        .from('alunos')

        .insert([{

          nome,
          rm,
          turma,
          senha

        }])

        .select();

      if (error)
        throw error;

      res.json(data);

    } catch (error) {

      res.status(500).json({

        erro:
          'Erro ao cadastrar aluno.'

      });

    }

  }

);

/* =========================================
   EDITAR ALUNO
========================================= */

app.put('/api/alunos/:id', async (req, res) => {

  const { id } = req.params;

  const {
    nome,
    rm,
    turma_id,
    senha
  } = req.body;

  try {

    const {
      data,
      error
    } = await supabase

      .from('alunos')

      .update({

        nome,
        rm,
        turma_id,
        senha

      })

      .eq('id', id)

      .select();

    if (error)
      throw error;

    res.json({

      mensagem:
        'Aluno atualizado.',

      aluno: data

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      erro:
        'Erro ao atualizar aluno.'

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
    turma_id,
    senha
  } = req.body;

  try {

    const {
      data,
      error
    } = await supabase

      .from('alunos')

      .update({

        nome,
        rm,
        turma_id,
        senha

      })

      .eq('id', id)

      .select();

    if (error) {

      console.log(error);

      return res.status(500).json({

        erro:
          error.message

      });

    }

    res.json({

      mensagem:
        'Aluno atualizado com sucesso.',

      aluno: data

    });

  } catch (error) {

    console.log(error);

    res.status(500).json({

      erro:
        'Erro ao atualizar aluno.'

    });

  }

});

/* =========================================
   INICIAR SERVIDOR
========================================= */

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(

    `🚀 Servidor da livraria rodando na porta ${PORT}`

  );

});
