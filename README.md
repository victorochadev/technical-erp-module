# Módulo Técnico — ERP BM1/BJControl

Protótipo em Node.js/Express do módulo de Área Técnica do ERP BM1/BJControl:
atendimentos técnicos (remoto/presencial/laboratório), instalações com
checklist de aprovação de fotos, dashboard de métricas (com dashboards por
categoria alimentados por planilhas do Google), quadro Kanban de laboratório,
JET-IA (busca na base de conhecimento + pergunta em linguagem natural via
webhook n8n), helpdesk de chat com clientes, e os cadastros de apoio
(clientes, técnicos terceirizados, produtos, grupos de produto, WMS,
funcionários, cargos e salários, requisições). Serve de referência visual e
funcional para o programador do ERP real integrar o módulo.

## Como rodar

```bash
npm install
npm start
```

Requer um arquivo `.env` na raiz (não versionado) com as credenciais do
Supabase:

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

**Importante:** o servidor usa a **service_role key** (secreta, bypassa RLS),
não a anon key — só o Express fala com o Supabase, o navegador não tem mais
acesso direto ao banco (ver seção "Banco de dados (Supabase)" abaixo). Nunca
exponha essa chave no front-end nem a versione no repositório.

Acesse `http://localhost:3300` — você vai cair na tela de **login**
(`login.html`) antes de qualquer outra página. Credenciais em `login.js`
(usuário `victor.rocha`). Os dados são **reais, persistidos no Supabase**
(Postgres) — ver seção "Banco de dados (Supabase)" abaixo — cobrindo
maio, junho e julho de 2026 como massa inicial.

Telas no protótipo, navegáveis pelo menu lateral:

- `atendimentos.html` — **Atendimentos**, com abas Remoto/Presencial/Laboratório (tela inicial do módulo Área Técnica)
- `index.html` — **Dashboard** de métricas (Área Técnica)
- `novo-atendimento.html` — **Novo Atendimento** (fluxo de criação/edição, Área Técnica)
- `instalacoes.html` — **Instalações**, lista de pedidos de venda com instalação técnica pendente
- `instalacao-detalhes.html` — detalhe de uma instalação, com checklist de aprovação de fotos
- `laboratorio.html` — **Laboratório**, quadro Kanban de manutenção (Área Técnica)
- `wiki.html` — **Wiki**, base de conhecimento técnico (Área Técnica)
- `helpdesk.html` — **HelpDesk**, chat interno com clientes (Área Técnica)
- `requisicoes.html` — **Requisições** (módulo Vendas)
- `clientes.html`, `tecnicos-terceirizados.html` — **Cadastro**: Clientes e Técnicos Terceirizados
- `produtos.html` — **Cadastro**: Produtos
- `/app/grupos-produto` — **Cadastro**: Grupos de Produtos (primeiro módulo migrado para React + TypeScript, ver seção "Migração para React + TypeScript" abaixo)
- `wms.html`, `funcionarios.html`, `cargos-salarios.html` — **Cadastro**: WMS, Funcionários e Cargos e Salários
- `/app/frota/veiculos`, `/app/frota/viagens` — **Cadastro**: Controle de Frota (Veículos e Viagens de Frota, ver seção própria abaixo — nasceu direto em React + TypeScript)

## Banco de dados (Supabase)

O módulo técnico inteiro (clientes, técnicos internos e terceirizados,
catálogo de equipamentos/modelos/WMS, atendimentos, instalações, quadro do
laboratório, requisições, produtos, grupos de produto, wiki e helpdesk) roda
sobre um projeto Supabase (Postgres) real, substituindo os arrays em memória
que existiam antes.

- `supabase/schema.sql` — schema completo (22 tabelas + RLS + seed dos dados
  mestres). Rode esse arquivo no SQL Editor do Supabase ao configurar um novo
  projeto do zero.
- `scripts/seedSupabaseData.js` — script único (`node scripts/seedSupabaseData.js`)
  que gera a massa de demonstração de atendimentos/instalações/cards do
  laboratório e insere no banco. Só deve ser rodado uma vez por projeto — os
  números/pedidos têm constraint `UNIQUE`, então uma segunda execução falha
  em conflito ao invés de duplicar dados.
- `src/data/supabaseClient.js` — client compartilhado, usa `SUPABASE_URL` e
  `SUPABASE_SERVICE_ROLE_KEY` do `.env`. **Só o servidor Express fala com o
  Supabase** — o front-end (`public/`) chama exclusivamente `/api/...` no
  próprio host; não há mais nenhum client Supabase no navegador.
- **RLS**: todas as tabelas têm Row Level Security habilitado, sem nenhuma
  policy para `anon`/`authenticated` — ou seja, acesso negado por padrão para
  qualquer chave que não seja a `service_role` (que sempre bypassa RLS). Até
  2026-08-05 existia uma policy `anon_all` permissiva (`for all ... using
  (true)`) combinada com a anon key exposta em `public/supabase-config.js` —
  isso permitia leitura/escrita irrestritas nos dados reais de clientes a
  partir do navegador. Foi corrigido: o navegador não fala mais direto com o
  Supabase (removidos `public/api-shim.js` e `public/supabase-config.js`), e
  a policy permissiva foi removida via migration.

## Responsivo

O protótipo funciona tanto em desktop quanto em celular/tablet. Abaixo de
768px de largura:
- A sidebar de ícones vira uma barra fixa **inferior**, em vez de lateral. Os
  flyouts (que dependem de hover) ficam desativados no touch — cada ícone com
  submenu (Vendas, Área Técnica) navega direto para a página principal do
  módulo ao tocar.
- Grids de 2/3 colunas (KPIs, formulários, checklist de instalação) colapsam
  para 1 coluna; linhas flex (busca + filtros, ida/volta, produto+qtd+valor)
  empilham verticalmente.
- Tabelas mantêm todas as colunas e rolam horizontalmente dentro do próprio
  cartão (`.table-wrapper { overflow-x: auto }`) em vez de esconder dados.
- O calendário de atendimentos (`index.html`) e o quadro Kanban
  (`laboratorio.html`) também rolam horizontalmente — o calendário mantém as
  7 colunas de dia da semana com scroll, e o quadro mostra uma coluna cheia
  por vez (mesmo padrão do Trello mobile). O modal de detalhes do cartão
  empilha a coluna de informações e a de comentários.

