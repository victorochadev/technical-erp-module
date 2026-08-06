import type { AtendimentoResumo, FrotaViagem, GrupoProduto, Veiculo } from './types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Requisição falhou (${res.status})`)
  return res.json() as Promise<T>
}

function postJson<T>(url: string, body: unknown): Promise<T> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => json<T>(res))
}

function putJson<T>(url: string, body: unknown): Promise<T> {
  return fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(res => json<T>(res))
}

export function listarGruposProduto(): Promise<GrupoProduto[]> {
  return fetch('/api/grupos-produto').then(res => json<GrupoProduto[]>(res))
}

export function buscarGrupoProduto(id: string): Promise<GrupoProduto> {
  return fetch(`/api/grupos-produto/${id}`).then(res => json<GrupoProduto>(res))
}

export function criarGrupoProduto(nome: string): Promise<GrupoProduto> {
  return fetch('/api/grupos-produto', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }),
  }).then(res => json<GrupoProduto>(res))
}

export function atualizarGrupoProduto(id: string, nome: string): Promise<GrupoProduto> {
  return fetch(`/api/grupos-produto/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome }),
  }).then(res => json<GrupoProduto>(res))
}

export function listarTecnicos(): Promise<string[]> {
  return fetch('/api/tecnicos').then(res => json<string[]>(res))
}

export function buscarAtendimentos(busca: string): Promise<AtendimentoResumo[]> {
  return fetch(`/api/atendimentos?busca=${encodeURIComponent(busca)}`).then(res => json<AtendimentoResumo[]>(res))
}

export function listarVeiculos(busca?: string): Promise<Veiculo[]> {
  const query = busca ? `?busca=${encodeURIComponent(busca)}` : ''
  return fetch(`/api/veiculos${query}`).then(res => json<Veiculo[]>(res))
}

export function buscarVeiculo(id: string): Promise<Veiculo> {
  return fetch(`/api/veiculos/${id}`).then(res => json<Veiculo>(res))
}

export function criarVeiculo(dados: Partial<Veiculo>): Promise<Veiculo> {
  return postJson('/api/veiculos', dados)
}

export function atualizarVeiculo(id: string, dados: Partial<Veiculo>): Promise<Veiculo> {
  return putJson(`/api/veiculos/${id}`, dados)
}

export function listarFrotaViagens(busca?: string): Promise<FrotaViagem[]> {
  const query = busca ? `?busca=${encodeURIComponent(busca)}` : ''
  return fetch(`/api/frota-viagens${query}`).then(res => json<FrotaViagem[]>(res))
}

export function buscarFrotaViagem(id: string): Promise<FrotaViagem> {
  return fetch(`/api/frota-viagens/${id}`).then(res => json<FrotaViagem>(res))
}

export function criarFrotaViagem(dados: Partial<FrotaViagem>): Promise<FrotaViagem> {
  return postJson('/api/frota-viagens', dados)
}

export function atualizarFrotaViagem(id: string, dados: Partial<FrotaViagem>): Promise<FrotaViagem> {
  return putJson(`/api/frota-viagens/${id}`, dados)
}
