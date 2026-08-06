import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { GruposProdutoLista } from './routes/GruposProduto/Lista'
import { GruposProdutoFormulario } from './routes/GruposProduto/Formulario'
import { VeiculosLista } from './routes/Frota/Veiculos/Lista'
import { VeiculosFormulario } from './routes/Frota/Veiculos/Formulario'
import { ViagensLista } from './routes/Frota/Viagens/Lista'
import { ViagensFormulario } from './routes/Frota/Viagens/Formulario'

export function App() {
  return (
    <BrowserRouter basename="/app">
      <RequireAuth>
        <Routes>
          <Route path="/" element={<Navigate to="/grupos-produto" replace />} />
          <Route path="/grupos-produto" element={<GruposProdutoLista />} />
          <Route path="/grupos-produto/novo" element={<GruposProdutoFormulario />} />
          <Route path="/grupos-produto/:id/editar" element={<GruposProdutoFormulario />} />
          <Route path="/frota/veiculos" element={<VeiculosLista />} />
          <Route path="/frota/veiculos/novo" element={<VeiculosFormulario />} />
          <Route path="/frota/veiculos/:id/editar" element={<VeiculosFormulario />} />
          <Route path="/frota/viagens" element={<ViagensLista />} />
          <Route path="/frota/viagens/novo" element={<ViagensFormulario />} />
          <Route path="/frota/viagens/:id/editar" element={<ViagensFormulario />} />
        </Routes>
      </RequireAuth>
    </BrowserRouter>
  )
}
