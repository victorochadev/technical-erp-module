import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './components/RequireAuth'
import { GruposProdutoLista } from './routes/GruposProduto/Lista'
import { GruposProdutoFormulario } from './routes/GruposProduto/Formulario'

export function App() {
  return (
    <BrowserRouter basename="/app">
      <RequireAuth>
        <Routes>
          <Route path="/" element={<Navigate to="/grupos-produto" replace />} />
          <Route path="/grupos-produto" element={<GruposProdutoLista />} />
          <Route path="/grupos-produto/novo" element={<GruposProdutoFormulario />} />
          <Route path="/grupos-produto/:id/editar" element={<GruposProdutoFormulario />} />
        </Routes>
      </RequireAuth>
    </BrowserRouter>
  )
}
