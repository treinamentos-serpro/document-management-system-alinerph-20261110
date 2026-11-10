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

  if (!/^[\da-f]{8}(-[\da-f]{4}){3}-[\da-f]{12}$/i.test(document.storageName)) {
    return null;
  }

  const resolvedStorageDirectory = path.resolve(storageDirectory);
  const filePath = path.resolve(resolvedStorageDirectory, document.storageName);
  if (path.dirname(filePath) !== resolvedStorageDirectory) {
    return null;
  }

  try {
    await fs.access(filePath);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      return null;
    }
    throw error;
  }

  return { document: toPublicDocument(document), filePath };
}

module.exports = { findOwnedFile, listByOwner, save };