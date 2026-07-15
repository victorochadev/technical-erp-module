// Camada de acesso a dados dos atendimentos técnicos.
//
// >>> PONTO DE INTEGRAÇÃO <<<
// Hoje os dados vêm de um array em memória (mock). Para plugar no ERP real,
// troque o corpo das funções abaixo por consultas ao banco (MySQL/Postgres/etc),
// mantendo a mesma assinatura e o mesmo formato de retorno — o resto da
// aplicação (services, rotas, dashboard) não precisa mudar.
//
// Sugestão de schema real (adaptar ao banco do ERP):
//
// CREATE TABLE atendimentos_tecnicos (
//   id            INT PRIMARY KEY AUTO_INCREMENT,
//   numero        VARCHAR(20) NOT NULL UNIQUE,
//   dt_emissao    DATE NOT NULL,
//   cliente_id    INT NOT NULL,
//   defeito       TEXT,
//   tecnico_id    INT,
//   tipo          ENUM('Remoto', 'Presencial', 'Laboratório') NOT NULL,
//   status        ENUM('Em Atendimento', 'Concluido', 'Cancelado') NOT NULL DEFAULT 'Em Atendimento',
//   created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
//   updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
//   FOREIGN KEY (cliente_id) REFERENCES clientes(id),
//   FOREIGN KEY (tecnico_id) REFERENCES tecnicos(id)
// );

const { generateMockAtendimentos } = require('./mockAtendimentos')

const ATENDIMENTOS = generateMockAtendimentos()

async function listAtendimentos({ mes, tecnico, tipo, status, busca, clienteId } = {}) {
  return ATENDIMENTOS.filter(a => {
    if (mes && !a.dtEmissao.startsWith(mes)) return false
    if (tecnico && a.tecnico !== tecnico) return false
    if (tipo && a.tipo !== tipo) return false
    if (status && a.status !== status) return false
    if (clienteId && String(a.clienteId) !== String(clienteId)) return false
    if (busca) {
      const alvo = busca.toLowerCase()
      const combinado = `${a.numero} ${a.cliente} ${a.defeito} ${a.tecnico}`.toLowerCase()
      if (!combinado.includes(alvo)) return false
    }
    return true
  })
}

// Cria um novo atendimento (usado hoje só pelo fluxo de criação do tipo
// Laboratório, que precisa aparecer de fato na lista e gerar o cartão
// correspondente no quadro Laboratório — ver POST /api/atendimentos).
async function criarAtendimento(dados) {
  const maiorNumero = ATENDIMENTOS.reduce((max, a) => Math.max(max, Number(a.numero) || 0), 0)
  const numero = maiorNumero + 1

  const novo = {
    id: numero,
    numero: String(numero),
    dtEmissao: dados.dtEmissao || new Date().toISOString().slice(0, 10),
    clienteId: dados.clienteId,
    cliente: dados.cliente,
    defeito: dados.defeito || '',
    laudoTecnico: dados.laudoTecnico || '',
    tecnico: dados.tecnico || '',
    equipamento: dados.equipamento || '',
    modelo: dados.modelo || '',
    wms: dados.wms || [],
    ida: dados.ida || '',
    volta: dados.volta || '',
    tipo: dados.tipo,
    status: dados.status || 'Em Atendimento',
    requisicao: dados.requisicao || '',
    atendimentoOrigemId: dados.atendimentoOrigemId || null,
  }
  ATENDIMENTOS.push(novo)
  return novo
}

async function listTecnicos() {
  return [...new Set(ATENDIMENTOS.map(a => a.tecnico))].sort()
}

async function listMesesDisponiveis() {
  return [...new Set(ATENDIMENTOS.map(a => a.dtEmissao.slice(0, 7)))].sort().reverse()
}

async function buscarAtendimentoPorId(id) {
  return ATENDIMENTOS.find(a => a.id === Number(id)) || null
}

module.exports = { listAtendimentos, listTecnicos, listMesesDisponiveis, buscarAtendimentoPorId, criarAtendimento }
