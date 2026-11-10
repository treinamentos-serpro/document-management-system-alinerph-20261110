import DownloadButton from './DownloadButton';

const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
const sizeFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${sizeFormatter.format(bytes / 1024)} KB`;
  return `${sizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export default function DocumentList({ documents, userId, isLoading, error, onRefresh }) {
  return (
    <section className="documents-section" aria-labelledby="documents-heading" aria-busy={isLoading}>
      <div className="section-heading">
        <h2 id="documents-heading">Meus documentos</h2>
        <button className="secondary-button" type="button" onClick={onRefresh} disabled={isLoading}>
          Atualizar lista
        </button>
      </div>
      {error ? <p className="error" role="alert">{error}</p> : isLoading ? (
        <p className="empty-state" role="status">Carregando documentos...</p>
      ) : documents.length === 0 ? (
        <p className="empty-state" role="status">Nenhum documento para este usuário.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <caption className="visually-hidden">Documentos de {userId}</caption>
            <thead>
              <tr>
                <th scope="col">Nome</th>
                <th scope="col">Tamanho</th>
                <th scope="col">Enviado em</th>
                <th scope="col"><span className="visually-hidden">Download</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <th scope="row" className="document-name">{document.originalName}</th>
                  <td>{formatSize(document.size)}</td>
                  <td><time dateTime={document.uploadedAt}>{dateFormatter.format(new Date(document.uploadedAt))}</time></td>
                  <td><DownloadButton document={document} userId={userId} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}