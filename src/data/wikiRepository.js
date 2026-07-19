// Camada de acesso a dados da Wiki (base de conhecimento técnico).
// Dados vêm da tabela `wiki_artigos` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapArtigo(row) {
  return { id: row.id, titulo: row.titulo, conteudo: row.conteudo }
}

async function listWikiArtigos({ busca } = {}) {
  const { data, error } = await supabase.from('wiki_artigos').select('*').order('titulo')
  if (error) throw error
  const artigos = data.map(mapArtigo)
  if (!busca) return artigos
  const alvo = busca.toLowerCase()
  return artigos.filter(a => a.titulo.toLowerCase().includes(alvo) || a.conteudo.toLowerCase().includes(alvo))
}

module.exports = { listWikiArtigos }
