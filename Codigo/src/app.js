const express = require('express');
const app = express();

app.use(express.json());


let filaPacientes = [];
let historicoAtendimentos = [];
let id = 1;

app.use((req, _, next) => {
    console.log(`${req.method} ${req.url}`);
});


app.post('/api/pacientes', (req, res) => {    
    const {nome, condicao, prioridade = 'rotina'} = req.body;

    if(!nome || !condicao) {
        return res.status(400).json({ erro: 'Nome e condição são obrigatórios'});
    }

    const paciente = {
        id: id++,
        nome,
        condicao,
        urgente, 
        entrada: new Date()
    };

    if (urgente) {
        filaPacientes.unshift(paciente);
    } else {
        filaPacientes.push(paciente);
    }

    res.status(201).json(paciente);
});

app.get('/pacientes', (_, res) => {
    res.json(fila);
});

app.post('/proximo', (_, res) => {
    if (filaPacientes.length === 0) return res.status(404).send('fila vazia');

    const paciente = fila.shift();
    historicoAtendimentos.push({
        ...paciente,
        saida: new Date()
    });

    res.json(paciente);

});

app.get('/atendidos', (_, res) => {
    res.json(historicoAtendimentos)
});



app.get('/filaAtendimento', (req, res) => {
    res.json(filaPacientes);
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
})
