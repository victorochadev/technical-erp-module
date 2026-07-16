// Camada de acesso a dados dos atendimentos técnicos.
// Dados vêm da tabela `atendimentos` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapAtendimento(row) {
  return {
    id: row.id,
    numero: row.numero,
    dtEmissao: row.dt_emissao,
    clienteId: row.cliente_id,
    cliente: row.cliente_nome,
    defeito: row.defeito || '',
    laudoTecnico: row.laudo_tecnico || '',
    tecnico: row.tecnico_nome || '',
    equipamento: row.equipamento || '',
    modelo: row.modelo || '',
    wms: row.wms || [],
    ida: row.ida ? row.ida.slice(0, 16) : '',
    volta: row.volta ? row.volta.slice(0, 16) : '',
    tipo: row.tipo,
    status: row.status,
    requisicao: row.requisicao || '',
    atendimentoOrigemId: row.atendimento_origem_id,
  }
}

async function listAtendimentos({ mes, tecnico, tipo, status, busca, clienteId } = {}) {
  let query = supabase.from('atendimentos').select('*')
  if (mes) {
    const [ano, mesNum] = mes.split('-').map(Number)
    const inicio = `${mes}-01`
    const fimData = new Date(ano, mesNum, 1)
    const fim = fimData.toISOString().slice(0, 10)
    query = query.gte('dt_emissao', inicio).lt('dt_emissao', fim)
  }
  if (tecnico) query = query.eq('tecnico_nome', tecnico)
  if (tipo) query = query.eq('tipo', tipo)
  if (status) query = query.eq('status', status)
  if (clienteId) query = query.eq('cliente_id', Number(clienteId))

  const { data, error } = await query
  if (error) throw error
  let atendimentos = data.map(mapAtendimento)

  if (busca) {
    const alvo = busca.toLowerCase()
    atendimentos = atendimentos.filter(a => {
      const combinado = `${a.numero} ${a.cliente} ${a.defeito} ${a.tecnico}`.toLowerCase()
      return combinado.includes(alvo)
    })
  }

  return atendimentos
}

async function proximoNumero() {
  const { data, error } = await supabase.from('atendimentos').select('numero')
  if (error) throw error
  const maior = data.reduce((max, r) => Math.max(max, Number(r.numero) || 0), 0)
  return maior + 1
}

async function criarAtendimento(dados) {
  const numero = String(await proximoNumero())

  const { data, error } = await supabase
    .from('atendimentos')
    .insert({
      numero,
      dt_emissao: dados.dtEmissao || new Date().toISOString().slice(0, 10),
      cliente_id: dados.clienteId || null,
      cliente_nome: dados.cliente || '',
      defeito: dados.defeito || '',
      laudo_tecnico: dados.laudoTecnico || '',
      tecnico_nome: dados.tecnico || '',
      equipamento: dados.equipamento || '',
      modelo: dados.modelo || '',
      wms: dados.wms || [],
      ida: dados.ida || null,
      volta: dados.volta || null,
      tipo: dados.tipo,
      status: dados.status || 'Em Atendimento',
      requisicao: dados.requisicao || '',
      atendimento_origem_id: dados.atendimentoOrigemId || null,
    })
    .select()
    .single()
  if (error) throw error
  return mapAtendimento(data)
}

async function listMesesDisponiveis() {
  const { data, error } = await supabase.from('atendimentos').select('dt_emissao')
  if (error) throw error
  return [...new Set(data.map(r => r.dt_emissao.slice(0, 7)))].sort().reverse()
}

async function buscarAtendimentoPorId(id) {
  const { data, error } = await supabase.from('atendimentos').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapAtendimento(data) : null
}

module.exports = { listAtendimentos, listMesesDisponiveis, buscarAtendimentoPorId, criarAtendimento }
