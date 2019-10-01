const templates = require('./templates')
const db = require('../resources/dbAPI')
const request = require('request')
const config = require('config')

const handleMessage = (sender_psid, received_message) => {
  let response1 = { "text": "Szia, hogy állsz a múltkori kihívással? Mutatom mégegyszer:" }


  currentTip = db.getCurrentTipForUser(sender_psid);
  tipText = "*" + currentTip.longTitle + ":* " + currentTip.description + '\n Szólj, ha kész vagy!'

  response2 = templates.buttonMessage(
    tipText,
    [templates.button('Kész vagyok', 'DONE'),
    templates.button('Másikat kérek', 'YES')] // ez another volt
  )

  if (received_message.text) {
    callSendAPI(sender_psid, response1);
    callSendAPI(sender_psid, response2);
  }
}

const handlePostback = (sender_psid, received_postback) => {
  let response

  let payload = received_postback.payload

  // Set the response based on the postback payload

  if(!db.getUser(sender_psid)) {
    console.log('Creating user' + sender_psid);
    db.newUser(sender_psid);
  }
  
  switch (payload) {
    case 'GET_STARTED':
      response = templates.buttonMessage(
        'Jöhet az első kihívás?', [
        templates.button('Igen', 'YES')
      ])
      break;

    case 'DONE':
      response = templates.buttonMessage(
        'Remek! :) Jöhet még egy kihívás?',
        [templates.button('Igen', 'YES'),
        templates.button('Mára elég ennyi', 'NO')]
      )
      break;

    case 'YES':
      nextTip = db.getNextTipForUser(sender_psid);
      tipText = "*" + nextTip.longTitle + ":* " + nextTip.description + '\n Szólj, ha kész vagy!'

      response = templates.buttonMessage(
        tipText,
        [templates.button('Kész vagyok', 'DONE'),
        templates.button('Másikat kérek', 'YES')] // ez another volt
      )
      break;

    case 'NO':
      response = { "text": 'Ilyet nem csinálhatsz.' }
  }

  callSendAPI(sender_psid, response)



  // if (payload === 'GET_STARTED') {
  //   response = templates.buttonMessage(
  //     'Jöhet az első kihívás?', [
  //       templates.button('Igen','YES')
  //   ])



  // } else if (payload === 'DONE') {
  //   response = areYouReadyToTheNextOneTemplate('Remek! :) Jöhet még egy kihívás?')
  //   callSendAPI(sender_psid, response)
  // } else if (payload === 'YES' || payload === 'ANOTHER') {
  //   response = missionTemplate(getMissionDescription() + "\n Szólj, ha kész vagy!")
  //   callSendAPI(sender_psid, response)
  // } else if (payload === 'NO') {
  //   setTimeout(dailyFirst, 5000, sender_psid)
  // }
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
  console.log("accesstoker: "+ config.util.getEnv('Facebook.access_token'))
  console.log("accesstoken: "+ config.get('Facebook.access_token'))
  // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": config.get('Facebook.access_token') },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log("response was:" + JSON.stringify(res))
      if (cb) {
        cb()
      }
    } else {
      console.error("Unable to send message:" + err)
    }
  })
}

module.exports = {handleMessage, handlePostback}
