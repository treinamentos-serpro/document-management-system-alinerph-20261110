const fs = require('node:fs/promises');
const path = require('node:path');
const { storageDirectory } = require('../storageConfig');

const documents = new Map();

function toPublicDocument(document) {
  const { storageName, ...publicDocument } = document;
  return publicDocument;
}

async function save(document) {
  documents.set(document.id, document);
  return toPublicDocument(document);
}

function listByOwner(owner) {
  return [...documents.values()]
    .filter((document) => document.owner === owner)
    .map(toPublicDocument);
}

async function findOwnedFile(id, owner) {
  const document = documents.get(id);
  if (!document || document.owner !== owner) {
    return null;
  }

  const filePath = path.join(storageDirectory, document.storageName);
  try {
    await fs.access(filePath);
  } catch {
    return null;
  }

  return { document: toPublicDocument(document), filePath };
}

module.exports = { findOwnedFile, listByOwner, save };