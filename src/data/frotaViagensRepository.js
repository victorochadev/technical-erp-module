// Camada de acesso a dados das viagens da frota (uso de veículo por técnico).
// Dados vêm da tabela `frota_viagens` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')
const veiculosRepo = require('./veiculosRepository')

const SELECT_COM_VINCULOS = '*, veiculos:veiculo_id(placa, modelo), atendimentos:atendimento_id(numero)'

function mapFrotaViagem(row) {
  const kmSaida = Number(row.km_saida)
  const kmChegada = row.km_chegada !== null ? Number(row.km_chegada) : null
  return {
    id: row.id,
    veiculoId: row.veiculo_id,
    veiculoPlaca: row.veiculos ? row.veiculos.placa : '',
    veiculoModelo: row.veiculos ? row.veiculos.modelo : '',
    tecnico: row.tecnico_nome || '',
    atendimentoId: row.atendimento_id,
    atendimentoNumero: row.atendimentos ? row.atendimentos.numero : null,
    finalidade: row.finalidade || '',
    kmSaida,
    kmChegada,
    kmRodado: kmChegada !== null ? kmChegada - kmSaida : null,
    dataSaida: row.data_saida,
    dataChegada: row.data_chegada,
    observacoes: row.observacoes || '',
  }
}

async function listFrotaViagens({ busca, veiculoId } = {}) {
  let query = supabase.from('frota_viagens').select(SELECT_COM_VINCULOS).order('data_saida', { ascending: false })
  if (veiculoId) query = query.eq('veiculo_id', Number(veiculoId))
  const { data, error } = await query
  if (error) throw error
  const viagens = data.map(mapFrotaViagem)
  if (!busca) return viagens
  const alvo = busca.toLowerCase()
  return viagens.filter(v => `${v.veiculoPlaca} ${v.veiculoModelo} ${v.tecnico} ${v.finalidade}`.toLowerCase().includes(alvo))
}

async function buscarFrotaViagemPorId(id) {
  const { data, error } = await supabase.from('frota_viagens').select(SELECT_COM_VINCULOS).eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapFrotaViagem(data) : null
}

async function criarFrotaViagem(dados) {
  const { data, error } = await supabase
    .from('frota_viagens')
    .insert({
      veiculo_id: Number(dados.veiculoId),
      tecnico_nome: dados.tecnico || '',
      atendimento_id: dados.atendimentoId || null,
      finalidade: dados.finalidade || '',
      km_saida: dados.kmSaida || 0,
      data_saida: dados.dataSaida || new Date().toISOString(),
      observacoes: dados.observacoes || '',
    })
    .select(SELECT_COM_VINCULOS)
    .single()
  if (error) throw error
  return mapFrotaViagem(data)
}

async function atualizarFrotaViagem(id, dados) {
  const patch = {}
  if (dados.veiculoId !== undefined) patch.veiculo_id = Number(dados.veiculoId)
  if (dados.tecnico !== undefined) patch.tecnico_nome = dados.tecnico
  if (dados.atendimentoId !== undefined) patch.atendimento_id = dados.atendimentoId || null
  if (dados.finalidade !== undefined) patch.finalidade = dados.finalidade
  if (dados.kmSaida !== undefined) patch.km_saida = dados.kmSaida
  if (dados.kmChegada !== undefined) patch.km_chegada = dados.kmChegada
  if (dados.dataChegada !== undefined) patch.data_chegada = dados.dataChegada
  if (dados.observacoes !== undefined) patch.observacoes = dados.observacoes

  const { data, error } = await supabase
    .from('frota_viagens')
    .update(patch)
    .eq('id', Number(id))
    .select(SELECT_COM_VINCULOS)
    .maybeSingle()
  if (error) throw error
  if (!data) return null

  if (dados.kmChegada !== undefined && dados.kmChegada !== null) {
    const veiculo = await veiculosRepo.buscarVeiculoPorId(data.veiculo_id)
    if (veiculo && Number(dados.kmChegada) > veiculo.kmAtual) {
      await veiculosRepo.atualizarVeiculo(data.veiculo_id, { ...veiculo, kmAtual: Number(dados.kmChegada) })
    }
  }

  return mapFrotaViagem(data)
}

module.exports = { listFrotaViagens, buscarFrotaViagemPorId, criarFrotaViagem, atualizarFrotaViagem }