## JET-IA (assistente de IA técnico)

A tela **JET-IA** (`wiki.html`, item "JET-IA" da Área Técnica no menu lateral — antigo
"Wiki", renomeado) já tinha a caixa de busca "Qual a sua dúvida?", que hoje só filtra
os artigos da base de conhecimento por palavra-chave (`GET /api/wiki?busca=`). Essa
tela ganhou um segundo caminho: um botão **"Perguntar à JET-IA"** (e a tecla Enter no
mesmo campo) que envia a pergunta para o fluxo de IA no n8n (projeto irmão
`JET-IA-ERP/n8n/jet-ia-flow.json`) e mostra a resposta gerada logo abaixo, sem afetar
o filtro de artigos existente.

- **`public/jetia-config.js`** — URL do webhook do n8n + identificação do colaborador
  (hoje fixa em `victor.rocha`, já que o login deste protótipo é de usuário único — ver
  seção "Login" abaixo). **Troque `webhookUrl` pela URL real** gerada ao importar
  `jet-ia-flow.json` no n8n (produção ou teste) antes de testar.
- **`public/jetia-widget.js`** — chama o webhook direto do navegador (`fetch`),
  sem passar pelo Express local — é a única chamada de rede do front-end que
  não vai para `/api/...` (não fala com o Supabase, então não conflita com a
  arquitetura "tudo via Express" adotada para o resto do app). Trata os 3
  formatos de resposta do fluxo (sucesso `200`, payload inválido `400`, erro
  interno `500` — ver `JET-IA-ERP/n8n/INTEGRATION.md`).
- **Atenção — CORS:** como a chamada é feita direto do navegador para o n8n (origem
  diferente), a instância de n8n precisa permitir CORS para a origem do ERP
  (ex.: `http://localhost:3300`). Se o teste falhar com erro de CORS no
  console do navegador, esse é o motivo — verifique as configurações de CORS
  da sua instância de n8n (variam entre self-hosted e n8n Cloud).
- O escopo da IA é só **dúvidas técnicas de equipamentos** (mesma base de
  conhecimento da tela JET-IA) — não consulta dados financeiros/operacionais do ERP.

## Menu lateral (sidebar)

A sidebar tem só três ícones — **Cadastro**, **Vendas** e **Área Técnica** —,
todos com flyout ao passar o mouse. HTML replicado em cada página (não
componentizado), então uma mudança no menu precisa ser aplicada em todas as
~28 páginas.
- **Cadastro** (ordem real): Clientes, Técnicos Terceirizados, Produtos,
  Grupos de Produtos, WMS, Funcionários, Cargos e Salários (ver seções
  abaixo).
- **Vendas**: Requisições (ver seção abaixo).
- **Área Técnica** (ordem real): Atendimentos, Instalações, Visitas/Amostra,
  Laboratório, **JET-IA** (o rótulo visível mudou de "Wiki" para "JET-IA" —
  o arquivo continua sendo `wiki.html`/`wiki.js`, sem renomeação), HelpDesk,
  Dashboard (último item, não o primeiro). Todas são funcionais, exceto
  **Visitas/Amostra**, que continua placeholder (`href="#"`). **HelpDesk**
  abre em uma nova aba (`target="_blank"`), diferente dos demais itens.

Os demais ícones do ERP real (aprovações, painel geral, perfil, indicadores,
produtos, ajuda) foram removidos por não terem nenhuma função neste
protótipo.

## Login (`login.html`)

Antes de qualquer tela, o protótipo pede usuário e senha. **Isso é uma
proteção de demonstração, não segurança de verdade**: como é um site
estático (sem sessão real no servidor), a credencial fica no próprio
`login.js` e o "acesso liberado" é só uma flag no `localStorage`
(`at-auth = 'ok'`) — qualquer um com o devtools aberto contorna isso. Serve
para afastar visitantes casuais do link público, não para proteger dados
sensíveis (aliás não há nenhum, os dados são todos mock).

Todas as páginas, exceto `login.html`, têm um pequeno script no `<head>`
que verifica essa flag e redireciona para `login.html` se não estiver
presente. Para trocar a credencial, edite as constantes `USUARIO_VALIDO` e
`SENHA_VALIDA` no topo de `login.js`.

## Cadastro (`clientes.html`, `tecnicos-terceirizados.html`, `produtos.html`, `/app/grupos-produto`, `wms.html`, `funcionarios.html`, `cargos-salarios.html`)

Ícone de crachá da sidebar, com sete submódulos — listas simples (busca +
botão "+"), seguindo o mesmo padrão visual das outras telas:

- **Clientes** (`clientes.html` + `novo-cliente.html`): lista todos os
  clientes do mock (`src/data/clientesRepository.js`, mesma base usada nos
  autocompletes de Atendimentos) com busca por razão social, nome fantasia,
  CNPJ ou cidade. "+" abre um formulário completo (razão social, CNPJ, IE,
  endereço, contato, telefone, e-mail, site) que grava de verdade via
  `POST /api/clientes`. Menu de ações (⋮) tem **Editar** e **Excluir**
  (`DELETE /api/clientes/:id`) — confirmação via `window.confirm` nativo,
  recarrega a lista inteira após excluir.
- **Técnicos Terceirizados** (`tecnicos-terceirizados.html` +
  `novo-tecnico-terceirizado.html`): cadastro novo, separado da lista interna
  de técnicos usada em Atendimentos/Laboratório/Requisições — representa
  prestadores externos (nome, empresa terceirizada, especialidade, cidade,
  contato). Mock em `src/data/tecnicosTerceirizadosRepository.js`, grava via
  `POST /api/tecnicos-terceirizados`.
- **Produtos** (`produtos.html` + `novo-produto.html`): CRUD completo — nome,
  valor, valor à vista, "controla estoque" (booleano), grupo 1 e grupo 2
  (combobox de texto livre, não vinculado à tabela `grupos_produto`), NCM,
  juros e imagem (miniatura exibida na coluna da lista). Grava via
  `POST /api/produtos`, edita via `PUT /api/produtos/:id`, e exclui via
  `DELETE /api/produtos/:id` (mesmo padrão de confirmação de Clientes) — como
  `wms_unidades.produto_id` tem `on delete cascade`, excluir um produto
  apaga silenciosamente as unidades WMS vinculadas a ele.
