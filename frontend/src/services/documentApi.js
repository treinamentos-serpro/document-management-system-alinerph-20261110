async function request(path, userId, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { ...options.headers, 'X-User-Id': userId.trim() },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error?.message || 'Não foi possível concluir a operação.');
  }

  return response;
}

export async function listDocuments(userId, signal) {
  const response = await request('/documents', userId, { signal });
  const { documents } = await response.json();
  return documents;
}

export async function uploadDocument(userId, file) {
  const body = new FormData();
  body.append('file', file);
  const response = await request('/upload', userId, { method: 'POST', body });
  const { document } = await response.json();
  return document;
}

export async function downloadDocument(userId, documentId) {
  const response = await request(`/documents/${encodeURIComponent(documentId)}/download`, userId);
  return response.blob();
}