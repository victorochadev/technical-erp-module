const express = require('express')
const path = require('path')
const apiRoutes = require('./src/routes/api.routes')

const app = express()
const PORT = process.env.PORT || 3300

app.use(express.json())
app.use('/api', apiRoutes)
app.use(express.static(path.join(__dirname, 'public')))

// Fallback de SPA: qualquer rota /app/... que não seja um arquivo estático
// (deep-link ou refresh dentro do app React migrado) cai no index.html do
// build do Vite, e o react-router-dom assume o roteamento no cliente.
app.get('/app/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/app/index.html'))
})

app.listen(PORT, () => {
  console.log(`Dashboard de Atendimentos rodando em http://localhost:${PORT}`)
})
