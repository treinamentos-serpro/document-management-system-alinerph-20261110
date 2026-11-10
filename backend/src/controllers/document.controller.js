const documentService = require('../services/document.service');

function requireUserId(req, res, next) {
  const userId = req.get('X-User-Id');
  const normalizedUserId = typeof userId === 'string' ? userId.trim() : '';

  if (!normalizedUserId || normalizedUserId.length > 100) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Informe um X-User-Id válido (até 100 caracteres).' },
    });
  }

  req.userId = normalizedUserId;
  return next();
}

async function uploadDocument(req, res, next) {
  if (!req.file) {
    return res.status(400).json({
      error: { code: 'BAD_REQUEST', message: 'Envie um arquivo no campo "file".' },
    });
  }

  try {
    const document = await documentService.createDocument(req.file, req.userId);
    return res.status(201).json({ document });
  } catch (error) {
    return next(error);
  }
}

function listDocuments(req, res) {
  return res.json({ documents: documentService.listDocuments(req.userId) });
}

async function downloadDocument(req, res, next) {
  try {
    const result = await documentService.findDownload(req.params.id, req.userId);
    if (!result) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Documento não encontrado.' },
      });
    }

    res.attachment(result.document.originalName);
    res.setHeader('Content-Type', result.document.contentType || 'application/octet-stream');
    return res.sendFile(result.filePath, (error) => {
      if (error && !res.headersSent) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Documento não encontrado.' },
        });
      }
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { downloadDocument, listDocuments, requireUserId, uploadDocument };