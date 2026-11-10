# Especificação - Document Management System

## 1. Objetivo

Permitir que uma pessoa associe uma identidade simples aos próprios documentos para enviá-los, listá-los e baixá-los em uma aplicação web com armazenamento local.

## 2. Escopo

### Dentro do escopo

- Upload de um documento por requisição.
- Listagem e download restritos à identidade informada na requisição.
- Interface React para informar identidade, enviar, listar e baixar arquivos.
- Armazenamento dos binários no filesystem local e metadados em memória.

### Fora do escopo

- Autenticação, autorização baseada em credenciais, contas ou gestão de sessões.
- Armazenamento externo, nuvem, banco de dados ou persistência durável dos metadados.
- Versionamento, compartilhamento, edição, remoção ou busca avançada de documentos.
- Garantia de confidencialidade: `X-User-Id` é uma identidade de associação, não uma credencial.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | A API deve exigir `X-User-Id` em upload, listagem e download; o valor deve ser string não vazia após `trim` e ter no máximo 100 caracteres. |
| RF-02 | O usuário pode enviar exatamente um arquivo no campo multipart `file` e recebe HTTP 201 com os metadados públicos criados. |
| RF-03 | O arquivo deve ser salvo em `backend/storage` com nome físico gerado, sem usar o nome original como caminho. |
| RF-04 | O usuário pode listar somente os documentos cujo `owner` corresponde à identidade normalizada da requisição. |
| RF-05 | O usuário pode baixar um documento próprio por identificador. Documento inexistente, de outro usuário ou sem arquivo local deve produzir a mesma resposta 404. |
| RF-06 | A interface permite informar/trocar a identidade, selecionar e enviar um arquivo, ver os documentos próprios e baixar um documento. |
| RF-07 | A interface apresenta estados de carregamento, lista vazia e erro de forma compreensível. |
| RF-08 | `GET /health` retorna `{ "status": "ok" }`. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Backend em Node.js, Express e CommonJS, organizado em `routes -> controllers -> services -> repositories`. |
| RNF-02 | Upload implementado com Multer 2 e `diskStorage`; os arquivos são gravados no filesystem local, em `backend/storage` por padrão. |
| RNF-03 | `DMS_STORAGE_DIR` pode configurar um diretório local alternativo; não são usados provedores externos ou serviços de armazenamento em nuvem. |
| RNF-04 | O limite por arquivo é configurado por `DMS_MAX_FILE_SIZE_BYTES`; o padrão é 10 MiB (10 * 1024 * 1024 bytes). Valores inválidos ou não positivos usam o padrão. |
| RNF-05 | Os metadados ficam em memória e são perdidos ao reiniciar o processo. |
| RNF-06 | Erros da API usam JSON `{ "error": { "code": string, "message": string } }`, sem caminhos físicos ou stack trace. |
| RNF-07 | A interface comunica-se por `fetch` usando prefixo `/api`; o proxy Vite remove esse prefixo antes de encaminhar ao backend. |
| RNF-08 | Testes de backend usam `node:test` e não deixam arquivos temporários no storage após sua execução. |

## 5. Modelo de dados

Metadados públicos retornados pela API:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador UUID do documento. |
| `originalName` | string | Nome informado pelo cliente para o arquivo. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601. |
| `owner` | string | `X-User-Id` após remoção de espaços nas extremidades. |
| `contentType` | string | Tipo de conteúdo recebido no multipart. |

O repositório mantém internamente `storageName`, gerado aleatoriamente e usado somente para localizar o binário. Esse campo nunca é exposto na resposta pública. O vínculo entre `id`, metadados e nome físico existe apenas enquanto o processo está ativo. O diretório físico é resolvido por `DMS_STORAGE_DIR` ou, na ausência dessa configuração, para `backend/storage`.

## 6. Contratos de API

Todas as operações de documentos exigem `X-User-Id`. Após `trim`, o cabeçalho deve conter de 1 a 100 caracteres. Esse valor organiza os documentos por proprietário, mas não autentica nem prova a identidade de quem fez a requisição.

### `POST /upload`

