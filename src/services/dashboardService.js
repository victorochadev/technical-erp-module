const repo = require('../data/atendimentosRepository')

function pct(n, total) {
  return total === 0 ? 0 : Math.round((n / total) * 1000) / 10
}

async function getResumoMensal(mes) {
  const atendimentos = await repo.listAtendimentos({ mes })
  const total = atendimentos.length

  const remoto = atendimentos.filter(a => a.tipo === 'Remoto').length
  const presencial = atendimentos.filter(a => a.tipo === 'Presencial').length

  const concluido = atendimentos.filter(a => a.status === 'Concluido').length
  const cancelado = atendimentos.filter(a => a.status === 'Cancelado').length
  const emAtendimento = atendimentos.filter(a => a.status === 'Em Atendimento').length

  return {
    mes,
    total,
    porTipo: {
      remoto: { total: remoto, percentual: pct(remoto, total) },
      presencial: { total: presencial, percentual: pct(presencial, total) },
    },
    porStatus: {
      concluido: { total: concluido, percentual: pct(concluido, total) },
      cancelado: { total: cancelado, percentual: pct(cancelado, total) },
      emAtendimento: { total: emAtendimento, percentual: pct(emAtendimento, total) },
    },
  }
}

async function getRankingPorTecnico(mes) {
  const atendimentos = await repo.listAtendimentos({ mes })

  const porTecnico = new Map()
  for (const a of atendimentos) {
    if (!porTecnico.has(a.tecnico)) {
      porTecnico.set(a.tecnico, {
        tecnico: a.tecnico,
        total: 0,
        remoto: 0,
        presencial: 0,
        concluido: 0,
        cancelado: 0,
        emAtendimento: 0,
      })
    }
    const linha = porTecnico.get(a.tecnico)
    linha.total += 1
    if (a.tipo === 'Remoto') linha.remoto += 1
    if (a.tipo === 'Presencial') linha.presencial += 1
    if (a.status === 'Concluido') linha.concluido += 1
    if (a.status === 'Cancelado') linha.cancelado += 1
    if (a.status === 'Em Atendimento') linha.emAtendimento += 1
  }

  return [...porTecnico.values()].sort((a, b) => b.total - a.total)
}

module.exports = { getResumoMensal, getRankingPorTecnico }
