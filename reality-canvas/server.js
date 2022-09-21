const express = require('express')
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
// const cors = require('cors')
const app = express()
const server = http.Server(app)
// app.use(cors())

app.use(express.static('./'))

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'))
})

server.listen(3000, () => {
  console.log('listening 3000')
})