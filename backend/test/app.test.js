const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');

const storageDirectory = path.join(os.tmpdir(), `dms-test-${randomUUID()}`);
process.env.DMS_STORAGE_DIR = storageDirectory;
process.env.DMS_MAX_FILE_SIZE_BYTES = '64';

const app = require('../src/app');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await once(server, 'close');
  await fs.rm(storageDirectory, { recursive: true, force: true });
});

function identityHeaders(userId) {
  return userId === undefined ? {} : { 'X-User-Id': userId };
}

function uploadFile(userId, name = 'relatorio.txt', content = 'conteudo') {
  const form = new FormData();
  form.append('file', new Blob([content], { type: 'text/plain' }), name);
  return fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: identityHeaders(userId),
    body: form,
  });
}

test('health permanece disponível', async () => {
  const response = await fetch(`${baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('valida a identidade e rejeita identificadores maiores que 100 caracteres', async () => {
  const missingIdentity = await uploadFile(undefined);
  assert.equal(missingIdentity.status, 400);
  assert.equal((await missingIdentity.json()).error.code, 'BAD_REQUEST');

  const longIdentity = await fetch(`${baseUrl}/documents`, {
    headers: identityHeaders('u'.repeat(101)),
  });
  assert.equal(longIdentity.status, 400);
});

test('POST /upload grava o arquivo e retorna metadados públicos', async () => {
  const existingFiles = new Set(await fs.readdir(storageDirectory));
  const owner = `owner-${randomUUID()}`;
  const response = await uploadFile(owner, 'relatorio.txt', 'arquivo privado');
  assert.equal(response.status, 201);

  const uploadedFiles = (await fs.readdir(storageDirectory))
    .filter((file) => !existingFiles.has(file));
  assert.equal(uploadedFiles.length, 1);
  assert.match(uploadedFiles[0], /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i);
  assert.equal(await fs.readFile(path.join(storageDirectory, uploadedFiles[0]), 'utf8'), 'arquivo privado');

  const { document } = await response.json();
  assert.deepEqual(Object.keys(document).sort(), [
    'contentType', 'id', 'originalName', 'owner', 'size', 'uploadedAt',
  ]);
  assert.equal(document.owner, owner);
  assert.equal(document.originalName, 'relatorio.txt');
  assert.equal(document.size, Buffer.byteLength('arquivo privado'));
  assert.equal(document.contentType, 'text/plain');
  assert.equal(Number.isNaN(Date.parse(document.uploadedAt)), false);
});

test('GET /documents lista somente os documentos do proprietário', async () => {
  const owner = `owner-${randomUUID()}`;
  const otherOwner = `other-${randomUUID()}`;
  const ownUpload = await uploadFile(owner, 'proprio.txt', 'meu arquivo');
  const otherUpload = await uploadFile(otherOwner, 'outro.txt', 'outro arquivo');
  const { document: ownDocument } = await ownUpload.json();
  const { document: otherDocument } = await otherUpload.json();

  const ownList = await fetch(`${baseUrl}/documents`, { headers: identityHeaders(owner) });
  assert.deepEqual((await ownList.json()).documents, [ownDocument]);

  const otherList = await fetch(`${baseUrl}/documents`, { headers: identityHeaders(otherOwner) });
  assert.deepEqual((await otherList.json()).documents, [otherDocument]);
});

test('GET /documents/:id/download entrega o arquivo do proprietário', async () => {
  const owner = `owner-${randomUUID()}`;
  const response = await uploadFile(owner, 'relatorio.txt', 'arquivo privado');
  const { document } = await response.json();
  const download = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: identityHeaders(owner),
  });
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition'), /^attachment;/);
  assert.equal(download.headers.get('content-type'), 'text/plain');
  assert.equal(await download.text(), 'arquivo privado');
});

test('oculta documentos inexistentes e de outro proprietário com a mesma resposta 404', async () => {
  const existingFiles = new Set(await fs.readdir(storageDirectory));
  const owner = `owner-${randomUUID()}`;
  const response = await uploadFile(owner, 'privado.txt', 'segredo');
  const { document } = await response.json();

  const foreign = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: identityHeaders(`other-${randomUUID()}`),
  });
  const absent = await fetch(`${baseUrl}/documents/${randomUUID()}/download`, {
    headers: identityHeaders(owner),
  });
  assert.equal(foreign.status, 404);
  assert.equal(absent.status, 404);
  const absentError = await absent.json();
  assert.deepEqual(await foreign.json(), absentError);

  const storedFiles = await fs.readdir(storageDirectory);
  const uploadedFile = storedFiles.find((file) => !existingFiles.has(file));
  assert.ok(uploadedFile);
  await fs.unlink(path.join(storageDirectory, uploadedFile));
  const missingFile = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: identityHeaders(owner),
  });
  assert.equal(missingFile.status, 404);
  assert.deepEqual(await missingFile.json(), absentError);
});

test('rejeita uploads acima do limite configurado com 413', async () => {
  const response = await uploadFile(`owner-${randomUUID()}`, 'grande.txt', 'x'.repeat(65));
  assert.equal(response.status, 413);
  assert.equal((await response.json()).error.code, 'FILE_TOO_LARGE');
});
