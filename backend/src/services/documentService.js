const { randomUUID } = require('node:crypto');
const documentRepository = require('../repositories/documentRepository');

async function createDocument(file, owner) {
  return documentRepository.save({
    id: randomUUID(),
    originalName: file.originalname,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    owner,
    contentType: file.mimetype,
    storageName: file.filename,
  });
}

function listDocuments(owner) {
  return documentRepository.listByOwner(owner);
}

function findDownload(id, owner) {
  return documentRepository.findOwnedFile(id, owner);
}

module.exports = { createDocument, findDownload, listDocuments };