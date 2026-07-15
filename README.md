# Módulo de Dashboard — Área Técnica (Atendimentos)

Protótipo em Node.js/Express para o dashboard de métricas de atendimentos técnicos,
para servir de referência ao programador do ERP BM1/BJControl integrar o módulo real.

## Como rodar

```bash
npm install
npm start
```

Acesse `http://localhost:3300`. Os dados são **fictícios** (gerados em memória,
ver `src/data/mockAtendimentos.js`), cobrindo maio, junho e julho de 2026.

Telas no protótipo, navegáveis pelo menu lateral:

- `atendimentos.html` — **Atendimentos**, com abas Remoto/Presencial (tela inicial do módulo Área Técnica)
- `index.html` — **Dashboard** de métricas (Área Técnica)
- `novo-atendimento.html` — **Novo Atendimento** (fluxo de criação/edição, Área Técnica)
- `instalacoes.html` — **Instalações**, lista de pedidos de venda com instalação técnica pendente
- `instalacao-detalhes.html` — detalhe de uma instalação, com checklist de aprovação de fotos

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

## Menu lateral (sidebar)

Réplica da barra lateral de ícones do ERP real. Ao passar o mouse sobre o
ícone de chave (Área Técnica) abre um flyout com os submódulos:
Atendimentos, Instalações, Visitas/Amostra, Laboratório, Wiki e Dashboard.
Só **Atendimentos** e **Dashboard** são funcionais neste protótipo — os
demais são placeholders (`href="#"`) e os rótulos são inferidos a partir do
ícone, não confirmados com o ERP real. O ícone de carrinho (Vendas) também
tem flyout, com um único item funcional: **Requisições** (ver seção abaixo).
Os outros ícones da barra (aprovações, painel geral, perfil, clientes,
produtos, ajuda) são só visuais.

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

- **Colunas**: Entrada, Fila, Orçamento, Manutenção, Testes, Finalizado,
  Aguardando Coleta, Coletado (cada uma com contador de cartões no cabeçalho).
  Cada coluna tem uma cor fixa própria, e essa cor é usada como etiqueta no
  cartão (a etiqueta = a coluna atual do cartão, exibida como um chip colorido
  com o nome da coluna).
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
  o estado é persistido no repositório em memória, então o cartão continua
  na coluna certa mesmo depois de recarregar a página.
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
- **Criar/excluir colunas**: botão "+ Adicionar outra coluna" ao final do
  quadro cria uma coluna nova (`POST /api/laboratorio/colunas`, cor atribuída
  automaticamente de uma paleta fixa). O menu "⋮" no cabeçalho de cada coluna
  tem a opção "Excluir coluna" (`DELETE /api/laboratorio/colunas/:id`) — só
  funciona se a coluna estiver vazia; se tiver cartões, mostra um aviso
  pedindo para mover ou excluir os cartões antes.

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
    mockAtendimentos.js            # gerador dos dados fictícios (dashboard)
    atendimentosRepository.js       # >>> PONTO DE INTEGRAÇÃO COM O BANCO REAL <<<
    clientesRepository.js           # mock de clientes (busca por razão social/CNPJ)
    catalogoRepository.js           # mock de equipamentos/modelos/WMS
    instalacoesRepository.js        # mock de instalações (pedidos, produtos, custos, checklist)
    laboratorioRepository.js        # mock do quadro Kanban (cartões, colunas, mover, criar)
    requisicoesRepository.js        # mock de requisições (produtos, criar, buscar por vínculo)
  services/
    dashboardService.js            # agregações (resumo mensal, ranking por técnico)
  routes/
    api.routes.js                  # endpoints REST
public/
  styles.css                        # estilos compartilhados (sidebar, cards, tabelas, tema claro/escuro)
  index.html, app.js                 # Dashboard de métricas
  atendimentos.html, atendimentos.css, atendimentos.js   # lista de atendimentos (abas Remoto/Presencial)
  novo-atendimento.html, atendimento-form.css, atendimento-form.js   # fluxo de criação/edição
  imprimir.html                      # documento de impressão/PDF
  instalacoes.html, instalacoes.css, instalacoes.js   # lista de instalações
  instalacao-detalhes.html, instalacao-detalhes.js    # detalhe + checklist de aprovação
  laboratorio.html, laboratorio.css, laboratorio.js   # quadro Kanban de manutenção
  requisicoes.html, requisicoes.css, requisicoes.js   # lista de requisições (módulo Vendas)
  nova-requisicao.html, nova-requisicao.css, nova-requisicao.js   # criação/consulta de requisição
```

## Como integrar no ERP real

O único arquivo que precisa mudar é `src/data/atendimentosRepository.js`.
Hoje ele filtra um array em memória; troque o corpo das quatro funções
(`listAtendimentos`, `listTecnicos`, `listMesesDisponiveis`,
`buscarAtendimentoPorId`) por consultas reais ao banco do ERP, mantendo a
mesma assinatura e formato de retorno — nada mais no projeto precisa ser
alterado.

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

A tela atual do ERP (calendário da Área Técnica) só distingue visualmente
"Finalizado" e "Atendimento" — mas o preenchimento manual (menu de ações
"⋮" no card do atendimento) já permite marcar como **Concluído** ou
**Cancelado**. Sugerimos consolidar esses 3 estados em uma única coluna
`status` no banco (`Em Atendimento` = aberto, `Concluido` = finalizado,
`Cancelado`), em vez de inferir o status a partir de campos separados.

Sugestão de schema SQL (adaptar ao banco já usado pelo ERP):

```sql
CREATE TABLE atendimentos_tecnicos (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  numero        VARCHAR(20) NOT NULL UNIQUE,
  dt_emissao    DATE NOT NULL,
  cliente_id    INT NOT NULL,
  defeito       TEXT,
  tecnico_id    INT,
  tipo          ENUM('Remoto', 'Presencial') NOT NULL,
  status        ENUM('Em Atendimento', 'Concluido', 'Cancelado') NOT NULL DEFAULT 'Em Atendimento',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id),
  FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id)
);
```
