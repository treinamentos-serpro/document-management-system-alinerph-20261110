---
description: Revisa a nomenclatura de classes JavaScript, componentes React e classes CSS conforme boas práticas e convenções do projeto.
name: conferir-nomenclatura-classes
argument-hint: arquivo, pasta ou trecho a revisar
agent: agent
---

# Conferir nomenclatura de classes

Revise a nomenclatura no arquivo, pasta ou trecho informado pelo usuário. Se não
houver um escopo explícito, use a seleção atual ou o arquivo aberto. Se nenhum
deles estiver disponível, solicite o escopo antes de prosseguir.

## Diretrizes

- Consulte as instruções do repositório e as convenções do código próximo.
- Identifique se o escopo contém classes JavaScript, componentes React ou classes
	CSS. Avalie somente as categorias presentes, sem criar estruturas ausentes.
- Não altere arquivos: apresente o diagnóstico e sugestões de renomeação.
- Priorize clareza, consistência e nomes em inglês para símbolos de código.
- Diferencie problemas objetivos de preferências de estilo. Não imponha um padrão
	novo quando a convenção existente for clara e adequada.

## Critérios de revisão

### Classes JavaScript e componentes React

- Verifique o uso de `PascalCase`, respeitando as convenções do projeto.
- Prefira nomes descritivos que expressem a responsabilidade ou o conceito do
	domínio, sem abreviações obscuras ou termos genéricos sem contexto.
- Confira a consistência entre declaração, exportação, importações e nome do
	arquivo, considerando padrões locais como arquivos com sufixos de camada.
- Avalie sufixos como `Service`, `Repository`, `Controller` e `Component` conforme
	seu significado e uso local, sem exigir sua inclusão ou remoção indiscriminada.
- Não converta componentes funcionais com hooks em classes. Não renomeie funções
	comuns para `PascalCase` se elas não forem componentes ou construtores.

### Classes CSS

- Verifique nomes semânticos, legíveis e consistentes entre seletores CSS e
	referências em `className`, incluindo referências condicionais ou dinâmicas.
- Prefira `kebab-case` quando esse for o padrão local. Respeite BEM ou outra
	convenção já adotada; não introduza uma metodologia apenas para esta revisão.
- Evite nomes que dependam de detalhes visuais passageiros quando houver um nome
	estável que descreva melhor o papel do elemento.
- Não renomeie classes de bibliotecas externas, utilitários ou contratos públicos
	sem considerar suas restrições.

## Resultado esperado

1. Informe o escopo revisado e as convenções identificadas.
2. Liste os achados por impacto, com arquivo e linha, nome atual, sugestão e
	 justificativa objetiva. Apresente preferências opcionais separadamente.
3. Para cada renomeação, indique as referências que também precisariam mudar e
	 os riscos de quebra. Não afirme ter verificado referências fora do escopo.
4. Sugira verificações proporcionais, como busca por referências antigas, testes
	 existentes e build do frontend. Não declare verificações que não executou.
5. Se não houver problemas, diga isso explicitamente, indicando eventuais limites
	 da análise. Não invente achados para preencher o relatório.
