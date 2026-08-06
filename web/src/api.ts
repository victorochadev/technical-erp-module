import type { GrupoProduto } from './types'

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`Requisição falhou (${res.status})`)
  return res.json() as Promise<T>
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
