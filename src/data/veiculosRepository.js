// Camada de acesso a dados dos veículos da frota.
// Dados vêm da tabela `veiculos` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapVeiculo(row) {
  const kmAtual = Number(row.km_atual)
  const manutencaoKmPrevista = row.manutencao_km_prevista !== null ? Number(row.manutencao_km_prevista) : null
  return {
    id: row.id,
    placa: row.placa,
    marca: row.marca || '',
    modelo: row.modelo,
    ano: row.ano || '',
    categoria: row.categoria || '',
    combustivel: row.combustivel || '',
    kmAtual,
    manutencaoKmPrevista,
    manutencaoDataPrevista: row.manutencao_data_prevista || '',
    manutencaoDescricao: row.manutencao_descricao || '',
    manutencaoPendente: manutencaoKmPrevista !== null && kmAtual >= manutencaoKmPrevista,
  }
}

async function listVeiculos({ busca } = {}) {
  const { data, error } = await supabase.from('veiculos').select('*').order('placa')
  if (error) throw error
  const veiculos = data.map(mapVeiculo)
  if (!busca) return veiculos
  const alvo = busca.toLowerCase()
  return veiculos.filter(v => `${v.placa} ${v.marca} ${v.modelo}`.toLowerCase().includes(alvo))
}

async function buscarVeiculoPorId(id) {
  const { data, error } = await supabase.from('veiculos').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapVeiculo(data) : null
}

async function criarVeiculo(dados) {
  const { data, error } = await supabase
    .from('veiculos')
    .insert({
      placa: dados.placa || '',
      marca: dados.marca || null,
      modelo: dados.modelo || '',
      ano: dados.ano || null,
      categoria: dados.categoria || null,
      combustivel: dados.combustivel || null,
      km_atual: dados.kmAtual || 0,
      manutencao_km_prevista: dados.manutencaoKmPrevista || null,
      manutencao_data_prevista: dados.manutencaoDataPrevista || null,
      manutencao_descricao: dados.manutencaoDescricao || null,
    })
    .select()
    .single()
  if (error) throw error
  return mapVeiculo(data)
}

async function atualizarVeiculo(id, dados) {
  const { data, error } = await supabase
    .from('veiculos')
    .update({
      placa: dados.placa || '',
      marca: dados.marca || null,
      modelo: dados.modelo || '',
      ano: dados.ano || null,
      categoria: dados.categoria || null,
      combustivel: dados.combustivel || null,
      km_atual: dados.kmAtual || 0,
      manutencao_km_prevista: dados.manutencaoKmPrevista || null,
      manutencao_data_prevista: dados.manutencaoDataPrevista || null,
      manutencao_descricao: dados.manutencaoDescricao || null,
    })
    .eq('id', Number(id))
    .select()
    .maybeSingle()
  if (error) throw error
  return data ? mapVeiculo(data) : null
}

module.exports = { listVeiculos, buscarVeiculoPorId, criarVeiculo, atualizarVeiculo }
