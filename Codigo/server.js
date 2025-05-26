const express = require('express');
const app = express();

app.use(express.json());

let filaAtendimento = [
    { id: 1, nome: "João Pablo"}
];

app.get('/items', (req, res) => {
    res.json(filaAtendimento);
});

const PORT = 3000;
app.listen(PORT, () => console.log('Servidor rodando em http://localhost:${PORT}'));