- **Grupos de Produtos** (`/app/grupos-produto`, `/app/grupos-produto/novo`,
  `/app/grupos-produto/:id/editar`): cadastro simples (só nome),
  `POST`/`PUT /api/grupos-produto`. **Primeiro módulo migrado para React +
  TypeScript** — ver seção "Migração para React + TypeScript" mais abaixo
  para o padrão a seguir nos próximos módulos. **Nota:** os campos grupo 1/2
  de Produtos hoje não referenciam esta tabela por FK — são texto livre,
  então cadastrar um grupo aqui não aparece automaticamente como opção
  estruturada no formulário de Produtos.
- **WMS** (`wms.html` + `novo-wms.html`): rastreamento de números de série por
  lote de produto — não é um cadastro de campos livres. A lista
  (`wms.html`) agrupa por Produto + Lote (Produto, Lote, Quantidade, Números
  WMS). Em "novo-wms.html" você escolhe um Produto e uma Quantidade; o
  servidor calcula o próximo lote daquele produto (`MAX(lote)+1`) e gera N
  números únicos automaticamente, inserindo N linhas em `wms_unidades`
  (`POST /api/wms` com `{produtoId, quantidade}`). Sem edição/exclusão de
  unidade individual pela UI.
- **Funcionários** (`funcionarios.html` + `novo-funcionario.html`): Nome,
  Cargo (combobox pesquisável alimentado por Cargos e Salários, mas
  armazenado como texto solto — sem FK), Telefone, E-mail. CRUD via
  `GET/POST/PUT /api/funcionarios` — **sem exclusão** (nem botão, nem rota).
- **Cargos e Salários** (`cargos-salarios.html` + `novo-cargo-salario.html`):
  Nome do Cargo (único) e Salário Base. CRUD via
  `GET/POST/PUT /api/cargos-salarios` — **sem exclusão**, mesmo padrão de
  Funcionários.

## Controle de Frota (`/app/frota/veiculos`, `/app/frota/viagens`)

Cadastro dos veículos da empresa e registro de uso (viagens) por técnico —
nasceu direto em React + TypeScript, sem passar por HTML/JS (não havia
nenhuma versão anterior no protótipo). O modelo de dados mescla ideias de
dois repositórios de referência analisados antes da implementação
(`sistema-controle-de-frota` e `ex3_controleFrota`), adaptadas ao padrão já
usado no resto do protótipo:

- **Veículos** (`/app/frota/veiculos`): placa, marca, modelo, ano, categoria,
  combustível e km atual. Tem também **manutenção preventiva por
  quilometragem** (km previsto, data prevista, descrição) — a lista destaca
  com um chip **"Pendente"** qualquer veículo cujo km atual já alcançou o km
  previsto da manutenção (`manutencaoPendente`, calculado no
  `veiculosRepository.js`, mesmo espírito do SLA calculado do Laboratório).
- **Viagens de Frota** (`/app/frota/viagens`): registra a saída (veículo,
  técnico — reaproveita o mesmo cadastro de técnicos usado em
  Atendimentos/Laboratório, sem CPF/CNH próprio —, finalidade, km e
  data/hora de saída) e depois a chegada (km e data/hora), com o km rodado
  calculado na leitura (`kmChegada - kmSaida`, nunca armazenado). Ao
  registrar a chegada, o `km_atual` do veículo é atualizado automaticamente
  para o novo valor do hodômetro. Tem um campo opcional de **Atendimento
  Vinculado**, com autocomplete sobre `GET /api/atendimentos?busca=` (mesmo
  padrão usado em Requisições), para registrar quando a viagem foi para
  atender um chamado específico.
- Tabelas `veiculos` e `frota_viagens` em `supabase/schema.sql`. Sem
  exclusão pela UI (mesmo tratamento de Funcionários/Cargos e Salários).

## Atendimentos (`atendimentos.html`)

Tela inicial do módulo: três abas — **Atendimento Remoto**, **Atendimento
Presencial** e **Atendimento Laboratório** —, cada uma com sua própria lista
filtrável (busca, técnico, status) — reaproveita `GET /api/atendimentos` com
o parâmetro `tipo` fixo por aba (o filtro já era genérico, não precisou mudar
para suportar o terceiro tipo). O botão **"+"** no canto abre
`novo-atendimento.html?tipo=<tipo da aba ativa>`, pré-selecionando o tipo no
formulário. A aba Laboratório só mostra os atendimentos criados por ela mesma
(ver seção "Integração Atendimento Laboratório ↔ Kanban" abaixo) — diferente
de Remoto/Presencial, que continuam só com os dados mock.

Cada linha tem um menu de ações (⋮) com duas opções:
- **Editar** → abre `novo-atendimento.html?id=<id>`, que carrega o atendimento
  via `GET /api/atendimentos/:id` + `GET /api/clientes/:id` e preenche o
  formulário inteiro (cliente, tipo, datas, técnico, equipamento, marca/modelo,
  WMS, defeito, laudo técnico) — mesma tela usada para criar, em modo edição.
- **Imprimir** → monta o mesmo payload do botão Imprimir do formulário
  (buscando o cliente completo) e abre `imprimir.html` em nova aba, sem
  precisar passar pela tela de edição.

## Dashboard (`index.html`)

- **KPIs do mês**: total de atendimentos, quebra por Tipo (Remoto/Presencial) e
  por Status (Concluído / Em Atendimento / Cancelado), com percentuais.
- **Ranking por técnico**: volume total e quebra por tipo/status, por mês.
- **Calendário de Atendimentos**: também dividido em abas Remoto/Presencial,
  mostra cada atendimento no dia da sua **Data Ida** (mesmo campo preenchido
  no formulário — cai no dia certo mesmo que a Data Emissão seja diferente).
  Cor de fundo do evento = Tipo (a aba já filtra por tipo, mas a cor reforça),
  cor da borda esquerda = Status (verde/âmbar/vermelho). Clicar em um evento
  abre `novo-atendimento.html?id=<id>` (mesma tela de edição usada na lista).
  Dias fora do mês selecionado aparecem vazios (simplificação do protótipo —
  não busca dados do mês anterior/seguinte para preencher os cantos do grid).

