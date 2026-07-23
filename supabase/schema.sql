-- Schema do módulo técnico (ERP Bannerjet/BM1-BJControl) para Supabase.
-- Rode este arquivo inteiro no SQL Editor do seu projeto Supabase.
-- Ordem: tabelas -> RLS -> seed de dados mestres.

-- =========================================================
-- TABELAS
-- =========================================================

create table if not exists clientes (
  id bigint generated always as identity primary key,
  razao_social text not null,
  nome_fantasia text,
  cnpj text,
  ie text,
  endereco text,
  bairro text,
  cep text,
  cidade text,
  complemento text,
  contato text,
  telefone text,
  celular text,
  email text,
  site text,
  created_at timestamptz not null default now()
);

create table if not exists tecnicos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists tecnicos_terceirizados (
  id bigint generated always as identity primary key,
  nome text not null,
  empresa text,
  especialidade text,
  telefone text,
  email text,
  cidade text,
  created_at timestamptz not null default now()
);

create table if not exists catalogo_equipamentos (
  id bigint generated always as identity primary key,
  nome text not null unique
);

create table if not exists catalogo_modelos (
  id bigint generated always as identity primary key,
  equipamento_id bigint not null references catalogo_equipamentos(id) on delete cascade,
  nome text not null
);

create table if not exists catalogo_wms (
  id bigint generated always as identity primary key,
  modelo_id bigint not null references catalogo_modelos(id) on delete cascade,
  descricao text not null
);

