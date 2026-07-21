// Camada de acesso a dados dos clientes.
// Dados vêm da tabela `clientes` no Supabase (ver supabase/schema.sql).

const supabase = require('./supabaseClient')

function mapCliente(row) {
  return {
    id: row.id,
    razaoSocial: row.razao_social,
    nomeFantasia: row.nome_fantasia,
    cnpj: row.cnpj,
    ie: row.ie,
    endereco: row.endereco,
    cep: row.cep,
    bairro: row.bairro,
    cidade: row.cidade,
    complemento: row.complemento,
    contato: row.contato,
    telefone: row.telefone,
    celular: row.celular,
    email: row.email,
    site: row.site,
  }
}

async function fetchTodosClientes() {
  const { data, error } = await supabase.from('clientes').select('*')
  if (error) throw error
  return data.map(mapCliente)
}

async function buscarClientesPorNome(query) {
  if (!query || query.trim().length < 2) return []
  const alvo = query.toLowerCase()
  const clientes = await fetchTodosClientes()
  return clientes
    .filter(c =>
      c.razaoSocial.toLowerCase().includes(alvo) ||
      c.nomeFantasia.toLowerCase().includes(alvo) ||
      c.cnpj.includes(alvo)
    )
    .slice(0, 15)
}

async function buscarClientePorId(id) {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', Number(id)).maybeSingle()
  if (error) throw error
  return data ? mapCliente(data) : null
}

async function listClientes({ busca } = {}) {
  const clientes = await fetchTodosClientes()
  return clientes.sort((a, b) => a.nomeFantasia.localeCompare(b.nomeFantasia)).filter(c => {
    if (!busca) return true
    const alvo = busca.toLowerCase()
    return `${c.razaoSocial} ${c.nomeFantasia} ${c.cnpj} ${c.cidade}`.toLowerCase().includes(alvo)
  })
}

async function criarCliente(dados) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      razao_social: dados.razaoSocial || '',
      nome_fantasia: dados.nomeFantasia || dados.razaoSocial || '',
      cnpj: dados.cnpj || '',
      ie: dados.ie || '',
      endereco: dados.endereco || '',
      cep: dados.cep || '',
      bairro: dados.bairro || '',
      cidade: dados.cidade || '',
      complemento: dados.complemento || '',
      contato: dados.contato || '',
      telefone: dados.telefone || '',
      celular: dados.celular || '',
      email: dados.email || '',
      site: dados.site || '',
    })
    .select()
    .single()
  if (error) throw error
  return mapCliente(data)
}

async function atualizarCliente(id, dados) {
  const { data, error } = await supabase
    .from('clientes')
    .update({
      razao_social: dados.razaoSocial || '',
      nome_fantasia: dados.nomeFantasia || dados.razaoSocial || '',
      cnpj: dados.cnpj || '',
      ie: dados.ie || '',
      endereco: dados.endereco || '',
      cep: dados.cep || '',
      bairro: dados.bairro || '',
      cidade: dados.cidade || '',
      complemento: dados.complemento || '',
      contato: dados.contato || '',
      telefone: dados.telefone || '',
      celular: dados.celular || '',
      email: dados.email || '',
      site: dados.site || '',
    })
    .eq('id', Number(id))
    .select()
    .maybeSingle()
  if (error) throw error
  return data ? mapCliente(data) : null
}

async function excluirCliente(id) {
  const { data, error } = await supabase
    .from('clientes')
    .delete()
    .eq('id', Number(id))
    .select('id')
    .maybeSingle()
  if (error) throw error
  return Boolean(data)
}

module.exports = { buscarClientesPorNome, buscarClientePorId, listClientes, criarCliente, atualizarCliente, excluirCliente }
