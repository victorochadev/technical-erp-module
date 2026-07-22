// Configuração do widget JET-IA (mesmo padrão de supabase-config.js: a URL
// do webhook não é segredo em si — é protegida pelo próprio path do webhook
// no n8n —, então fica commitada aqui. Troque pela URL real gerada ao
// importar o fluxo `JET-IA-ERP/n8n/jet-ia-flow.json` no n8n (produção ou teste).
;(function () {
  window.JETIA_CONFIG = {
    webhookUrl: 'SUBSTITUA_PELA_URL_DO_WEBHOOK_N8N', // ex: https://seu-n8n.app/webhook/jet-ia-erp
    colaboradorId: 'victor.rocha',
    colaboradorNome: 'Victor Rocha',
    colaboradorPapel: 'ti',
  }
})()