- Entrada: `multipart/form-data`, um arquivo no campo `file`; cabeçalho `X-User-Id`.
- Limite: `DMS_MAX_FILE_SIZE_BYTES`, padrão de 10 MiB (10 * 1024 * 1024 bytes); configurações inválidas ou não positivas usam o padrão.
- Sucesso: HTTP 201, `{ "document": { "id", "originalName", "size", "uploadedAt", "owner", "contentType" } }`.
- Erros: HTTP 400 para identidade ou requisição inválida; HTTP 413 para arquivo acima do limite.

### `GET /documents`

- Entrada: cabeçalho `X-User-Id`.
- Sucesso: HTTP 200, `{ "documents": [...] }`, incluindo apenas documentos do proprietário.
- Erros: HTTP 400 para identidade inválida.

### `GET /documents/:id/download`

- Entrada: identificador no caminho e cabeçalho `X-User-Id`.
- Sucesso: HTTP 200 com o conteúdo binário, `Content-Type` registrado e `Content-Disposition: attachment` com nome tratado como valor de cabeçalho, não como caminho.
- Erros: HTTP 400 para identidade inválida; HTTP 404 com o mesmo código e mensagem se o documento não existir, pertencer a outra identidade ou estiver sem o arquivo local.

### Erros comuns

- HTTP 400: `{ "error": { "code": "BAD_REQUEST", "message": "..." } }`.
- HTTP 404: `{ "error": { "code": "NOT_FOUND", "message": "Documento não encontrado." } }`.
- HTTP 413: `{ "error": { "code": "FILE_TOO_LARGE", "message": "..." } }`.
- HTTP 500: `{ "error": { "code": "INTERNAL_ERROR", "message": "..." } }`, sem detalhes internos.

## 7. Decisões arquiteturais

- Rotas definem o mapeamento HTTP e a configuração do Multer; controllers validam cabeçalhos e traduzem requisições/respostas; services concentram os casos de uso; repositories mantêm metadados e resolvem caminhos de arquivos.
- A aplicação usa um `Map` em memória para metadados e filesystem local para os binários. O diretório padrão é `backend/storage` e pode ser substituído por `DMS_STORAGE_DIR`; não há serviços de armazenamento externos.
- Um UUID independente é usado como nome físico; o nome original é somente metadado e nome sugerido no download.
- A interface separa acesso HTTP em `services/` e mantém a interação na aplicação React.
- A identidade simples é uma conveniência de segregação de dados, sem garantias de autenticação ou proteção contra falsificação de cabeçalho.

## 8. Plano de execução

As etapas abaixo descrevem a implementação futura do produto. Esta especificação define os requisitos e critérios de aceite; sua elaboração não executa nem altera arquivos de backend ou frontend.

### Marco 1 - Contratos e requisitos

**Etapas:** confirmar requisitos, limites, modelo público, cabeçalhos, respostas de erro e decisões de armazenamento antes da implementação.

**Aceite:** requisitos funcionais e não funcionais, modelo público, cabeçalhos, respostas e decisões de persistência estão documentados e não se contradizem.

### Marco 2 - API e armazenamento local

**Etapas:** implementar o recebimento multipart com Multer `diskStorage` nas rotas; validar a identidade e traduzir HTTP nos controllers; concentrar os casos de uso nos services; manter metadados e resolver arquivos locais nos repositories.

**Aceite:** upload, listagem e download funcionam pela API; diretório e limite são configuráveis com os padrões documentados; o isolamento por proprietário vale nas três operações; erros previstos usam JSON; caminhos físicos não são retornados; `GET /health` continua disponível.

### Marco 3 - Interface de documentos

**Etapas:** integrar a interface React aos endpoints por meio dos serviços frontend, mantendo componentes e interação organizados conforme as convenções do projeto.

**Aceite:** uma pessoa consegue informar identidade, enviar arquivo, atualizar a lista e baixar arquivo próprio; estados de carregamento, vazio e erro são visíveis; chamadas enviam `X-User-Id` pelo prefixo `/api`.

### Marco 4 - Verificação

**Etapas:** executar testes automatizados da API e validar o build do frontend após concluir os marcos de implementação.

**Aceite:** `npm test` no backend cobre upload, listagem, download, isolamento, validações e limite sem deixar artefatos; `npm run build` no frontend conclui sem erros.