(A tabela detalhada de atendimentos foi movida para `atendimentos.html`,
já que agora tem tela própria dividida por abas.)

### Dashboards por Categoria (planilhas do Google)

Seção adicional no Dashboard, com 3 abas — **Suporte Remoto**, **Presencial**,
**Laboratório** —, cada uma mostrando um gráfico de distribuição por
modalidade (Instalação e Treinamento / Atendimento Humano / Jet IA / Outros),
gráfico de equipamentos mais atendidos e um seletor de período. Roda em
paralelo aos KPIs vindos do Supabase, sem substituir nada — é só leitura,
nunca grava de volta na planilha.

- `public/sheets-config.js` — uma config por categoria (`csvUrl` de uma aba
  do Google Sheets publicada em CSV, ou `sheetId`+`sheetName`). Hoje só
  **Suporte Remoto** está conectado (planilha "REGISTRO DE ATENDIMENTOS -
  CALLBEL"); Presencial e Laboratório aguardam a fonte de dados — o card
  mostra "Aguardando fonte de dados" até serem configurados.
- `public/sheets-source.js` — faz o parsing do CSV, detecta colunas por
  sinônimos automaticamente, classifica a modalidade por regex e agrega
  contagens/percentuais. Releitura automática a cada 60s
  (`SHEETS_CONFIG.refreshSeconds`).

## Novo Atendimento (`novo-atendimento.html`)

Fluxo em duas etapas, replicando a tela real do ERP:

1. **Busca de cliente**: campo com autocomplete por Razão Social/CNPJ
   (`GET /api/clientes/busca?q=`). Mostra a Data de Emissão e o usuário logado
   (hoje fixo em `USUARIO_LOGADO`, em `atendimento-form.js` — trocar pela sessão real).
2. **Formulário do atendimento**, ao selecionar um cliente:
   - **Tipo de atendimento**: abas Remoto/Presencial — a não ser que o tipo já
     venha fixado como Laboratório (pelo botão "+" da aba Laboratório, ou
     editando um atendimento desse tipo), caso em que as abas somem e vira só
     um selo "Atendimento Laboratório" (não dá pra trocar entre Remoto/
     Presencial/Laboratório pelo mesmo controle — ver seção própria abaixo).
   - **Técnico**, **Equipamento** e **Marca/Modelo** com autocomplete
     (`/api/tecnicos`, `/api/catalogo/equipamentos`, `/api/catalogo/modelos`) —
     selecionar um Modelo preenche automaticamente o Equipamento (se vazio) e
     os dois campos **WMS**, com base no cadastro do produto.
   - **Toggle Técnico Bannerjet / Técnico Terceirizado**: acima do campo de
     busca de técnico, duas abas escolhem se o autocomplete busca em
     `/api/tecnicos` (interno) ou `/api/tecnicos-terceirizados`. A aba
     Terceirizado se desabilita automaticamente (e volta para Bannerjet, com
     um toast) quando o tipo do atendimento é **Remoto** — regra de negócio:
     não faz sentido despachar um terceiro para um chamado remoto. Ao buscar
     terceirizados, os resultados são ordenados por proximidade regional com o
     cliente (mesma cidade > mesmo estado > resto, já que o protótipo não tem
     dados geográficos reais), com um badge "Mesma cidade"/"Mesmo estado" em
     cada resultado (`atendimento-form.js`, função `prioridadeRegiao`).
   - **Anexos** de fotos/vídeos por drag-and-drop ou clique (preview local,
     ver `adicionarArquivos()` em `atendimento-form.js` — sem upload real ainda).
   - Campos **Defeito** e **Laudo Técnico** (o campo "Solução" foi removido
     a pedido, por não ser mais utilizado no fluxo).
   - Botão **"+"** no topo reinicia o formulário para um novo atendimento.
   - **Salvar**: para Remoto/Presencial (e para edição de um atendimento já
     existente, de qualquer tipo) continua só logando o payload no console e
     mostrando um toast — plugar no endpoint real de gravação quando integrar.
     Para um Atendimento Laboratório **novo**, Salvar já grava de verdade
     (ver seção abaixo).
   - **Imprimir** abre `imprimir.html` em nova aba, com o documento (timbrado
     Bannerjet, dados do cliente, agendamento, equipamento, defeito/laudo e
     assinatura) já no layout de impressão — usar "Imprimir / Salvar como PDF"
     do navegador para gerar o PDF. Os dados fixos da empresa (timbrado) estão
     em `EMPRESA`, no topo de `atendimento-form.js`.

     **Nota:** a seção "Solução" que aparece no documento impresso do ERP real
     foi omitida aqui de propósito, já que o campo foi removido do formulário
     de entrada nesta rodada. Se for para manter no papel timbrado mesmo sem
     input correspondente, é só reintroduzir a seção em `imprimir.html`.

### Integração Atendimento Laboratório ↔ Kanban Laboratório

Diferente de todo o resto do protótipo, um Atendimento Laboratório **novo**
(criado pela aba Laboratório de `atendimentos.html`) é persistido de verdade
e gera automaticamente um cartão na coluna **Entrada** do quadro Kanban
(`laboratorio.html`) — não é só uma tela visual isolada.

Diferenças específicas desse tipo, visíveis só quando `tipo=Laboratório`:
- **Sem seleção Remoto/Presencial** — as abas de tipo somem, vira só um selo.
- **SLA inicial** (`#sla-picker`): Padrão/Importante/Urgente, escolhido no
  momento da criação. Define a **Data Vencimento** de partida do cartão no
  Kanban (hoje + 10 dias úteis / hoje + 2 dias úteis / ontem, respectivamente)
  — a partir daí o SLA volta a ser recalculado automaticamente pela data,
  igual a qualquer outro cartão do quadro (ver seção "Laboratório" abaixo).
  Some do formulário ao editar um atendimento já existente (é só um valor de
  partida, não um campo permanente do atendimento).
- **Atendimento de Suporte Remoto Vinculado** (`#input-atendimento-vinculado`):
  busca com autocomplete (mesmo componente usado em Técnico/Equipamento/Modelo)
  — o técnico digita o número do atendimento e escolhe entre os atendimentos
  **Remoto** do mesmo cliente (`GET /api/atendimentos?tipo=Remoto&clienteId=&busca=`).
  Ao escolher um, o campo **Defeito** é preenchido automaticamente com um
  resumo desse atendimento (número, data, técnico, defeito relatado e laudo
  técnico), e Equipamento/Marca-Modelo/WMS também são pré-preenchidos (só se
  ainda estiverem vazios). O campo **Técnico** do formulário **não** é
  sobrescrito pelo vínculo — ele representa o técnico que vai atender no
  laboratório, um papel distinto do técnico que atendeu remotamente (esse
  último só aparece no resumo do Defeito e, na impressão, na seção
  "Informações do Laboratório").
- **Requisição de Peças** (`#requisicao-numero-badge`): não é mais um campo de
  texto livre — é uma caixa somente leitura mostrando só o **número** da
  requisição, gerado automaticamente ao abrir o formulário
  (`gerarNumeroRequisicao()` em `atendimento-form.js`) e fixo a partir daí.
  Fica logo abaixo do campo de vínculo. O mesmo número é usado no card do
  Kanban.

Ao clicar em **Salvar** num Atendimento Laboratório novo:
1. `POST /api/atendimentos` grava o atendimento de verdade (por isso ele passa
   a aparecer na aba Laboratório da lista, com número real gerado no backend).
2. `POST /api/laboratorio/de-atendimento` cria o cartão correspondente na
   coluna Entrada do Kanban, com o mesmo número, cliente, técnico, equipamento,
   defeito (resumo), requisição e o SLA inicial escolhido — além de uma
   referência ao atendimento remoto de origem (exibida no modal do cartão como
   "Atendimento de Origem").
3. Um clique posterior em Salvar (já em modo edição) não duplica o cartão —
   volta a ser só o comportamento de protótipo (log + toast).

**Impressão (`imprimir.html`)**: quando o atendimento impresso é do tipo
Laboratório, aparece uma seção extra "Informações do Laboratório" entre
"Agendado Para" e "Descrição do Equipamento", com três campos: **Requisição de
Peças** (Nº), **Atendimento Remoto Vinculado** (Nº) e **Técnico Suporte
Remoto** — este último é o nome do técnico do atendimento Remoto de origem,
diferente do **Técnico Responsável** (que continua aparecendo em "Agendado
Para" e é sempre o técnico do laboratório). Assim as duas pessoas envolvidas
no atendimento — quem atendeu remotamente e quem vai atender no laboratório —
aparecem nomeadas separadamente no documento impresso.

## Instalações (`instalacoes.html` + `instalacao-detalhes.html`)

Módulo separado (também acessível pelo menu lateral, ícone de chave), para
acompanhar a instalação técnica de equipamentos vendidos.

- **Lista** (`instalacoes.html`): Pedido de compra, Pedido de despesas,
  Cliente, Técnico (texto se já vinculado, ou um select "Vincular um técnico"
  — mock, só atualiza a célula na tela, não persiste), Status cliente e
  Status técnico (chips "Em andamento" / "Concluído" com data), busca e
  seletor de "resultados por página".
- **Detalhes** (`instalacao-detalhes.html?id=<id>`): dados do cliente
  (Razão Social, CNPJ, Endereço, Telefone, E-mail) + Transportadora
  responsável; bloco colapsável com os produtos do pedido de venda
  (equipamento/insumos); bloco colapsável com os custos do pedido de
  despesas (Hospedagem, Alimentação, Passagem Aérea, KM Rodado etc., com
  total); **Checklist de Instalação** com 4 itens fixos (Fotos da Sala,
  Ar Condicionado, Hardware do Computador/RIP, Parte Elétrica) — cada um
  com Aprovar/Reprovar (reprovar exige motivo); resumo de todos os itens;
  botão "Avançar para próxima etapa", desabilitado até todos os itens
  saírem do estado pendente.

  **Sobre as fotos:** o enunciado deixou claro que essas imagens vêm
  diretamente do **app Bannerjet** (aplicativo do cliente), não deste ERP —
  por isso cada item do checklist mostra um placeholder ("Aguardando foto
  real enviada pelo cliente via app Bannerjet") em vez de uma foto fake.
  Quando a integração com o app existir, é só trocar esse placeholder pela
  URL real da foto em `instalacao-detalhes.js` (função `renderChecklistItem`).

  As decisões de aprovação/reprovação e o clique em "Avançar" são só de
  tela (estado em memória do JS) — não há endpoint de gravação ainda,
  seguindo o mesmo padrão do botão Salvar em Novo Atendimento.

## Laboratório (`laboratorio.html`)

Quadro Kanban para acompanhar a manutenção dos equipamentos, com cartões que
podem ser arrastados manualmente entre colunas — a coluna em que o cartão
está representa o status atual da manutenção.

- **Colunas fixas**: Entrada, Diagnóstico, Orçamento, Manutenção, Finalizado,
  Aguardando Coleta, Coletado (cada uma com contador de cartões no cabeçalho).
  O `supabase/schema.sql` reseeda exatamente essas 7 colunas toda vez que
  roda (e remove qualquer coluna fora dessa lista) — não existe mais botão
  "Adicionar outra coluna" na UI nem rota para criar coluna. Cada coluna tem
  uma cor fixa própria, usada como etiqueta no cartão (chip colorido com o
  nome da coluna).
- **Cartões**: chip de etiqueta (cor da coluna), nome do cliente + número,
  borda esquerda colorida conforme o **SLA** (verde = Padrão, laranja =
  Importante, vermelho = Urgente — não confundir com a cor da etiqueta, são
  duas informações independentes), prazo (Data Chegada - Data Vencimento),
  contadores de comentários (reais, ver abaixo) e anexos (mock), e avatar com
  as iniciais do técnico responsável (quando já atribuído).
- **SLA calculado pelo prazo**: o prazo de manutenção é de **10 dias úteis**
  a partir da Data Chegada (`PRAZO_DIAS_UTEIS` em `laboratorioRepository.js`).
  O SLA (verde/laranja/vermelho, tanto na borda do cartão quanto no chip de
  prazo) é recalculado a cada carregamento a partir dessa data de vencimento:
  vermelho (Urgente) se já venceu, laranja (Importante) se faltam 2 dias úteis
  ou menos, verde (Padrão) caso contrário. Cartões que já chegaram em
  Finalizado/Aguardando Coleta/Coletado sempre aparecem como Padrão — a
  manutenção em si já foi concluída, só falta a coleta pelo cliente.
- **Arrastar e soltar**: feito com a API nativa de drag-and-drop do HTML5
  (sem biblioteca). Ao soltar um cartão em outra coluna, o movimento é
  confirmado no servidor via `PATCH /api/laboratorio/:id/mover` — diferente
  da maioria das outras ações do protótipo (Salvar, Aprovar/Reprovar), aqui
  o estado é persistido de verdade no Supabase, então o cartão continua na
  coluna certa mesmo depois de recarregar a página ou reiniciar o servidor.
- **Detalhes do cartão**: clicar em qualquer cartão (sem arrastar) abre um
  modal com as informações do atendimento (Equipamento, WMS, Defeito,
  Requisição, Laudo Técnico, Data Chegada, Data Manutenção Fin., Data Saída,
  Drive, Técnico) e a coluna atual pode ser trocada por um seletor no topo
  do modal (mesmo efeito do drag-and-drop). Ao lado, uma aba de
  **Comentários e atividade**: o técnico pode escrever um comentário interno
  (`POST /api/laboratorio/:id/comentarios`), e toda movimentação de coluna
  gera automaticamente uma entrada de sistema ("Fulano moveu este cartão de X
  para Y") — igual ao histórico de atividades do Trello, mais recente primeiro.
- **Adicionar cartão**: botão "+ Adicionar um cartão" no rodapé de cada
  coluna abre um campo de texto; ao confirmar, cria um cartão via
  `POST /api/laboratorio` (nome do cliente, sem técnico/dados de atendimento
  customizados — pode ser editado depois se o backend real permitir).
- **Excluir coluna**: o menu "⋮" no cabeçalho de cada coluna ainda tem a
  opção "Excluir coluna" (`DELETE /api/laboratorio/colunas/:id`) — só
  funciona se a coluna estiver vazia; se tiver cartões, recusa com um aviso
  pedindo para mover ou excluir os cartões antes. Na prática as 7 colunas se
  comportam como fixas (o schema as recria a cada setup), mas o botão/rota de
  exclusão em si continua funcional para quem esvaziar uma coluna de
  propósito. Não há mais como criar uma coluna nova pela UI.

## Wiki (`wiki.html` + `novo-wiki-artigo.html` + `novo-wiki-grupo.html`)

Base de conhecimento técnico da Área Técnica — artigos de solução para
problemas recorrentes (ex.: "alinhamento de câmera", "PSN", "teflon",
"SignMaster"), organizados por grupo.

- **Lista** (`wiki.html`): busca por palavra-chave no título/conteúdo do
  artigo, filtro por grupo, botões **"Nova Wiki"** e **"Novo Grupo"**.
- **Criação de artigo** (`novo-wiki-artigo.html`): título, conteúdo e grupo
  (`GET/POST /api/wiki`). Não existe tela de edição nem `GET` por id — só
  criação e listagem.
- **Criação de grupo** (`novo-wiki-grupo.html`): cadastro simples de grupo
  (`GET/POST /api/wiki-grupos`), mesmo padrão de Grupos de Produtos.
- Repositórios: `src/data/wikiRepository.js` e `src/data/wikiGruposRepository.js`.

## HelpDesk (`helpdesk.html`)

Chat interno com clientes, acessado pelo menu Área Técnica em uma **nova
aba** (`target="_blank"`, diferente do restante do menu).

- Lista de conversas (`GET /api/helpdesk/conversas`) com status
  (aberta/encerrada) e prévia da última mensagem.
- Ao abrir uma conversa, carrega a thread completa de mensagens, cada uma com
  autor `cliente` ou `atendente`. Enviar uma mensagem nova
  (`POST /api/helpdesk/conversas/:id/mensagens`) sempre grava com autor fixo
  `atendente` — não há troca de atendente real, é o único usuário logado do
  protótipo.
- Repositório: `src/data/helpdeskRepository.js`.

## Requisições (`requisicoes.html` + `nova-requisicao.html`)

Módulo do ícone de carrinho (Vendas) da sidebar, separado da Área Técnica.
Réplica funcional da tela "Requisição" do ERP real (lista + criação), com
persistência real em `src/data/requisicoesRepository.js` — igual ao padrão já
usado no Laboratório, diferente do resto do protótipo.

- **Lista (`requisicoes.html`)**: barra de busca (por número, funcionário ou
  número do atendimento vinculado — `GET /api/requisicoes?busca=`) e botão
  **"+"** que abre `nova-requisicao.html`. Tabela com Ped (badge azul, igual
  ao padrão já usado em Instalações), Data, Funcionário, Atendimento
  Vinculado e Valor Total.
- **Criação (`nova-requisicao.html`)**: Data de Emissão, busca de
  **Funcionário** (autocomplete sobre `/api/tecnicos`, mesma lista de nomes
  reaproveitada do módulo de Atendimentos), e o campo pedido explicitamente
  pelo usuário — **Atendimento Vinculado** (opcional): autocomplete que busca
  em **qualquer** atendimento (não só Remoto, diferente do vínculo usado no
  Atendimento Laboratório) via `GET /api/atendimentos?busca=`, digitando o
  número. Abaixo, uma seção de **Produtos**: busca por descrição
  (`GET /api/requisicoes/produtos?q=`, mock de peças de reposição com valor
  unitário), quantidade e valor editáveis, botão "Adicionar" que soma um item
  a uma tabela local com Valor Total calculado. Ao clicar em **Confirmar**,
  grava a requisição de verdade (`POST /api/requisicoes`) e volta para a
  lista.
- **Edição**: o menu "⋮" de cada linha da lista tem a opção **Editar**, que
  abre `nova-requisicao.html?id=<id>`. Os dados são carregados via
  `GET /api/requisicoes/:id` (funcionário, atendimento vinculado, itens,
  observação) com todos os campos editáveis — pode trocar o funcionário, o
  vínculo, adicionar/remover produtos e alterar a observação. Confirmar
  grava via `PUT /api/requisicoes/:id` (em vez do `POST` usado na criação).

## Estrutura

```
server.js                          # Express app + servidor estático
src/
  data/
    supabaseClient.js               # client Supabase compartilhado (SUPABASE_URL/SERVICE_ROLE_KEY do .env)
    atendimentosRepository.js       # atendimentos — tabela `atendimentos`
    clientesRepository.js           # clientes — tabela `clientes`
    catalogoRepository.js           # catálogo de equipamentos/modelos/WMS — tabelas `catalogo_*`
    instalacoesRepository.js        # instalações — tabela `instalacoes`
    laboratorioRepository.js        # quadro Kanban — tabelas `laboratorio_colunas`/`laboratorio_cards`
    requisicoesRepository.js        # requisições — tabela `requisicoes`
    tecnicosRepository.js           # técnicos internos — tabela `tecnicos`
    tecnicosTerceirizadosRepository.js  # técnicos terceirizados — tabela `tecnicos_terceirizados`
    produtosRepository.js           # produtos — tabela `produtos`
    gruposProdutoRepository.js      # grupos de produto — tabela `grupos_produto`
    wikiRepository.js               # artigos da wiki — tabela `wiki_artigos`
    wikiGruposRepository.js         # grupos da wiki — tabela `wiki_grupos`
    helpdeskRepository.js           # conversas/mensagens — tabelas `helpdesk_conversas`/`helpdesk_mensagens`
    wmsRepository.js                # rastreamento de números de série — tabela `wms_unidades`
    funcionariosRepository.js       # funcionários — tabela `funcionarios`
    cargosSalariosRepository.js     # cargos e salários — tabela `cargos_salarios`
    veiculosRepository.js           # veículos da frota — tabela `veiculos`
    frotaViagensRepository.js       # viagens/uso de veículo — tabela `frota_viagens`
  services/
    dashboardService.js            # agregações (resumo mensal, ranking por técnico)
  routes/
    api.routes.js                  # endpoints REST
public/
  styles.css                        # estilos compartilhados (sidebar, cards, tabelas, tema claro/escuro)
  login.html, login.css, login.js    # tela de login (proteção de demonstração)
  index.html, app.js                 # Dashboard de métricas
  atendimentos.html, atendimentos.css, atendimentos.js   # lista de atendimentos (abas Remoto/Presencial/Laboratório)
  novo-atendimento.html, atendimento-form.css, atendimento-form.js   # fluxo de criação/edição
  imprimir.html                      # documento de impressão/PDF
  instalacoes.html, instalacoes.css, instalacoes.js   # lista de instalações
  instalacao-detalhes.html, instalacao-detalhes.js    # detalhe + checklist de aprovação
  laboratorio.html, laboratorio.css, laboratorio.js   # quadro Kanban de manutenção
  wiki.html, wiki.css, wiki.js                        # base de conhecimento técnico
  novo-wiki-artigo.html, novo-wiki-artigo.css, novo-wiki-artigo.js   # criação de artigo da wiki
  novo-wiki-grupo.html, novo-wiki-grupo.css, novo-wiki-grupo.js      # criação de grupo da wiki
  helpdesk.html, helpdesk.css, helpdesk.js            # chat interno com clientes
  requisicoes.html, requisicoes.css, requisicoes.js   # lista de requisições (módulo Vendas)
  nova-requisicao.html, nova-requisicao.css, nova-requisicao.js   # criação/consulta de requisição
  clientes.html, clientes.css, clientes.js            # lista de clientes (módulo Cadastro)
  novo-cliente.html, novo-cliente.css, novo-cliente.js   # criação de cliente
  tecnicos-terceirizados.html, tecnicos-terceirizados.css, tecnicos-terceirizados.js   # lista de técnicos terceirizados
  novo-tecnico-terceirizado.html, novo-tecnico-terceirizado.css, novo-tecnico-terceirizado.js   # criação de técnico terceirizado
  produtos.html, produtos.css, produtos.js            # lista de produtos (módulo Cadastro)
  novo-produto.html, novo-produto.css, novo-produto.js   # criação/edição de produto
  wms.html, wms.css, wms.js                           # rastreamento de números de série por lote
  novo-wms.html, novo-wms.js                          # registro de novo lote WMS
  funcionarios.html, funcionarios.css, funcionarios.js   # lista de funcionários
  novo-funcionario.html, novo-funcionario.css, novo-funcionario.js   # criação/edição de funcionário
  cargos-salarios.html, cargos-salarios.css, cargos-salarios.js   # lista de cargos e salários
  novo-cargo-salario.html, novo-cargo-salario.css, novo-cargo-salario.js   # criação/edição de cargo
  jetia-config.js, jetia-widget.js                    # widget de pergunta em linguagem natural (JET-IA)
  sheets-config.js, sheets-source.js                  # dashboards por categoria alimentados por Google Sheets
  app/                                # saída de build do Vite (gitignored, ver seção React abaixo)
web/                                  # código-fonte do app React + TypeScript (ver seção abaixo)
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx, App.tsx
    styles.css                        # re-exporta public/styles.css (@import)
    types.ts                          # tipos TS dos payloads da API
    api.ts                            # client fetch tipado
    components/
      Sidebar.tsx, Header.tsx, RequireAuth.tsx, Toast.tsx, RowActionsMenu.tsx
    routes/
      GruposProduto/
        Lista.tsx, Formulario.tsx, icon.tsx
      Frota/
        Veiculos/
          Lista.tsx, Formulario.tsx, icon.tsx
        Viagens/
          Lista.tsx, Formulario.tsx, icon.tsx
```

## Migração para React + TypeScript

Decisão tomada com o Erick (2026-08-05): sair do HTML estático + JS vanilla
para **React + TypeScript**, migrando **tela por tela** — o app continua
funcionando o tempo todo durante a transição; módulos ainda não migrados
seguem em HTML/JS puro até que chegue a vez deles. **Grupos de Produtos** é
o primeiro módulo migrado, e serve de receita para os próximos.

### Onde fica o código novo

- `web/` — código-fonte TypeScript/React (Vite + `react-router-dom`),
  separado de `src/` (backend Express) e de `public/` (páginas ainda não
  migradas). Ver árvore completa na seção "Estrutura" acima.
- Build de produção sai em `public/app/` (gitignored) — dentro da pasta que
  o Express já serve via `express.static`, então nenhuma mudança nessa
  linha do servidor foi necessária.
- `server.js` ganhou uma rota de fallback SPA (`app.get('/app/*', ...)`)
  depois do `express.static`: qualquer deep-link/refresh em `/app/...` serve
  o `index.html` do React, e o `react-router-dom` assume o roteamento no
  cliente.

### Como rodar em desenvolvimento

Dois processos em paralelo:

```bash
npm run dev       # Express na porta 3300
npm run dev:web   # Vite na porta 5173, com proxy de /api pro Express
```

Acesse `http://localhost:5173/app/grupos-produto` (o Vite respeita o
`base: '/app/'` também em dev, pra ficar consistente com produção).

### Como buildar para produção

```bash
npm run build:web   # gera public/app/
npm start           # só Express, serve tudo (páginas antigas + app React)
```

Acesse `http://localhost:3300/app/grupos-produto`.

### O padrão de migração por módulo (receita)

Grupos de Produtos seguiu estes passos — repita para o próximo módulo:

1. Ler o HTML/JS/CSS atuais do módulo pra entender campos, rotas de API e
   comportamento exato (toasts, validações, menu de ações) antes de portar.
2. Tipos em `web/src/types.ts` e funções de API tipadas em `web/src/api.ts`
   (fetch simples — sem React Query/Redux, hooks bastam pro tamanho atual).
3. Componentes de tela em `web/src/routes/<Modulo>/` reaproveitando
   `<Sidebar>`, `<Header>`, `<RowActionsMenu>` e `useToast()` de
   `web/src/components/` — não recrie sidebar/header/menu de ações do zero.
4. Registrar as rotas novas em `web/src/App.tsx`.
5. No `<Sidebar>` (`web/src/components/Sidebar.tsx`), trocar o `<a href="...">`
   do módulo migrado por um `<Link to="...">`, e adicionar o novo id ao tipo
   `ItemAtivo`.
6. Atualizar o link correspondente do sidebar nas páginas HTML que **ainda
   não** migraram (sed em lote, já que o bloco do sidebar é idêntico entre
   arquivos — ex.: `sed -i '' 's|href="X.html"|href="/app/X"|' *.html`).
7. Remover os arquivos `.html`/`.js`/`.css` antigos do módulo — não ficam
   paralelos ao React (mesma lição do `api-shim.js`: duas implementações da
   mesma lógica divergem silenciosamente).
8. Testar: dev (Vite + Express), build de produção servido só pelo Express,
   deep-link/refresh numa rota do módulo, e que as páginas ainda estáticas
   continuam navegando corretamente para o módulo migrado.

### Módulos já migrados

- [x] Grupos de Produtos (`/app/grupos-produto`)
- [x] Controle de Frota — Veículos (`/app/frota/veiculos`) e Viagens de Frota
  (`/app/frota/viagens`) — nasceu direto em React, sem versão HTML/JS
  anterior (ver seção "Controle de Frota" acima)

Todos os demais continuam em HTML/JS (Atendimentos, Dashboard, Instalações,
Laboratório, JET-IA, HelpDesk, Requisições, Clientes, Técnicos
Terceirizados, Produtos, WMS, Funcionários, Cargos e Salários).

## Como integrar no ERP real

Hoje os dados já são reais (Postgres via Supabase, ver seção acima), mas
ainda é a base de demonstração deste protótipo, não o banco definitivo do
ERP. Para plugar no banco de verdade, troque o corpo das funções de
`src/data/atendimentosRepository.js` (`listAtendimentos`, `listMesesDisponiveis`,
`buscarAtendimentoPorId`, `criarAtendimento`) por consultas ao banco real,
mantendo a mesma assinatura e formato de retorno — o resto do projeto
(rotas, `dashboardService`, front-end) não precisa mudar. O mesmo vale para
os demais `src/data/*Repository.js`, cada um isolando o acesso a uma
tabela/entidade.

Cada atendimento deve ter este formato (os campos `equipamento`, `modelo`,
`wms`, `ida`, `volta` e `laudoTecnico` foram adicionados para alimentar as
telas de edição/impressão — `wms` é a lista de nºs de série/WMS vinculados
ao modelo escolhido, `ida`/`volta` no formato `datetime-local`
`YYYY-MM-DDTHH:mm`):

```js
{
  id: 21023,
  numero: "21023",
  dtEmissao: "2026-07-14",       // formato YYYY-MM-DD
  clienteId: 3,                  // referência ao cadastro de clientes
  cliente: "Nome Fantasia",       // string exibida nas listas/busca
  defeito: "Descrição do problema",
  laudoTecnico: "Laudo preenchido ao concluir/cancelar (vazio se em aberto)",
  tecnico: "Nome do Técnico",
  equipamento: "Plotter de Recorte",
  modelo: "Campro C24",
  wms: ["17058338725 - PLOTTER DE RECORTE CAMPRO C24 - ... - WMS - Compra: 03/07/2026"],
  ida: "2026-07-14T09:00",
  volta: "2026-07-14T11:00",
  tipo: "Remoto" | "Presencial",
  status: "Em Atendimento" | "Concluido" | "Cancelado",
}
```

### Sobre o status "Cancelado"

**Já implementado** (era uma sugestão nesta seção, hoje reflete o schema
real): os 3 estados — `Em Atendimento` (aberto), `Concluido` e `Cancelado` —
estão consolidados numa única coluna `status` na tabela `atendimentos`
(`supabase/schema.sql`, com `check` constraint), em vez de inferidos a partir
de campos separados. Ver definição completa da tabela em
`supabase/schema.sql`.
