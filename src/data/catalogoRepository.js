// Mock do catálogo de equipamentos/modelos/WMS para os campos de autocomplete
// do formulário de atendimento.
// >>> PONTO DE INTEGRAÇÃO <<<: trocar pela consulta ao cadastro de produtos do ERP
// (mesma base usada no módulo de Produtos — grupo/subgrupo, WMS por nº de série).

const CATALOGO = [
  {
    equipamento: 'Plotter de Recorte',
    modelos: [
      { modelo: 'Campro C16', wms: ['17058338701 - PLOTTER DE RECORTE CAMPRO C16 - LIGHT 0,40cm - WMS - Compra: 12/05/2026'] },
      { modelo: 'Campro C24', wms: ['17058338725 - PLOTTER DE RECORTE CAMPRO C24 - LIGHT 0,60cm - WMS - Compra: 03/07/2026', '17058338726 - PLOTTER DE RECORTE CAMPRO C24 - LIGHT 0,60cm - WMS - Compra: 18/06/2026'] },
      { modelo: 'Campro C34', wms: ['17058338740 - PLOTTER DE RECORTE CAMPRO C34 - LIGHT 0,90cm - WMS - Compra: 22/06/2026'] },
      { modelo: 'Campro C60', wms: ['17058338760 - PLOTTER DE RECORTE CAMPRO C60 - LIGHT 1,60cm - WMS - Compra: 05/06/2026'] },
      { modelo: 'Silhouette Cameo 4', wms: ['17058339010 - PLOTTER DE RECORTE SILHOUETTE CAMEO 4 - WMS - Compra: 14/06/2026'] },
      { modelo: 'Roland GS-24', wms: ['17058339050 - PLOTTER DE RECORTE ROLAND GS-24 - WMS - Compra: 09/06/2026'] },
    ],
  },
  {
    equipamento: 'Plotter de Impressão e Recorte',
    modelos: [
      { modelo: 'Roland VersaCAMM SV-540', wms: ['17058340010 - PLOTTER IMPRESSAO E RECORTE ROLAND SV-540 - WMS - Compra: 28/05/2026'] },
      { modelo: 'Mimaki CJV150-160', wms: ['17058340030 - PLOTTER IMPRESSAO E RECORTE MIMAKI CJV150-160 - WMS - Compra: 30/06/2026'] },
      { modelo: 'HP Latex 700', wms: ['17058340050 - PLOTTER IMPRESSAO E RECORTE HP LATEX 700 - WMS - Compra: 07/07/2026'] },
    ],
  },
  {
    equipamento: 'Impressora Digital UV',
    modelos: [
      { modelo: 'Roland VersaUV LEF2-200', wms: ['17058341010 - IMPRESSORA UV ROLAND LEF2-200 - WMS - Compra: 15/06/2026'] },
      { modelo: 'Mimaki UJF-3042', wms: ['17058341030 - IMPRESSORA UV MIMAKI UJF-3042 - WMS - Compra: 01/07/2026'] },
    ],
  },
  {
    equipamento: 'Laminadora',
    modelos: [
      { modelo: 'GMP Excelam II 1600', wms: ['17058342010 - LAMINADORA GMP EXCELAM II 1600 - WMS - Compra: 20/05/2026'] },
      { modelo: 'Vivid Lamipacker 1600', wms: ['17058342030 - LAMINADORA VIVID LAMIPACKER 1600 - WMS - Compra: 11/06/2026'] },
    ],
  },
  {
    equipamento: 'Termolaminadora',
    modelos: [
      { modelo: 'GMP Photon 65', wms: ['17058343010 - TERMOLAMINADORA GMP PHOTON 65 - WMS - Compra: 25/06/2026'] },
      { modelo: 'Ledco Sprint 65', wms: ['17058343030 - TERMOLAMINADORA LEDCO SPRINT 65 - WMS - Compra: 02/07/2026'] },
    ],
  },
  {
    equipamento: 'Mesa de Corte',
    modelos: [
      { modelo: 'Zund G3 L-2500', wms: ['17058344010 - MESA DE CORTE ZUND G3 L-2500 - WMS - Compra: 08/06/2026'] },
      { modelo: 'Summa F1612', wms: ['17058344030 - MESA DE CORTE SUMMA F1612 - WMS - Compra: 19/06/2026'] },
    ],
  },
  {
    equipamento: 'Prensa Térmica',
    modelos: [
      { modelo: 'Metalnox Digital 40x60', wms: ['17058345010 - PRENSA TERMICA METALNOX DIGITAL 40X60 - WMS - Compra: 27/05/2026'] },
      { modelo: 'Transtherm TT-4060', wms: ['17058345030 - PRENSA TERMICA TRANSTHERM TT-4060 - WMS - Compra: 30/05/2026'] },
    ],
  },
]

async function buscarEquipamentos(query) {
  if (!query || query.trim().length < 1) return []
  const alvo = query.toLowerCase()
  return CATALOGO
    .map(c => c.equipamento)
    .filter(nome => nome.toLowerCase().includes(alvo))
    .slice(0, 10)
}

async function buscarModelos(query) {
  if (!query || query.trim().length < 1) return []
  const alvo = query.toLowerCase()
  const resultados = []
  CATALOGO.forEach(grupo => {
    grupo.modelos.forEach(m => {
      if (m.modelo.toLowerCase().includes(alvo)) {
        resultados.push({ equipamento: grupo.equipamento, modelo: m.modelo, wms: m.wms })
      }
    })
  })
  return resultados.slice(0, 10)
}

module.exports = { buscarEquipamentos, buscarModelos, CATALOGO }
