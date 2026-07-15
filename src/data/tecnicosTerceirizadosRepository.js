// Cadastro de técnicos terceirizados (prestadores externos, fora do quadro
// interno de técnicos usado em Atendimentos/Laboratório).
// >>> PONTO DE INTEGRAÇÃO <<<: trocar por consulta ao cadastro de fornecedores/
// prestadores de serviço do ERP.

const TECNICOS_TERCEIRIZADOS = [
  { id: 1, nome: 'Rogério Nunes Baptista', empresa: 'RNB Assistência Técnica', especialidade: 'Plotters de recorte', telefone: '(17) 99123-4455', email: 'rogerio@rnbassistencia.com.br', cidade: 'São José do Rio Preto - SP' },
  { id: 2, nome: 'Patrícia Helena Moraes', empresa: 'PHM Manutenção Gráfica', especialidade: 'Impressoras digitais UV', telefone: '(41) 99234-5566', email: 'patricia@phmmanutencao.com.br', cidade: 'Curitiba - PR' },
  { id: 3, nome: 'Wagner de Souza Prado', empresa: 'Prado Serviços Técnicos', especialidade: 'Termolaminadoras', telefone: '(47) 99345-6677', email: 'wagner@pradoservicos.com.br', cidade: 'Blumenau - SC' },
  { id: 4, nome: 'Camila Rezende Torres', empresa: 'CRT Eletrônica Industrial', especialidade: 'Mesas de corte', telefone: '(62) 99456-7788', email: 'camila@crteletronica.com.br', cidade: 'Goiânia - GO' },
  { id: 5, nome: 'Adriano Ferreira Lopes', empresa: 'AFL Assistência Técnica', especialidade: 'Prensas térmicas', telefone: '(11) 99567-8899', email: 'adriano@aflassistencia.com.br', cidade: 'São Paulo - SP' },
]

async function listTecnicosTerceirizados({ busca } = {}) {
  return [...TECNICOS_TERCEIRIZADOS].sort((a, b) => a.nome.localeCompare(b.nome)).filter(t => {
    if (!busca) return true
    const alvo = busca.toLowerCase()
    return `${t.nome} ${t.empresa} ${t.especialidade} ${t.cidade}`.toLowerCase().includes(alvo)
  })
}

async function buscarTecnicoTerceirizadoPorId(id) {
  return TECNICOS_TERCEIRIZADOS.find(t => t.id === Number(id)) || null
}

async function criarTecnicoTerceirizado(dados) {
  const maiorId = TECNICOS_TERCEIRIZADOS.reduce((max, t) => Math.max(max, t.id), 0)
  const novo = {
    id: maiorId + 1,
    nome: dados.nome || '',
    empresa: dados.empresa || '',
    especialidade: dados.especialidade || '',
    telefone: dados.telefone || '',
    email: dados.email || '',
    cidade: dados.cidade || '',
  }
  TECNICOS_TERCEIRIZADOS.push(novo)
  return novo
}

module.exports = { listTecnicosTerceirizados, buscarTecnicoTerceirizadoPorId, criarTecnicoTerceirizado }
