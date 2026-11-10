const express = require('express');
const documentRoutes = require('./routes/document.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', documentRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Recurso não encontrado.' },
  });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: { code: 'FILE_TOO_LARGE', message: 'O arquivo excede o limite permitido.' },
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'O envio do arquivo é inválido.' },
    });
  }

  console.error('Erro interno ao processar requisição:', error.message);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Não foi possível processar a solicitação.' },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
