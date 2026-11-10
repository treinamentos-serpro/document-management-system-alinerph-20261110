import { useEffect, useState } from 'react';
import UploadComponent from './components/UploadComponent';
import DocumentList from './components/DocumentList';
import { listDocuments } from './services/documentApi';
import './App.css';

function DocumentWorkspace({ userId }) {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError('');

    async function loadDocuments() {
      try {
        const result = await listDocuments(userId, controller.signal);
        if (!controller.signal.aborted) setDocuments(result);
      } catch (error) {
        if (!controller.signal.aborted) setError(error.message);
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    loadDocuments();
    return () => controller.abort();
  }, [userId, revision]);

  function refreshDocuments() {
    setRevision((current) => current + 1);
  }

  return (
    <>
      <UploadComponent userId={userId} onUploaded={refreshDocuments} />
      <DocumentList
        documents={documents}
        userId={userId}
        isLoading={isLoading}
        error={error}
        onRefresh={refreshDocuments}
      />
    </>
  );
}

export default function App() {
  const [identity, setIdentity] = useState('');
  const [userId, setUserId] = useState('');

  function handleIdentitySubmit(event) {
    event.preventDefault();
    const normalizedIdentity = identity.trim();
    if (!normalizedIdentity || normalizedIdentity.length > 100) return;
    setIdentity(normalizedIdentity);
    setUserId(normalizedIdentity);
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <span className="brand">DMS / DOCUMENTOS</span>
        <h1>Gestão de documentos</h1>
      </header>
      <section className="identity-section" aria-labelledby="identity-heading">
        <h2 id="identity-heading">Usuário</h2>
        <form className="identity-form" onSubmit={handleIdentitySubmit}>
          <label htmlFor="user-id">Identificação</label>
          <div className="identity-controls">
            <input
              id="user-id"
              name="userId"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              required
              maxLength={100}
              autoComplete="username"
            />
            <button type="submit" disabled={!identity.trim() || identity.trim() === userId}>
              {userId ? 'Trocar usuário' : 'Selecionar usuário'}
            </button>
          </div>
        </form>
        {userId && <p className="active-user">Usuário atual: <strong>{userId}</strong></p>}
      </section>
      {userId ? <DocumentWorkspace key={userId} userId={userId} /> : (
        <p className="empty-state">Nenhum usuário selecionado.</p>
      )}
    </main>
  );
}
