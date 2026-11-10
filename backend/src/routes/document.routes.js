const crypto = require('node:crypto');
const fs = require('node:fs');
const multer = require('multer');
const express = require('express');
const { maxFileSizeBytes, storageDirectory } = require('../storageConfig');
const documentController = require('../controllers/document.controller');

fs.mkdirSync(storageDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: storageDirectory,
    filename: (req, file, callback) => callback(null, crypto.randomUUID()),
  }),
  limits: { fileSize: maxFileSizeBytes, files: 1 },
});

const router = express.Router();

router.post(
  '/upload',
  documentController.requireUserId,
  upload.single('file'),
  documentController.uploadDocument,
);
router.get('/documents', documentController.requireUserId, documentController.listDocuments);
router.get(
  '/documents/:id/download',
  documentController.requireUserId,
  documentController.downloadDocument,
);

module.exports = router;