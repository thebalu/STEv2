const express  = require('express')

const Express = express()
app.use(express.json())

// Start server
app.listen(3000, () => {
  console.log(`>> Express:\thttp://localhost:${3000}/`)
})

// Routes
app.get('/', (req, res) => {
  res.send('hello')
})

app.use('/', require('./webhooks/webhooks'))
//app.use('/', require('./challanges/challanges'))