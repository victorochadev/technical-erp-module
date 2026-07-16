// Camada de acesso ao catálogo de equipamentos/modelos/WMS.
// Dados vêm das tabelas catalogo_equipamentos / catalogo_modelos / catalogo_wms
// no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

async function buscarEquipamentos(query) {
  if (!query || query.trim().length < 1) return []
  const { data, error } = await supabase
    .from('catalogo_equipamentos')
    .select('nome')
    .ilike('nome', `%${query}%`)
    .limit(10)
  if (error) throw error
  return data.map(r => r.nome)
}

async function buscarModelos(query) {
  if (!query || query.trim().length < 1) return []
  const { data, error } = await supabase
    .from('catalogo_modelos')
    .select('nome, catalogo_equipamentos(nome), catalogo_wms(descricao)')
    .ilike('nome', `%${query}%`)
    .limit(10)
  if (error) throw error
  return data.map(m => ({
    equipamento: m.catalogo_equipamentos.nome,
    modelo: m.nome,
    wms: m.catalogo_wms.map(w => w.descricao),
  }))
}

// Usado apenas pelo script de seed (scripts/seedSupabaseData.js) para gerar
// atendimentos/instalações/cards de demonstração a partir do catálogo real.
async function listCatalogoCompleto() {
  const { data, error } = await supabase
    .from('catalogo_equipamentos')
    .select('nome, catalogo_modelos(nome, catalogo_wms(descricao))')
  if (error) throw error
  return data.map(eq => ({
    equipamento: eq.nome,
    modelos: eq.catalogo_modelos.map(m => ({
      modelo: m.nome,
      wms: m.catalogo_wms.map(w => w.descricao),
    })),
  }))
}

module.exports = { buscarEquipamentos, buscarModelos, listCatalogoCompleto }
