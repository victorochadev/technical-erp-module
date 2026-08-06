export interface GrupoProduto {
  id: number
  nome: string
}

export interface Veiculo {
  id: number
  placa: string
  marca: string
  modelo: string
  ano: string
  categoria: string
  combustivel: string
  kmAtual: number
  manutencaoKmPrevista: number | null
  manutencaoDataPrevista: string
  manutencaoDescricao: string
  manutencaoPendente: boolean
}

export interface FrotaViagem {
  id: number
  veiculoId: number
  veiculoPlaca: string
  veiculoModelo: string
  tecnico: string
  atendimentoId: number | null
  atendimentoNumero: string | null
  finalidade: string
  kmSaida: number
  kmChegada: number | null
  kmRodado: number | null
  dataSaida: string
  dataChegada: string | null
  observacoes: string
}

export interface AtendimentoResumo {
  id: number
  numero: string
  cliente: string
  defeito: string
}

export interface CargoSalario {
  id: number
  nome: string
  salarioBase: number
}
