// Lê planilhas do Google publicadas em CSV e agrega os números que alimentam o
// card "Dashboards por Categoria" do dashboard.
//
// Roda 100% no navegador (o front é estático — ver api-shim.js), então a aba
// precisa estar publicada na web ou compartilhada por link. Configuração em
// sheets-config.js.
;(function () {
  const CACHE = new Map()

  // ─────────────────────────── CSV ───────────────────────────

  // Parser de CSV completo: respeita aspas, vírgulas dentro de aspas, aspas
  // escapadas ("") e quebras de linha dentro de células — tudo isso aparece em
  // planilha preenchida por gente de verdade.
  function parseCsv(texto) {
    const linhas = []
    let campo = ''
    let linha = []
    let dentroDeAspas = false

    for (let i = 0; i < texto.length; i++) {
      const c = texto[i]

      if (dentroDeAspas) {
        if (c === '"') {
          if (texto[i + 1] === '"') { campo += '"'; i++ }
          else dentroDeAspas = false
        } else campo += c
        continue
      }

      if (c === '"') { dentroDeAspas = true; continue }
      if (c === ',') { linha.push(campo); campo = ''; continue }
      if (c === '\r') continue
      if (c === '\n') { linha.push(campo); linhas.push(linha); linha = []; campo = ''; continue }
      campo += c
    }
    linha.push(campo)
    linhas.push(linha)

    return linhas.filter(l => l.some(celula => celula.trim() !== ''))
  }

  // ─────────────────────── Normalização ───────────────────────

  function normalizar(texto) {
    return String(texto || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
  }

  const SINONIMOS = {
    data: ['data', 'data hora', 'datahora', 'carimbo de data hora', 'timestamp', 'dt', 'data do atendimento', 'data atendimento', 'dia'],
    modalidade: ['modalidade', 'tipo', 'categoria', 'servico', 'assunto', 'tipo de atendimento', 'tipo atendimento'],
    equipamento: ['equipamento', 'maquina', 'produto', 'modelo', 'equipamento modelo'],
    status: ['status', 'situacao', 'resultado'],
    tecnico: ['tecnico', 'atendente', 'responsavel', 'operador'],
  }

  // Descobre o índice de cada coluna: usa o nome fixado na config quando houver,
  // senão casa o cabeçalho contra a lista de sinônimos (exato antes de parcial).
  function mapearColunas(cabecalho, colunasConfig = {}) {
    const normalizados = cabecalho.map(normalizar)
    const indices = {}

    for (const campo of Object.keys(SINONIMOS)) {
      const fixado = (colunasConfig[campo] || '').trim()
      if (fixado) {
        const alvo = normalizar(fixado)
        const idx = normalizados.indexOf(alvo)
        if (idx !== -1) { indices[campo] = idx; continue }
      }

      let idx = normalizados.findIndex(h => SINONIMOS[campo].includes(h))
      if (idx === -1) idx = normalizados.findIndex(h => h && SINONIMOS[campo].some(s => h.includes(s)))
      if (idx !== -1) indices[campo] = idx
    }

    return indices
  }

  // Aceita AAAA-MM-DD (com ou sem hora/UTC), DD/MM/AAAA e DD-MM-AAAA.
  // Devolve 'AAAA-MM-DD' — nesse formato a comparação de intervalo pode ser
  // feita com string, sem fuso atrapalhar.
  function dataISO(valor) {
    const texto = String(valor || '').trim()
    if (!texto) return null

    let m = texto.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${m[1]}-${m[2]}-${m[3]}`

    m = texto.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})/)
    if (m) return `${m[3]}-${String(m[2]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`

    const d = new Date(texto)
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    }

    return null
  }

  // As três modalidades do Suporte Remoto. O texto da planilha é livre, então
  // classificamos por padrão em vez de exigir escrita exata.
  const MODALIDADES = [
    { chave: 'instalacao', rotulo: 'Instalação e Treinamento', cor: 'var(--grafico-1)', teste: t => /instala|treinamento/.test(t) },
    { chave: 'humano', rotulo: 'Atendimento Humano', cor: 'var(--grafico-2)', teste: t => /humano|tecnico humano|suporte humano/.test(t) },
    { chave: 'jetia', rotulo: 'Jet IA', cor: 'var(--grafico-3)', teste: t => /jet ?ia|jetia|\bia\b/.test(t) },
  ]

  function classificarModalidade(valor) {
    const t = normalizar(valor)
    if (!t) return null
    const achado = MODALIDADES.find(m => m.teste(t))
    return achado ? achado.chave : 'outros'
  }

  // ───────────────────────── Busca ─────────────────────────

  function montarUrl(cfg) {
    if (cfg.csvUrl && cfg.csvUrl.trim()) return cfg.csvUrl.trim()
    if (cfg.sheetId && cfg.sheetId.trim()) {
      const aba = cfg.sheetName ? `&sheet=${encodeURIComponent(cfg.sheetName)}` : ''
      return `https://docs.google.com/spreadsheets/d/${cfg.sheetId.trim()}/gviz/tq?tqx=out:csv${aba}`
    }
    return null
  }

  function estaConfigurada(cfg) {
    return !!montarUrl(cfg)
  }

  async function buscarLinhas(cfg) {
    const url = montarUrl(cfg)
    if (!url) return null

    // Cache-buster: sem ele o Google devolve a versão em cache e o painel
    // "trava" num número antigo, que é justamente o que não queremos.
    const separador = url.includes('?') ? '&' : '?'
    const res = await fetch(`${url}${separador}_ts=${Date.now()}`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const texto = await res.text()
    if (texto.trim().startsWith('<')) {
      throw new Error('A planilha respondeu HTML em vez de CSV — provavelmente não está publicada/compartilhada publicamente.')
    }

    const linhas = parseCsv(texto)
    if (linhas.length < 2) return { cabecalho: linhas[0] || [], dados: [] }
    return { cabecalho: linhas[0], dados: linhas.slice(1) }
  }

  // ─────────────────────── Agregação ───────────────────────

  function agregar(cabecalho, dados, colunasConfig, periodo) {
    const idx = mapearColunas(cabecalho, colunasConfig)
    const temColunaData = idx.data !== undefined

    const registros = dados.map(linha => ({
      data: temColunaData ? dataISO(linha[idx.data]) : null,
      modalidade: idx.modalidade !== undefined ? linha[idx.modalidade] : '',
      equipamento: idx.equipamento !== undefined ? linha[idx.equipamento] : '',
      status: idx.status !== undefined ? linha[idx.status] : '',
      tecnico: idx.tecnico !== undefined ? linha[idx.tecnico] : '',
    }))

    // Só filtra por período quando a planilha tem coluna de data; sem ela,
    // mostrar tudo é mais honesto do que mostrar zero.
    const temIntervalo = periodo && periodo.inicio && periodo.fim
    const filtrados = temColunaData && temIntervalo
      ? registros.filter(r => r.data && r.data >= periodo.inicio && r.data <= periodo.fim)
      : registros
    const total = filtrados.length

    const contagemModalidade = new Map()
    // Chave normalizada → { rotulo, total }: sem normalizar, "Guilhotina" e
    // "guilhotina" virariam duas barras diferentes do mesmo equipamento.
    const contagemEquipamento = new Map()
    let registrosComEquipamento = 0

    for (const r of filtrados) {
      const chave = classificarModalidade(r.modalidade)
      if (chave) contagemModalidade.set(chave, (contagemModalidade.get(chave) || 0) + 1)

      // Um atendimento pode envolver mais de um equipamento, e a planilha traz
      // todos na mesma célula ("Guilhotina, Vincadeira, Laminadora"). Sem
      // separar, cada combinação viraria uma barra própria e o mesmo
      // equipamento apareceria diluído em várias delas.
      const equipamentos = String(r.equipamento || '')
        .split(/[,;]/)
        .map(e => e.replace(/\s+/g, ' ').trim())
        .filter(Boolean)

      if (equipamentos.length > 0) registrosComEquipamento++

      const vistosNaLinha = new Set()
      for (const equip of equipamentos) {
        const chaveEquip = equip.toLowerCase()
        // Repetição dentro da mesma célula é um atendimento só.
        if (vistosNaLinha.has(chaveEquip)) continue
        vistosNaLinha.add(chaveEquip)

        const atual = contagemEquipamento.get(chaveEquip)
        if (atual) atual.total += 1
        else contagemEquipamento.set(chaveEquip, { rotulo: equip, total: 1 })
      }
    }

    // Na planilha real boa parte das linhas vem sem modalidade ou sem
    // equipamento. Se a fatia fosse calculada sobre o total de registros, o
    // gráfico somaria menos de 100% e pareceria quebrado — cada bloco usa como
    // base o que está de fato preenchido, e o vazio é reportado à parte.
    const comModalidade = [...contagemModalidade.values()].reduce((s, n) => s + n, 0)
    // Duas bases distintas, de propósito: o rodapé "sem equipamento" fala de
    // REGISTROS, enquanto a fatia de cada barra é sobre o total de MENÇÕES —
    // um atendimento com três equipamentos conta uma vez no primeiro e três no
    // segundo. Reutilizar a mesma base faria o rodapé mentir.
    const comEquipamento = registrosComEquipamento
    const mencoesEquipamento = [...contagemEquipamento.values()].reduce((s, e) => s + e.total, 0)
    const pctSobre = (n, base) => (base === 0 ? 0 : Math.round((n / base) * 1000) / 10)

    const porModalidade = MODALIDADES.map(m => ({
      chave: m.chave,
      rotulo: m.rotulo,
      cor: m.cor,
      total: contagemModalidade.get(m.chave) || 0,
      percentual: pctSobre(contagemModalidade.get(m.chave) || 0, comModalidade),
    }))

    const outros = contagemModalidade.get('outros') || 0
    if (outros > 0) {
      porModalidade.push({
        chave: 'outros', rotulo: 'Outros', cor: 'var(--grafico-4)',
        total: outros, percentual: pctSobre(outros, comModalidade),
      })
    }

    // Desempate alfabético para a releitura de 60s não ficar trocando a ordem
    // de barras empatadas.
    const porEquipamento = [...contagemEquipamento.values()]
      .map(({ rotulo, total: qtd }) => ({ rotulo, total: qtd, percentual: pctSobre(qtd, mencoesEquipamento) }))
      .sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, 'pt-BR'))

    return {
      total,
      totalGeral: registros.length,
      comData: registros.filter(r => r.data).length,
      primeiraData: registros.map(r => r.data).filter(Boolean).sort()[0] || null,
      comModalidade,
      semModalidade: total - comModalidade,
      comEquipamento,
      semEquipamento: total - comEquipamento,
      temColunaData,
      colunasDetectadas: idx,
      porModalidade,
      porEquipamento,
    }
  }

  // ───────────────────────── API pública ─────────────────────────

  async function carregarCategoria(nome, periodo) {
    const cfg = (window.SHEETS_CONFIG?.categorias || {})[nome]
    if (!cfg) return { estado: 'sem-config', rotulo: nome }

    if (!estaConfigurada(cfg)) {
      return { estado: 'sem-config', rotulo: cfg.rotulo }
    }

    try {
      // Uma leitura por categoria por ciclo, reaproveitada entre trocas de mês.
      const chaveCache = montarUrl(cfg)
      let bruto = CACHE.get(chaveCache)
      if (!bruto || Date.now() - bruto.em > (window.SHEETS_CONFIG.refreshSeconds || 60) * 1000) {
        const resposta = await buscarLinhas(cfg)
        bruto = { ...resposta, em: Date.now() }
        CACHE.set(chaveCache, bruto)
      }

      const agregado = agregar(bruto.cabecalho, bruto.dados, cfg.colunas, periodo)
      return { estado: 'ok', rotulo: cfg.rotulo, atualizadoEm: new Date(bruto.em), ...agregado }
    } catch (erro) {
      return { estado: 'erro', rotulo: cfg.rotulo, mensagem: erro.message }
    }
  }

  function invalidarCache() {
    CACHE.clear()
  }

  window.SheetsSource = { carregarCategoria, invalidarCache, MODALIDADES, parseCsv, dataISO }
})()
