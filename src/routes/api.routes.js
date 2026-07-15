const express = require('express')
const repo = require('../data/atendimentosRepository')
const dashboardService = require('../services/dashboardService')
const clientesRepo = require('../data/clientesRepository')
const catalogoRepo = require('../data/catalogoRepository')
const instalacoesRepo = require('../data/instalacoesRepository')
const laboratorioRepo = require('../data/laboratorioRepository')
const requisicoesRepo = require('../data/requisicoesRepository')

const router = express.Router()

router.get('/meses', async (req, res) => {
  res.json(await repo.listMesesDisponiveis())
})

router.get('/tecnicos', async (req, res) => {
  res.json(await repo.listTecnicos())
})

router.get('/atendimentos', async (req, res) => {
  const { mes, tecnico, tipo, status, busca, clienteId } = req.query
  res.json(await repo.listAtendimentos({ mes, tecnico, tipo, status, busca, clienteId }))
})

router.post('/atendimentos', async (req, res) => {
  const atendimento = await repo.criarAtendimento(req.body)
  res.status(201).json(atendimento)
})

router.get('/atendimentos/:id', async (req, res) => {
  const atendimento = await repo.buscarAtendimentoPorId(req.params.id)
  if (!atendimento) return res.status(404).json({ erro: 'Atendimento não encontrado' })
  res.json(atendimento)
})

router.get('/dashboard/resumo', async (req, res) => {
  res.json(await dashboardService.getResumoMensal(req.query.mes))
})

router.get('/dashboard/por-tecnico', async (req, res) => {
  res.json(await dashboardService.getRankingPorTecnico(req.query.mes))
})

router.get('/clientes/busca', async (req, res) => {
  res.json(await clientesRepo.buscarClientesPorNome(req.query.q))
})

router.get('/clientes/:id', async (req, res) => {
  const cliente = await clientesRepo.buscarClientePorId(req.params.id)
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado' })
  res.json(cliente)
})

router.get('/catalogo/equipamentos', async (req, res) => {
  res.json(await catalogoRepo.buscarEquipamentos(req.query.q))
})

router.get('/catalogo/modelos', async (req, res) => {
  res.json(await catalogoRepo.buscarModelos(req.query.q))
})

router.get('/instalacoes', async (req, res) => {
  res.json(await instalacoesRepo.listInstalacoes({ busca: req.query.busca }))
})

router.get('/instalacoes/:id', async (req, res) => {
  const instalacao = await instalacoesRepo.buscarInstalacaoPorId(req.params.id)
  if (!instalacao) return res.status(404).json({ erro: 'Instalação não encontrada' })
  res.json(instalacao)
})

router.get('/laboratorio', async (req, res) => {
  res.json(await laboratorioRepo.listQuadro())
})

router.patch('/laboratorio/:id/mover', async (req, res) => {
  const card = await laboratorioRepo.moverCard(req.params.id, req.body.coluna)
  if (!card) return res.status(404).json({ erro: 'Cartão ou coluna inválidos' })
  res.json(card)
})

router.post('/laboratorio', async (req, res) => {
  const card = await laboratorioRepo.criarCard({ cliente: req.body.cliente, coluna: req.body.coluna })
  if (!card) return res.status(400).json({ erro: 'Coluna inválida' })
  res.status(201).json(card)
})

router.post('/laboratorio/de-atendimento', async (req, res) => {
  const card = await laboratorioRepo.criarCardDeAtendimento(req.body)
  res.status(201).json(card)
})

router.post('/laboratorio/:id/comentarios', async (req, res) => {
  const card = await laboratorioRepo.adicionarComentario(req.params.id, req.body.texto)
  if (!card) return res.status(404).json({ erro: 'Cartão não encontrado' })
  res.status(201).json(card)
})

router.post('/laboratorio/colunas', async (req, res) => {
  const coluna = await laboratorioRepo.criarColuna(req.body.nome)
  if (!coluna) return res.status(400).json({ erro: 'Nome inválido' })
  res.status(201).json(coluna)
})

router.delete('/laboratorio/colunas/:id', async (req, res) => {
  const resultado = await laboratorioRepo.excluirColuna(req.params.id)
  if (resultado.erro === 'not_found') return res.status(404).json({ erro: 'Coluna não encontrada' })
  if (resultado.erro === 'nao_vazia') return res.status(400).json({ erro: 'Mova ou exclua os cartões antes de remover esta coluna.' })
  res.status(204).end()
})

router.get('/requisicoes', async (req, res) => {
  res.json(await requisicoesRepo.listRequisicoes({ busca: req.query.busca }))
})

router.get('/requisicoes/produtos', async (req, res) => {
  res.json(await requisicoesRepo.buscarProdutos(req.query.q))
})

router.get('/requisicoes/:id', async (req, res) => {
  const requisicao = await requisicoesRepo.buscarRequisicaoPorId(req.params.id)
  if (!requisicao) return res.status(404).json({ erro: 'Requisição não encontrada' })
  res.json(requisicao)
})

router.post('/requisicoes', async (req, res) => {
  const requisicao = await requisicoesRepo.criarRequisicao(req.body)
  res.status(201).json(requisicao)
})

router.put('/requisicoes/:id', async (req, res) => {
  const requisicao = await requisicoesRepo.atualizarRequisicao(req.params.id, req.body)
  if (!requisicao) return res.status(404).json({ erro: 'Requisição não encontrada' })
  res.json(requisicao)
})

module.exports = router
