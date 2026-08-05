// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DAS PLANILHAS QUE ALIMENTAM O CARD "Dashboards por Categoria"
//
// COMO LIGAR UMA PLANILHA (leva 1 minuto):
//
//   1. Abra a planilha no Google Planilhas.
//   2. Arquivo → Compartilhar → Publicar na web.
//   3. Em "Vincular", escolha a ABA desejada e o formato "Valores separados
//      por vírgula (.csv)". Clique em Publicar.
//   4. Copie a URL gerada e cole em `csvUrl` da categoria correspondente.
//
//   Alternativa: se a planilha estiver compartilhada como "qualquer pessoa com
//   o link pode ver", basta preencher `sheetId` + `sheetName` que a URL é
//   montada sozinha (endpoint gviz).
//
// O painel relê a planilha a cada `refreshSeconds` — é assim que os números se
// mantêm atualizados. Nada é gravado de volta: a leitura é somente leitura.
//
// ATENÇÃO: uma aba publicada fica acessível a quem tiver o link. Publique uma
// aba de RESUMO, sem telefone, e-mail ou nome completo de cliente.
// ─────────────────────────────────────────────────────────────────────────────

window.SHEETS_CONFIG = {
  // De quantos em quantos segundos reler as planilhas.
  refreshSeconds: 60,

  categorias: {
    // ───────────────────────────── SUPORTE REMOTO ────────────────────────────
    remoto: {
      rotulo: 'Suporte Remoto',

      // Planilha "REGISTRO DE ATENDIMENTOS - CALLBEL" (conta admsp@bannerjet.com.br),
      // publicada em CSV com "republicar automaticamente" ligado.
      csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vS8wPWT8wz2XtoKYgytASCVf3JVZbS9kLVisj3A2fSDe7fUsmtOwi1dsXU3zDfcNBgmzcwSvM_3cmLz/pub?output=csv',

      // Alternativa (usada só se csvUrl estiver vazio).
      sheetId: '',
      sheetName: '',

      // Mapeamento de colunas. Deixe vazio para detecção automática pelo
      // cabeçalho (aceita variações de acento/maiúscula). Preencha com o nome
      // EXATO da coluna só se a detecção errar.
      colunas: {
        data: '',         // ex.: 'Carimbo de data/hora' ou 'Data'
        modalidade: '',   // ex.: 'Modalidade'
        equipamento: '',  // ex.: 'Equipamento'
        status: '',       // opcional
        tecnico: '',      // opcional
      },
    },

    // ─────────────────────────────── PRESENCIAL ──────────────────────────────
    // Aguardando fonte de dados (Erick informa depois).
    presencial: {
      rotulo: 'Presencial',
      csvUrl: '',
      sheetId: '',
      sheetName: '',
      colunas: { data: '', modalidade: '', equipamento: '', status: '', tecnico: '' },
    },

    // ─────────────────────────────── LABORATÓRIO ─────────────────────────────
    // Aguardando fonte de dados (Erick informa depois).
    laboratorio: {
      rotulo: 'Laboratório',
      csvUrl: '',
      sheetId: '',
      sheetName: '',
      colunas: { data: '', modalidade: '', equipamento: '', status: '', tecnico: '' },
    },
  },
}
