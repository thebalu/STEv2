const express = require('express')
const app     = express()

app.use(express.json())

app.listen(3000, () => {
  console.log(`>> Express:\thttp://localhost:${3000}/`)
})

// Routes
app.get('/', (req, res) => {
  res.send('hello')
})

app.use('/', require('./src/webhooks/webhooks'))
app.use('/', require('./challanges/challanges'))