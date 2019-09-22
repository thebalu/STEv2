export const handleMessage = (sender_psid, received_message) => {
    let response = { "text": "Hello world" }

    if (received_message.text) {
        callSendAPI(sender_psid, response)
    }
}

export const handlePostback = (sender_psid, received_postback) => {
    let response

    let payload = received_postback.payload

    // Set the response based on the postback payload
    if (payload === 'GET_STARTED') {
        response = firstAskTemplate('Jöhet az első kihívás?')
        callSendAPI(sender_psid, response)
        
    } else if (payload === 'DONE') {
        response = areYouReadyToTheNextOneTemplate('Remek! :) Jöhet még egy kihívás?')
        callSendAPI(sender_psid, response)
    } else if (payload === 'YES' || payload === 'ANOTHER') {
        response = missionTemplate(getMissionDescription() + "\n Szólj, ha kész vagy!")
        callSendAPI(sender_psid, response)
    } else if (payload === 'NO'){
        setTimeout(dailyFirst, 5000, sender_psid)
    }
}

const callSendAPI = (sender_psid, response, cb = null) => {
    // Construct the message body
    let request_body = {
        "recipient": {
            "id": sender_psid
        },
        "message": response
    }

    console.log("sending")
    // Send the HTTP request to the Messenger Platform
    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": config.get('facebook.page.access_token') },
        "method": "POST",
        "json": request_body
    }, (err, res, body) => {
        if (!err) {
            if (cb) {
                cb()
            }
        } else {
            console.error("Unable to send message:" + err)
        }
    })
}