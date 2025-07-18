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

app.post('/adicionar-pacientes', (req, res) => {
  try {
    const pacientesRecebidos = Array.isArray(req.body) ? req.body : [req.body];

    const pacientesAdicionados = [];

    for (const paciente of pacientesRecebidos) {
      if (!paciente.nome || !paciente.idade) {
        throw new Error('Todos os pacientes devem ter nome e idade!');
      }

      const novoPaciente = {
        id: idCounter++,
        nome: paciente.nome,
        idade: paciente.idade,
        sintomas: paciente.sintomas || [],
        prioridade: Object.values(Prioridade).includes(paciente.prioridade)
          ? paciente.prioridade
          : Prioridade.PADRAO,
        dataEntrada: getDataHoraAtual(),
        status: 'aguardando'
      };

      if (novoPaciente.prioridade === Prioridade.EMERGENCIA) {
        pacientes.filaEspera.unshift(novoPaciente);
      } else {
        pacientes.filaEspera.push(novoPaciente);
      }

      pacientesAdicionados.push(novoPaciente);
    }

    res.status(201).json({
      mensagem: `${pacientesAdicionados.length} paciente(s) adicionado(s)`,
      pacientes: pacientesAdicionados
    });

  } catch (err) {
    res.status(400).json({ erro: err.message });
  }
});

app.get('/organizar-fila', (req, res) => {
  
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


app.get('/procurar-paciente/:id', (req, res) => {
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

// update
app.put('/atualizar-paciente/:id', (req, res) => {
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

  const { nome, idade, sintomas, prioridade } = req.body;

  if (nome) paciente.nome = nome;
  if (idade) paciente.idade = idade;
  if (sintomas) paciente.sintomas = sintomas;
  if (prioridade && Object.values(Prioridade).includes(prioridade)) {
    paciente.prioridade = prioridade;
  }

  res.json({ mensagem: 'Paciente atualizado com sucesso', paciente });
});


//delete
app.delete('/deletar-paciente/:id', (req, res) => {
  const pacienteId = parseInt(req.params.id);

  const removerPaciente = (lista) => {
    const index = lista.findIndex(p => p.id === pacienteId);
    if (index !== -1) {
      const pacienteRemovido = lista[index];
      lista.splice(index, 1);
      return pacienteRemovido;
    }
    return null;
  };

  const removidoDaFila = removerPaciente(pacientes.filaEspera);
  const removidoEmAtendimento = removerPaciente(pacientes.emAtendimento);
  const removidoDoHistorico = removerPaciente(pacientes.historico);

  const pacienteRemovido = removidoDaFila || removidoEmAtendimento || removidoDoHistorico;

  if (!pacienteRemovido) {
    return res.status(404).json({ erro: 'Paciente não encontrado' });
  }

  res.json({ mensagem: 'Paciente removido com sucesso', paciente: pacienteRemovido });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sistema de fila hospitalar rodando na porta ${PORT}`);
  console.log('Modo de operação: desenvolvimento rápido');
});