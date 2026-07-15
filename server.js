const express = require('express')
const path = require('path')
const apiRoutes = require('./src/routes/api.routes')

const app = express()
const PORT = process.env.PORT || 3300

app.use(express.json())
app.use('/api', apiRoutes)
app.use(express.static(path.join(__dirname, 'public')))

app.listen(PORT, () => {
  console.log(`Dashboard de Atendimentos rodando em http://localhost:${PORT}`)
})
