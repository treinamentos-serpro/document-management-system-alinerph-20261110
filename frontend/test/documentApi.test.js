import assert from 'node:assert/strict';
import { test } from 'node:test';
import { downloadDocument, listDocuments, uploadDocument } from '../src/services/documentApi.js';

test('lista documentos via /api com identidade normalizada e cancelamento', async (context) => {
  const documents = [{ id: 'document-1', originalName: 'relatorio.txt' }];
  const controller = new AbortController();
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/documents');
    assert.equal(options.headers['X-User-Id'], 'alice');
    assert.equal(options.signal, controller.signal);
    return Response.json({ documents });
  });

  assert.deepEqual(await listDocuments(' alice ', controller.signal), documents);
});

test('envia arquivo no campo file sem fixar Content-Type multipart', async (context) => {
  const file = new File(['conteudo'], 'relatorio.txt');
  const document = { id: 'document-1' };
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/upload');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['X-User-Id'], 'alice');
    assert.equal(options.headers['Content-Type'], undefined);
    assert.equal(options.body.get('file'), file);
    return Response.json({ document }, { status: 201 });
  });

  assert.deepEqual(await uploadDocument('alice', file), document);
});

test('baixa binário com cabeçalho de identidade e identificador codificado', async (context) => {
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, '/api/documents/id%2Fespecial/download');
    assert.equal(options.headers['X-User-Id'], 'alice');
    return new Response('conteudo');
  });

  const blob = await downloadDocument('alice', 'id/especial');
  assert.equal(await blob.text(), 'conteudo');
});

test('preserva a mensagem de erro da API', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => Response.json({
    error: { message: 'Documento não encontrado.' },
  }, { status: 404 }));

  await assert.rejects(downloadDocument('alice', 'missing'), /Documento não encontrado/);
});

test('usa mensagem padrão quando o erro não é JSON', async (context) => {
  context.mock.method(globalThis, 'fetch', async () => new Response('Bad Gateway', { status: 502 }));

  await assert.rejects(listDocuments('alice'), /Não foi possível concluir a operação/);
});