// Camada de acesso a dados da Wiki (base de conhecimento técnico).
// Dados vêm da tabela `wiki_artigos` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapArtigo(row) {
  return { id: row.id, titulo: row.titulo, conteudo: row.conteudo, grupoId: row.grupo_id }
}

async function listWikiArtigos({ busca, grupoId } = {}) {
  const { data, error } = await supabase.from('wiki_artigos').select('*').order('titulo')
  if (error) throw error
  let artigos = data.map(mapArtigo)
  if (grupoId) artigos = artigos.filter(a => a.grupoId === Number(grupoId))
  if (!busca) return artigos
  const alvo = busca.toLowerCase()
  return artigos.filter(a => a.titulo.toLowerCase().includes(alvo) || a.conteudo.toLowerCase().includes(alvo))
}

async function criarWikiArtigo(dados) {
  const { data, error } = await supabase
    .from('wiki_artigos')
    .insert({ titulo: dados.titulo || '', conteudo: dados.conteudo || '', grupo_id: dados.grupoId || null })
    .select()
    .single()
  if (error) throw error
  return mapArtigo(data)
}

module.exports = { listWikiArtigos, criarWikiArtigo }
