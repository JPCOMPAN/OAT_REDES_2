const express = require('express');
const app = express();

app.use(express.json());

const pacientes = {
  filaEspera: [],
  emAtendimento: [],
  historico: []
};

let idCounter = 1;

const Prioridade = {
  EMERGENCIA: 'emergencia',
  URGENTE: 'urgente',
  PADRAO: 'padrao',
  ELETIVO: 'eletivo'
};

function getDataHoraAtual() {
  const now = new Date();
  return now.toLocaleString('pt-BR');
}

app.post('/pacientes', (req, res) => {
  try {
    if (!req.body.nome || !req.body.idade) {
      throw new Error('Nome e idade são obrigatórios!');
    }

    const novoPaciente = {
      id: idCounter++,
      nome: req.body.nome,
      idade: req.body.idade,
      sintomas: req.body.sintomas || 'Não descritos',
      prioridade: Object.values(Prioridade).includes(req.body.prioridade) 
        ? req.body.prioridade 
        : Prioridade.PADRAO,
      dataEntrada: getDataHoraAtual(),
      status: 'aguardando'
    };


    if (novoPaciente.prioridade === Prioridade.EMERGENCIA) {
      pacientes.filaEspera.unshift(novoPaciente); 
    } else {
      pacientes.filaEspera.push(novoPaciente); 
    }

    console.log(`Paciente ${novoPaciente.nome} adicionado à fila`);
    res.status(201).json(novoPaciente);

  } catch (err) {
    console.error('Erro ao adicionar paciente:', err.message);
    res.status(400).json({ erro: err.message });
  }
});

app.get('/fila', (req, res) => {
  
  const filaOrdenada = [...pacientes.filaEspera].sort((a, b) => {
    const ordemPrioridade = [
      Prioridade.EMERGENCIA, 
      Prioridade.URGENTE, 
      Prioridade.PADRAO, 
      Prioridade.ELETIVO
    ];
    return ordemPrioridade.indexOf(a.prioridade) - ordemPrioridade.indexOf(b.prioridade);
  });

  res.json({
    totalPacientes: filaOrdenada.length,
    pacientes: filaOrdenada
  });
});


app.post('/atender-proximo', (req, res) => {
  if (pacientes.filaEspera.length === 0) {
    return res.status(404).json({ erro: 'Não há pacientes na fila' });
  }

  const proximoPaciente = pacientes.filaEspera.shift();
  proximoPaciente.status = 'em_atendimento';
  proximoPaciente.inicioAtendimento = getDataHoraAtual();

  pacientes.emAtendimento.push(proximoPaciente);

  console.log(`Atendendo paciente ${proximoPaciente.nome}`);
  res.json(proximoPaciente);
});


app.post('/finalizar-atendimento/:id', (req, res) => {
  const pacienteId = parseInt(req.params.id);
  const index = pacientes.emAtendimento.findIndex(p => p.id === pacienteId);

  if (index === -1) {
    return res.status(404).json({ erro: 'Paciente não está em atendimento' });
  }

  const paciente = pacientes.emAtendimento[index];
  paciente.status = 'atendido';
  paciente.fimAtendimento = getDataHoraAtual();

  pacientes.historico.push(paciente);
  pacientes.emAtendimento.splice(index, 1);

  res.json(paciente);
});


app.get('/paciente/:id', (req, res) => {
  const pacienteId = parseInt(req.params.id);


  const todosPacientes = [
    ...pacientes.filaEspera,
    ...pacientes.emAtendimento,
    ...pacientes.historico
  ];

  const paciente = todosPacientes.find(p => p.id === pacienteId);

  if (!paciente) {
    return res.status(404).json({ erro: 'Paciente não encontrado' });
  }

  res.json(paciente);
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sistema de fila hospitalar rodando na porta ${PORT}`);
  console.log('Modo de operação: desenvolvimento rápido');
});