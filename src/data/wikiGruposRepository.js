const supabase = require('./supabaseClient')

function mapGrupo(row) {
  return { id: row.id, nome: row.nome }
}

async function listWikiGrupos() {
  const { data, error } = await supabase.from('wiki_grupos').select('*').order('nome')
  if (error) throw error
  return data.map(mapGrupo)
}

async function criarWikiGrupo(dados) {
  const { data, error } = await supabase
    .from('wiki_grupos')
    .insert({ nome: dados.nome || '' })
    .select()
    .single()
  if (error) throw error
  return mapGrupo(data)
}

module.exports = { listWikiGrupos, criarWikiGrupo }
