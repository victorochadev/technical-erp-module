// Cadastro de técnicos internos (quadro próprio, usado em Atendimentos,
// Laboratório e Instalações). Dados vêm da tabela `funcionarios` no Supabase —
// todo funcionário cadastrado em Cadastro > Funcionários fica disponível
// aqui para seleção como técnico Bannerjet.

const supabase = require('./supabaseClient')

async function listTecnicos() {
  const { data, error } = await supabase.from('funcionarios').select('nome').order('nome')
  if (error) throw error
  return data.map(r => r.nome)
}

module.exports = { listTecnicos }