create table if not exists atendimentos (
  id bigint generated always as identity primary key,
  numero text not null unique,
  dt_emissao date not null,
  cliente_id bigint references clientes(id),
  cliente_nome text,
  defeito text,
  laudo_tecnico text,
  tecnico_id bigint references tecnicos(id),
  tecnico_nome text,
  equipamento text,
  modelo text,
  wms jsonb not null default '[]'::jsonb,
  ida timestamptz,
  volta timestamptz,
  tipo text not null check (tipo in ('Remoto', 'Presencial', 'Laboratório')),
  status text not null default 'Em Atendimento' check (status in ('Em Atendimento', 'Concluido', 'Cancelado')),
  requisicao text,
  atendimento_origem_id bigint references atendimentos(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists instalacoes (
  id bigint generated always as identity primary key,
  pedido_compra bigint not null unique,
  pedido_despesas bigint,
  cliente jsonb not null,
  tecnico_id bigint references tecnicos(id),
  tecnico_nome text,
  status_cliente jsonb,
  status_tecnico jsonb,
  transportadora text,
  produtos jsonb not null default '[]'::jsonb,
  custos jsonb not null default '[]'::jsonb,
  checklist jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists laboratorio_colunas (
  id text primary key,
  nome text not null,
  cor text not null,
  ordem int not null default 0
);

create table if not exists laboratorio_cards (
  id bigint generated always as identity primary key,
  numero bigint not null,
  cliente text,
  coluna_id text references laboratorio_colunas(id),
  data_chegada date,
  data_vencimento date,
  anexos int not null default 0,
  tecnico_id bigint references tecnicos(id),
  tecnico_nome text,
  equipamento text,
  modelo text,
  wms text,
  defeito text,
  requisicao text,
  laudo_tecnico text,
  data_manutencao_fin date,
  data_saida date,
  drive text,
  atendimento_origem_id bigint references atendimentos(id),
  timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists requisicoes (
  id bigint generated always as identity primary key,
  numero text not null unique,
  dt_emissao date not null,
  funcionario text,
  itens jsonb not null default '[]'::jsonb,
  valor_total numeric(12, 2) not null default 0,
  atendimento_vinculado_id bigint references atendimentos(id),
  observacao text,
  created_at timestamptz not null default now()
);

create table if not exists produtos (
  id bigint generated always as identity primary key,
  nome text not null,
  valor numeric(12, 2) not null default 0,
  valor_avista numeric(12, 2) not null default 0,
  controla_estoque boolean not null default false,
  grupo_1 text,
  grupo_2 text,
  ncm text,
  juros numeric(5, 2) not null default 0,
  imagem text,
  created_at timestamptz not null default now()
);

create table if not exists grupos_produto (
  id bigint generated always as identity primary key,
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists wiki_grupos (
  id bigint generated always as identity primary key,
  nome text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists wiki_artigos (
  id bigint generated always as identity primary key,
  titulo text not null,
  conteudo text not null,
  grupo_id bigint references wiki_grupos(id),
  created_at timestamptz not null default now()
);

create table if not exists helpdesk_conversas (
  id bigint generated always as identity primary key,
  cliente_nome text not null,
  telefone text,
  status text not null default 'aberta' check (status in ('aberta', 'encerrada')),
  created_at timestamptz not null default now()
);

create table if not exists helpdesk_mensagens (
  id bigint generated always as identity primary key,
  conversa_id bigint not null references helpdesk_conversas(id) on delete cascade,
  autor text not null check (autor in ('cliente', 'atendente')),
  texto text not null,
  created_at timestamptz not null default now()
);

-- =========================================================
-- ROW LEVEL SECURITY
-- Protótipo interno sem Supabase Auth: libera leitura/escrita para a
-- chave anon, para o front-end estático poder falar direto com o banco.
-- Não use este modelo de policy em produção com dados sensíveis reais.
-- =========================================================

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'clientes', 'tecnicos', 'tecnicos_terceirizados',
      'catalogo_equipamentos', 'catalogo_modelos', 'catalogo_wms',
      'atendimentos', 'instalacoes', 'laboratorio_colunas', 'laboratorio_cards',
      'requisicoes', 'produtos', 'grupos_produto', 'wiki_artigos', 'wiki_grupos',
      'helpdesk_conversas', 'helpdesk_mensagens', 'jet_ia_historico', 'jet_ia_erros'
    ])
  loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists anon_all on %I;', t);
    execute format(
      'create policy anon_all on %I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;

-- =========================================================
-- SEED — dados mestres (clientes, técnicos, catálogo, colunas do laboratório,
-- técnicos terceirizados e as requisições reais já existentes no protótipo).
-- Atendimentos/instalações/cards do laboratório NÃO são semeados aqui por
-- serem massa de dados fictícia gerada aleatoriamente no mock atual —
-- o app pode recriá-los à vontade após conectar ao Supabase.
-- =========================================================

insert into clientes (razao_social, nome_fantasia, cnpj, ie, endereco, bairro, cep, cidade, complemento, contato, telefone, celular, email, site) values
('60.098.486 Rayanne Carolina Diniz Nascimento Da Silva', '60.098.486 Rayanne Carolina Diniz Nascimento Da Silva', '60.098.486/0001-74', '084949171', 'Rua Santa Bárbara, 154', 'Centro', '29143-322', 'Cariacica - ES', '', '', '(27) 9858-4158', '', 'rayanne@taglike.com.br', ''),
('Oficina do Letreiro Comunicacao Visual Ltda', 'Oficina do Letreiro', '12.345.678/0001-90', '110223344', 'Av. Presidente Vargas, 980', 'Centro', '15015-000', 'São José do Rio Preto - SP', '', 'Marcos Vieira', '(17) 3212-4455', '(17) 99812-3344', 'contato@oficinadoletreiro.com.br', ''),
('Beetle Press Ltda', 'Beetle Press', '23.456.789/0001-11', '220334455', 'Rua das Indústrias, 45', 'Distrito Industrial', '81290-000', 'Curitiba - PR', 'Galpão 3', '', '(41) 3022-9981', '', 'financeiro@beetlepress.com.br', 'https://beetlepress.com.br'),
('Grafica Central Ltda', 'Grafica Central', '34.567.890/0001-22', '330445566', 'Rua XV de Novembro, 220', 'Centro', '89010-001', 'Blumenau - SC', '', '', '(47) 3323-1010', '', 'atendimento@graficacentral.com.br', ''),
('Ponto Digital Informatica Ltda', 'Ponto Digital', '45.678.901/0001-33', '440556677', 'Av. Goiás, 1500', 'Setor Central', '74005-010', 'Goiânia - GO', 'Sala 12', 'Fernanda Alves', '(62) 3241-7788', '(62) 99841-2200', 'suporte@pontodigital.com.br', ''),
('Imagine Graphics Impressao Digital Ltda', 'Imagine Graphics', '56.789.012/0001-44', '550667788', 'Rua Voluntários da Pátria, 88', 'Centro', '01139-000', 'São Paulo - SP', '', '', '(11) 3299-6677', '', 'contato@imaginegraphics.com.br', 'https://imaginegraphics.com.br'),
('Estamparia Textil De Ideias Ltda', 'Textil De Ideias', '67.890.123/0001-55', '660778899', 'Rua Amazonas, 310', 'Vila Nova', '15025-070', 'São José do Rio Preto - SP', '', '', '(17) 3234-5566', '', 'vendas@textildeideias.com.br', ''),
('Exato Rio Preto Comunicacao Visual Ltda', 'Exato Rio Preto', '78.901.234/0001-66', '770889900', 'Av. Alberto Andaló, 3300', 'Centro', '15015-000', 'São José do Rio Preto - SP', '', '', '(17) 3235-8899', '', 'atendimento@exatoriopreto.com.br', ''),
('C R Da Silva Impressoes Ltda', 'C R Impressões', '89.012.345/0001-77', '880990011', 'Rua Barão do Rio Branco, 512', 'Centro', '80010-180', 'Curitiba - PR', '', '', '(41) 3324-6655', '', 'crsilva@impressoes.com.br', ''),
('Fontes Crisostomo Comercio De Materiais Graficos Ltda', 'Fontes Crisostomo', '90.123.456/0001-88', '990001122', 'Rua João Pessoa, 77', 'Centro', '89010-090', 'Blumenau - SC', '', '', '(47) 3324-1122', '', 'compras@fontescrisostomo.com.br', ''),
('Alice Agape Comunicacao Visual Ltda', 'Alice Agape', '11.222.333/0001-99', '111222333', 'Rua das Palmeiras, 12', 'Centro', '74815-010', 'Goiânia - GO', '', '', '(62) 3245-9900', '', 'alice@agape.com.br', ''),
('We Love Fashion Estamparia Ltda', 'We Love Fashion', '22.333.444/0001-10', '222333444', 'Av. Brasil, 900', 'Jardim América', '15025-100', 'São José do Rio Preto - SP', '', '', '(17) 3236-4400', '', 'contato@welovefashion.com.br', ''),
('Maxi Copy Solucoes Digitais Ltda', 'Maxi Copy', '33.444.555/0001-21', '333444555', 'Rua Sete de Setembro, 240', 'Centro', '80020-120', 'Curitiba - PR', '', '', '(41) 3325-3300', '', 'maxicopy@solucoesdigitais.com.br', ''),
('Kw Estampas Ltda', 'Kw Estampas', '44.555.666/0001-32', '444555666', 'Rua Dois de Setembro, 65', 'Centro', '89010-040', 'Blumenau - SC', '', '', '(47) 3326-7700', '', 'kw@estampas.com.br', ''),
('Calich Grafica Digital Ltda', 'Calich Grafica Digital', '55.666.777/0001-43', '555666777', 'Av. T-7, 800', 'Setor Bueno', '74210-030', 'Goiânia - GO', '', '', '(62) 3247-1188', '', 'calich@graficadigital.com.br', ''),
('Crystal Águas', 'Crystal Águas', '222.222.222/0001-22', '', 'Rua das Amoras, 22', 'Vila Esperança', '02020-000', 'São Paulo - SP', '', '', '', '', '', ''),
('Claude No-Code', 'Claude No-Code', '111.111.111/0002-11', '', 'Rua dos Pinhões, 13', 'Vila do Nunca', '03045-000', 'São Paulo - SP', '', '', '', '', '', ''),
('Franco Carmélio Nunes', 'Franco Carmélio Nunes', '222.222.222-45', '', 'Rua Tancredo Neves Araújo, 45', 'Parque Edu Claudio', '03020-000', 'São Paulo - SP', '', '', '', '', '', '');

insert into tecnicos (nome) values
('Arthur Henrique Garcia Orcy'),
('Artur Diego Pereira Ferreira dos Santos'),
('Beatriz Guimaraes Gonçalves'),
('Brenno Santos e Silva'),
('Caio Henrique dos Santos'),
('Carlos Henrique Juren Dias'),
('Danilo Stivali Gonçalves'),
('Diego Fernandes'),
('Eduardo Correia da Costa'),
('Edvaldo Caetano da Silva'),
('Elvis Kuester'),
('Erick Alexandre Dantas Ribeiro'),
('Fabio Conti Barreto'),
('Ricardo Domingos Silva'),
('Igor Sanches dos Santos'),
('Lucas Honorato da Cruz'),
('Gabriel Leonardo Tomio'),
('Wylliam Pierre Oliveira Almeida Silva'),
('Nathan Christian Mateus'),
('Vitor Gustavo Campos')
on conflict (nome) do nothing;

insert into tecnicos_terceirizados (nome, empresa, especialidade, telefone, email, cidade) values
('Rogério Nunes Baptista', 'RNB Assistência Técnica', 'Plotters de recorte', '(17) 99123-4455', 'rogerio@rnbassistencia.com.br', 'São José do Rio Preto - SP'),
('Patrícia Helena Moraes', 'PHM Manutenção Gráfica', 'Impressoras digitais UV', '(41) 99234-5566', 'patricia@phmmanutencao.com.br', 'Curitiba - PR'),
('Wagner de Souza Prado', 'Prado Serviços Técnicos', 'Termolaminadoras', '(47) 99345-6677', 'wagner@pradoservicos.com.br', 'Blumenau - SC'),
('Camila Rezende Torres', 'CRT Eletrônica Industrial', 'Mesas de corte', '(62) 99456-7788', 'camila@crteletronica.com.br', 'Goiânia - GO'),
('Adriano Ferreira Lopes', 'AFL Assistência Técnica', 'Prensas térmicas', '(11) 99567-8899', 'adriano@aflassistencia.com.br', 'São Paulo - SP');

insert into catalogo_equipamentos (nome) values
('Plotter de Recorte'),
('Plotter de Impressão e Recorte'),
('Impressora Digital UV'),
('Laminadora'),
('Termolaminadora'),
('Mesa de Corte'),
('Prensa Térmica')
on conflict (nome) do nothing;

insert into catalogo_modelos (equipamento_id, nome)
select id, m.nome from catalogo_equipamentos, (values
  ('Plotter de Recorte', 'Campro C16'),
  ('Plotter de Recorte', 'Campro C24'),
  ('Plotter de Recorte', 'Campro C34'),
  ('Plotter de Recorte', 'Campro C60'),
  ('Plotter de Recorte', 'Silhouette Cameo 4'),
  ('Plotter de Recorte', 'Roland GS-24'),
  ('Plotter de Impressão e Recorte', 'Roland VersaCAMM SV-540'),
  ('Plotter de Impressão e Recorte', 'Mimaki CJV150-160'),
  ('Plotter de Impressão e Recorte', 'HP Latex 700'),
  ('Impressora Digital UV', 'Roland VersaUV LEF2-200'),
  ('Impressora Digital UV', 'Mimaki UJF-3042'),
  ('Laminadora', 'GMP Excelam II 1600'),
  ('Laminadora', 'Vivid Lamipacker 1600'),
  ('Termolaminadora', 'GMP Photon 65'),
  ('Termolaminadora', 'Ledco Sprint 65'),
  ('Mesa de Corte', 'Zund G3 L-2500'),
  ('Mesa de Corte', 'Summa F1612'),
  ('Prensa Térmica', 'Metalnox Digital 40x60'),
  ('Prensa Térmica', 'Transtherm TT-4060')
) as m(equipamento, nome)
where catalogo_equipamentos.nome = m.equipamento;

insert into catalogo_wms (modelo_id, descricao)
select cm.id, w.descricao
from catalogo_modelos cm
join (values
  ('Campro C16', '17058338701 - PLOTTER DE RECORTE CAMPRO C16 - LIGHT 0,40cm - WMS - Compra: 12/05/2026'),
  ('Campro C24', '17058338725 - PLOTTER DE RECORTE CAMPRO C24 - LIGHT 0,60cm - WMS - Compra: 03/07/2026'),
  ('Campro C24', '17058338726 - PLOTTER DE RECORTE CAMPRO C24 - LIGHT 0,60cm - WMS - Compra: 18/06/2026'),
  ('Campro C34', '17058338740 - PLOTTER DE RECORTE CAMPRO C34 - LIGHT 0,90cm - WMS - Compra: 22/06/2026'),
  ('Campro C60', '17058338760 - PLOTTER DE RECORTE CAMPRO C60 - LIGHT 1,60cm - WMS - Compra: 05/06/2026'),
  ('Silhouette Cameo 4', '17058339010 - PLOTTER DE RECORTE SILHOUETTE CAMEO 4 - WMS - Compra: 14/06/2026'),
  ('Roland GS-24', '17058339050 - PLOTTER DE RECORTE ROLAND GS-24 - WMS - Compra: 09/06/2026'),
  ('Roland VersaCAMM SV-540', '17058340010 - PLOTTER IMPRESSAO E RECORTE ROLAND SV-540 - WMS - Compra: 28/05/2026'),
  ('Mimaki CJV150-160', '17058340030 - PLOTTER IMPRESSAO E RECORTE MIMAKI CJV150-160 - WMS - Compra: 30/06/2026'),
  ('HP Latex 700', '17058340050 - PLOTTER IMPRESSAO E RECORTE HP LATEX 700 - WMS - Compra: 07/07/2026'),
  ('Roland VersaUV LEF2-200', '17058341010 - IMPRESSORA UV ROLAND LEF2-200 - WMS - Compra: 15/06/2026'),
  ('Mimaki UJF-3042', '17058341030 - IMPRESSORA UV MIMAKI UJF-3042 - WMS - Compra: 01/07/2026'),
  ('GMP Excelam II 1600', '17058342010 - LAMINADORA GMP EXCELAM II 1600 - WMS - Compra: 20/05/2026'),
  ('Vivid Lamipacker 1600', '17058342030 - LAMINADORA VIVID LAMIPACKER 1600 - WMS - Compra: 11/06/2026'),
  ('GMP Photon 65', '17058343010 - TERMOLAMINADORA GMP PHOTON 65 - WMS - Compra: 25/06/2026'),
  ('Ledco Sprint 65', '17058343030 - TERMOLAMINADORA LEDCO SPRINT 65 - WMS - Compra: 02/07/2026'),
  ('Zund G3 L-2500', '17058344010 - MESA DE CORTE ZUND G3 L-2500 - WMS - Compra: 08/06/2026'),
  ('Summa F1612', '17058344030 - MESA DE CORTE SUMMA F1612 - WMS - Compra: 19/06/2026'),
  ('Metalnox Digital 40x60', '17058345010 - PRENSA TERMICA METALNOX DIGITAL 40X60 - WMS - Compra: 27/05/2026'),
  ('Transtherm TT-4060', '17058345030 - PRENSA TERMICA TRANSTHERM TT-4060 - WMS - Compra: 30/05/2026')
) as w(modelo, descricao) on cm.nome = w.modelo;

-- Colunas fixas do quadro do Laboratório — a UI não permite mais criar colunas
-- novas, então esta é a lista definitiva (ver public/laboratorio.js).
insert into laboratorio_colunas (id, nome, cor, ordem) values
('entrada', 'Entrada', '#3b82f6', 1),
('diagnostico', 'Diagnóstico', '#06b6d4', 2),
('orcamento', 'Orçamento', '#8b5cf6', 3),
('manutencao', 'Manutenção', '#f59e0b', 4),
('finalizado', 'Finalizado', '#22c55e', 5),
('aguardando-coleta', 'Aguardando Coleta', '#eab308', 6),
('coletado', 'Coletado', '#ec4899', 7)
on conflict (id) do update set nome = excluded.nome, cor = excluded.cor, ordem = excluded.ordem;

delete from laboratorio_colunas where id not in ('entrada', 'diagnostico', 'orcamento', 'manutencao', 'finalizado', 'aguardando-coleta', 'coletado');

insert into requisicoes (numero, dt_emissao, funcionario, itens, valor_total, atendimento_vinculado_id, observacao) values
('6959', '2026-07-10', 'Ricardo Domingos Silva', '[{"descricao":"Motor de Passo Eixo Y","qtd":1,"valorUnit":420,"valorTotal":420},{"descricao":"Correia de Transmissão Eixo X","qtd":6.48,"valorUnit":145,"valorTotal":940}]', 1360, null, ''),
('6960', '2026-07-13', 'Danilo Stivali Gonçalves', '[{"descricao":"Placa Controladora Principal","qtd":1.33,"valorUnit":1290,"valorTotal":1720}]', 1720, null, ''),
('6961', '2026-07-13', 'Igor Sanches dos Santos', '[{"descricao":"Cabeçote de Impressão HP Latex","qtd":1.31,"valorUnit":2850,"valorTotal":3725}]', 3725, null, ''),
('6962', '2026-07-13', 'Ricardo Domingos Silva', '[{"descricao":"Fusível de Proteção 10A","qtd":1,"valorUnit":18,"valorTotal":18},{"descricao":"Kit de Limpeza de Cabeçote","qtd":5.13,"valorUnit":45,"valorTotal":231.33}]', 249.33, null, ''),
('6963', '2026-07-13', 'Ricardo Domingos Silva', '[{"descricao":"Placa Controladora Principal","qtd":0.76,"valorUnit":1290,"valorTotal":985}]', 985, null, ''),
('6964', '2026-07-13', 'Ricardo Domingos Silva', '[]', 0, null, 'Requisição cancelada — peça já reposta em atendimento anterior.'),
('6965', '2026-07-14', 'Ricardo Domingos Silva', '[{"descricao":"Rolete de Tração de Mídia","qtd":3.16,"valorUnit":95,"valorTotal":300}]', 300, null, ''),
('6966', '2026-07-14', 'Matheus Henrique Agostinho da Silva Fernandes', '[{"descricao":"Sensor de Marca de Registro","qtd":3.48,"valorUnit":210,"valorTotal":730}]', 730, null, ''),
('6967', '2026-07-14', 'Marcio José Alves', '[{"descricao":"Cabo Flat de Cabeçote","qtd":4.12,"valorUnit":60,"valorTotal":247}]', 247, null, ''),
('6968', '2026-07-14', 'Felipe da Silva Wosgrau Pinheiro', '[{"descricao":"Fonte de Alimentação 24V","qtd":1.42,"valorUnit":380,"valorTotal":540}]', 540, null, '')
on conflict (numero) do nothing;

-- wiki_grupos / wiki_artigos ficam sem seed — a base de conhecimento (JET-IA)
-- é populada manualmente pela própria interface.

do $$
declare
  conversa record;
  conversa_id bigint;
begin
  if (select count(*) from helpdesk_conversas) = 0 then
    for conversa in
      select * from (values
        ('Oficina do Letreiro', '(17) 99812-3344'),
        ('Beetle Press', '(41) 99123-5566'),
        ('Ponto Digital', '(62) 99841-2200'),
        ('Crystal Águas', '(11) 98765-4321'),
        ('Franco Carmélio Nunes', '(11) 91234-5678')
      ) as c(cliente_nome, telefone)
    loop
      insert into helpdesk_conversas (cliente_nome, telefone) values (conversa.cliente_nome, conversa.telefone) returning id into conversa_id;

      if conversa.cliente_nome = 'Oficina do Letreiro' then
        insert into helpdesk_mensagens (conversa_id, autor, texto) values
        (conversa_id, 'cliente', 'Boa tarde! A plotter aqui parou de reconhecer o material, aparece "erro de sensor".'),
        (conversa_id, 'atendente', 'Boa tarde, Marcos! Pode me confirmar o modelo da máquina e enviar uma foto do painel de erro?'),
        (conversa_id, 'cliente', 'É a Roland GS-24. Já te mando a foto.'),
        (conversa_id, 'atendente', 'Perfeito, recebido. Vou verificar o histórico do equipamento e já te retorno com o próximo passo.');
      elsif conversa.cliente_nome = 'Beetle Press' then
        insert into helpdesk_mensagens (conversa_id, autor, texto) values
        (conversa_id, 'cliente', 'Oi, bom dia. Preciso de suporte para calibrar as cores da nossa impressora UV.'),
        (conversa_id, 'atendente', 'Bom dia! Você já tentou rodar o perfil ICC padrão de fábrica?'),
        (conversa_id, 'cliente', 'Ainda não, vou tentar e te aviso o resultado.');
      elsif conversa.cliente_nome = 'Ponto Digital' then
        insert into helpdesk_mensagens (conversa_id, autor, texto) values
        (conversa_id, 'cliente', 'Olá! Vocês têm previsão de quando a peça da requisição 6965 chega?'),
        (conversa_id, 'atendente', 'Oi, Fernanda! Deixa eu confirmar com o setor de compras e te retorno ainda hoje.');
      elsif conversa.cliente_nome = 'Crystal Águas' then
        insert into helpdesk_mensagens (conversa_id, autor, texto) values
        (conversa_id, 'cliente', 'A laminadora está fazendo um barulho estranho no rolo de tração.'),
        (conversa_id, 'atendente', 'Entendido. Pode gravar um vídeo curto do barulho e enviar por aqui? Ajuda bastante no diagnóstico.'),
        (conversa_id, 'cliente', 'Consigo sim, te mando em instantes.');
      elsif conversa.cliente_nome = 'Franco Carmélio Nunes' then
        insert into helpdesk_mensagens (conversa_id, autor, texto) values
        (conversa_id, 'cliente', 'Bom dia, o programa SignMaster não está abrindo depois da atualização do Windows.'),
        (conversa_id, 'atendente', 'Bom dia! Vamos reinstalar a versão compatível. Você tem acesso remoto disponível agora?');
      end if;
    end loop;
  end if;
end $$;
