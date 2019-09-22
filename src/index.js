const express = require('express')
const app     = express()

app.use(express.json())

app.listen(process.env.PORT || 3000, () => {
  console.log(`>> Express:\thttp://localhost:${process.env.PORT || 3000}/`)
})

// Routes
app.get('/', (req, res) => {
  res.send('hello')
})

const webhooks = require('./webhooks/webhooks')
app.use('/', webhooks)
