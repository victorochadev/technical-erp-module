// Cadastro de técnicos internos (quadro próprio, usado em Atendimentos,
// Laboratório e Instalações). Dados vêm da tabela `tecnicos` no Supabase.

const supabase = require('./supabaseClient')

async function listTecnicos() {
  const { data, error } = await supabase.from('tecnicos').select('nome').order('nome')
  if (error) throw error
  return data.map(r => r.nome)
}

module.exports = { listTecnicos }
