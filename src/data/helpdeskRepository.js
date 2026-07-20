// Camada de acesso a dados do HelpDesk (chat interno com clientes).
// Dados vêm das tabelas `helpdesk_conversas` e `helpdesk_mensagens` no Supabase.

const supabase = require('./supabaseClient')

function mapConversa(row) {
  return {
    id: row.id,
    clienteNome: row.cliente_nome,
    telefone: row.telefone || '',
    status: row.status,
    ultimaMensagem: row.helpdesk_mensagens && row.helpdesk_mensagens.length
      ? row.helpdesk_mensagens[row.helpdesk_mensagens.length - 1].texto
      : '',
    ultimaMensagemEm: row.helpdesk_mensagens && row.helpdesk_mensagens.length
      ? row.helpdesk_mensagens[row.helpdesk_mensagens.length - 1].created_at
      : row.created_at,
  }
}

function mapMensagem(row) {
  return { id: row.id, conversaId: row.conversa_id, autor: row.autor, texto: row.texto, criadaEm: row.created_at }
}

async function listConversas() {
  const { data, error } = await supabase
    .from('helpdesk_conversas')
    .select('*, helpdesk_mensagens(texto, created_at)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
    .map(mapConversa)
    .sort((a, b) => new Date(b.ultimaMensagemEm) - new Date(a.ultimaMensagemEm))
}

async function listMensagens(conversaId) {
  const { data, error } = await supabase
    .from('helpdesk_mensagens')
    .select('*')
    .eq('conversa_id', Number(conversaId))
    .order('created_at')
  if (error) throw error
  return data.map(mapMensagem)
}

async function enviarMensagem(conversaId, texto) {
  const { data, error } = await supabase
    .from('helpdesk_mensagens')
    .insert({ conversa_id: Number(conversaId), autor: 'atendente', texto })
    .select()
    .single()
  if (error) throw error
  return mapMensagem(data)
}

module.exports = { listConversas, listMensagens, enviarMensagem }
