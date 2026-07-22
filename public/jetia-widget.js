function jetiaFormatarResposta(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

async function jetiaPerguntar() {
  const input = document.getElementById('wiki-busca')
  const pergunta = input.value.trim()

  const container = document.getElementById('jetia-resposta')
  const loading = document.getElementById('jetia-loading')
  const erro = document.getElementById('jetia-erro')
  const texto = document.getElementById('jetia-texto')

  if (!pergunta) {
    container.hidden = false
    loading.hidden = true
    texto.hidden = true
    erro.hidden = false
    erro.textContent = 'Digite uma pergunta antes de perguntar à JET-IA.'
    return
  }

  const config = window.JETIA_CONFIG || {}

  if (!config.webhookUrl || config.webhookUrl.startsWith('SUBSTITUA_')) {
    container.hidden = false
    loading.hidden = true
    texto.hidden = true
    erro.hidden = false
    erro.textContent = 'A JET-IA ainda não foi configurada (falta a URL do webhook em jetia-config.js).'
    return
  }

  container.hidden = false
  loading.hidden = false
  erro.hidden = true
  texto.hidden = true

  try {
    const res = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pergunta,
        colaborador_id: config.colaboradorId || 'desconhecido',
        colaborador_nome: config.colaboradorNome || '',
        colaborador_papel: config.colaboradorPapel || '',
        modulo_origem: 'jet-ia',
        timestamp: new Date().toISOString(),
      }),
    })

    const dados = await res.json().catch(() => null)

    if (!res.ok || !dados || dados.ok === false) {
      const mensagem = dados && dados.detalhes
        ? (Array.isArray(dados.detalhes) ? dados.detalhes.join(' ') : dados.detalhes)
        : 'Não foi possível consultar a JET-IA agora. Tente novamente em instantes.'
      loading.hidden = true
      erro.hidden = false
      erro.textContent = mensagem
      return
    }

    loading.hidden = true
    texto.hidden = false
    texto.innerHTML = jetiaFormatarResposta(dados.resposta || '')
  } catch (e) {
    loading.hidden = true
    erro.hidden = false
    erro.textContent = 'Não foi possível conectar à JET-IA. Verifique sua conexão e tente novamente.'
  }
}

function setupJetIA() {
  const btn = document.getElementById('jetia-ask-btn')
  if (!btn) return
  btn.addEventListener('click', jetiaPerguntar)

  document.getElementById('wiki-busca').addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault()
      jetiaPerguntar()
    }
  })
}

document.addEventListener('DOMContentLoaded', setupJetIA)
