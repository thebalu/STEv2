const express = require('express')
const router  = express.Router()

const {
	handleMessage,
    handlePostback,
    sendInstantMessage
} = require('./handlers')

// Adds support for GET requests to our webhook
// This is used for Facebook to connect our server
router.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = "chatbot"

    // Parse the query params
    let mode = req.query['hub.mode']
    let token = req.query['hub.verify_token']
    let challenge = req.query['hub.challenge']

    // Checks if a token and mode is in the query string of the request
    if (mode && token) {

        console.log(token)
        // Checks the mode and token sent is correct
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {

            // Responds with the challenge token from the request
            console.log('WEBHOOK_VERIFIED')
            res.status(200).send(challenge)

        } else {
            // Responds with '403 Forbidden' if verify tokens do not match
            res.sendStatus(403)
        }
    }
})

// Creates the endpoint for our webhook
router.post('/webhook', (req, res) => {
    console.log('router.post')
    let body = req.body

    if (body.object === 'page') {
        console.log("body.object == page ok")

        // Iterates over each entry - there may be multiple if batched
        body.entry.forEach(function (entry) {

            // Gets the message. entry.messaging is an array, but
            // will only ever contain one message, so we get index 0
            let webhook_event = entry.messaging[0]
            console.log(webhook_event)

            // Get the sender PSID
            let sender_psid = webhook_event.sender.id
            console.log('Sender PSID: ' + sender_psid)

            // Check if the event is a message or postback and
            // pass the event to the appropriate handler function
            if (webhook_event.message) {
                console.log("Handle message function should called")
                handleMessage(sender_psid, webhook_event.message)
            } else if (webhook_event.postback) {
                handlePostback(sender_psid, webhook_event.postback)
            }
        })

        // Returns a '200 OK' response to all requests
        res.status(200).send('EVENT_RECEIVED')
    } else {
        // Returns a '404 Not Found' if event is not from a page subscription
        res.sendStatus(404)
    }
})

router.post('/instant_message', sendInstantMessage)

module.exports = router