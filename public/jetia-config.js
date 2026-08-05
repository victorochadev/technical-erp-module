// Configuração do widget JET-IA (mesmo padrão de supabase-config.js: a URL
// do webhook não é segredo em si — é protegida pelo próprio path do webhook
// no n8n —, então fica commitada aqui.
;(function () {
  window.JETIA_CONFIG = {
    webhookUrl: 'https://iachatjet.bjcontrol.com.br/webhook/jet-ia-erp',
    colaboradorId: 'victor.rocha',
    colaboradorNome: 'Victor Rocha',
    colaboradorPapel: 'ti',
  }
})()
