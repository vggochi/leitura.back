require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Configurações do Express
app.use(cors());
app.use(express.json());

// Conexão com o Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==========================================
// ROTA 1: LOGIN
// ==========================================
app.post('/api/login', async (req, res) => {
    const { rm, senha } = req.body;

    // Busca o aluno no Supabase
    const { data, error } = await supabase
        .from('alunos')
        .select('*')
        .eq('rm', rm)
        .eq('senha', senha)
        .single(); // .single() garante que retorne apenas 1 objeto, não uma array

    if (error || !data) {
        return res.status(401).json({ erro: 'RM ou senha incorretos.' });
    }

    // Retorna os dados do aluno (escondendo a senha por segurança)
    delete data.senha;
    res.json({ aluno: data });
});

// ==========================================
// ROTA 2: REGISTRAR LEITURA (Máx 16min/dia)
// ==========================================
app.post('/api/registrar', async (req, res) => {
    const { aluno_id, minutos } = req.body;

    if (!aluno_id || !minutos || minutos <= 0) {
        return res.status(400).json({ erro: 'Dados inválidos.' });
    }

    try {
        // 1. Descobrir quantos minutos o aluno já leu HOJE
        const inicioDoDia = new Date();
        inicioDoDia.setHours(0, 0, 0, 0);
        
        const fimDoDia = new Date();
        fimDoDia.setHours(23, 59, 59, 999);

        const { data: leiturasHoje, error: erroBusca } = await supabase
            .from('leituras')
            .select('minutos')
            .eq('aluno_id', aluno_id)
            .gte('created_at', inicioDoDia.toISOString())
            .lte('created_at', fimDoDia.toISOString());

        if (erroBusca) throw erroBusca;

        // Soma os minutos já lidos hoje
        const totalHoje = leiturasHoje.reduce((acc, leitura) => acc + leitura.minutos, 0);

        // 2. Verifica a regra de negócio (Máximo 16 min)
        if (totalHoje + minutos > 16) {
            const restante = 16 - totalHoje;
            if (restante === 0) {
                return res.status(400).json({ erro: 'Você já atingiu seu limite de 16 minutos hoje. Volte amanhã!' });
            } else {
                return res.status(400).json({ erro: `Você só pode registrar mais ${restante} minutos hoje.` });
            }
        }

        // 3. Salva a nova leitura no Supabase
        const { error: erroInsert } = await supabase
            .from('leituras')
            .insert([{ aluno_id, minutos }]);

        if (erroInsert) throw erroInsert;

        res.json({ mensagem: 'Leitura registrada com sucesso!' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro interno no servidor ao registrar leitura.' });
    }
});

// ==========================================
// ROTA 3: ESTATÍSTICAS DA ESCOLA
// ==========================================
app.get('/api/estatisticas', async (req, res) => {
    try {
        // Busca todos os minutos lidos na tabela
        const { data, error } = await supabase
            .from('leituras')
            .select('minutos');

        if (error) throw error;

        // Soma todos os minutos da escola inteira
        const total_escola = data.reduce((acc, leitura) => acc + leitura.minutos, 0);

        res.json({ total_escola });

    } catch (error) {
        console.error(error);
        res.status(500).json({ erro: 'Erro ao buscar estatísticas.' });
    }
});

// ==========================================
// INICIANDO O SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`Conectado ao Supabase: ${process.env.SUPABASE_URL ? 'Sim' : 'Não'}`);
});