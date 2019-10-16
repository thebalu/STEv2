const templates = require('./templates')
const db = require('../resources/dbAPI')
const request = require('request')
const config = require('config')

let titleAdded = false
let descriptionAdded = false
let title
let tipDescription

const handleMessage = (sender_psid, received_message) => {

  console.log(received_message.text)
  if (titleAdded) {
    titleAdded = false
    title = received_message.text
    response =  { "text": 'Add meg a kihívás leírását!' };
    descriptionAdded = true
    callSendAPI(sender_psid, response);
  }
  else if (descriptionAdded){
    tipDescription = received_message.text
    descriptionAdded = false
    response = templates.buttonMessage(
      'Remek! :) Elmented a kihívást?',
      [templates.button('Igen', 'SAVENEWTIP'),
      templates.button('Inkább nem', 'DISCARDNEWTIP')]
    )
    callSendAPI(sender_psid, response);
  }
  else switch (received_message.text) {
    
    case 'leiratkozás':
      db.setActive(sender_psid, false);
      let response = templates.buttonMessage(
        'Sajnáljuk, hogy itt hagysz minket. Ha meggondolnád magad, és folytatnád a Föld megmentését, kattints a gombra.', [
        templates.button('Mentsük meg a Földet!', 'ACTIVATE')
      ])
      callSendAPI(sender_psid, response);
      break;
    
    default:
      standardReply(sender_psid, received_message, "Szia, hogy állsz a múltkori kihívással? Mutatom mégegyszer:");
      break;
  }

}

const handlePostback = (sender_psid, received_postback) => {
  let response
  
  let payload = received_postback.payload

  // Set the response based on the postback payload

  if (!db.getUser(sender_psid)) {
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
        templates.button('Mára elég ennyi', 'NO'),
        templates.button('Kihívást írok', 'TIPTITLE')]
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
      break;

    case 'ACTIVATE':
      db.setActive(sender_psid, true);
      standardReply(sender_psid, received_postback, 'Örülünk, hogy újra itt vagy! Folytassuk onnan, ahol a múltkor abbahagytuk. Itt is van az első kihívás:')
      break;
    
    case 'TIPTITLE':
      response =  { "text": 'Add meg a kihívás rövid címét!' };
      titleAdded = true
      break;
    case 'SAVENEWTIP':
      db.newTip(sender_psid, title, tipDescription)
      response = { "text": 'A kihívásod mentésre került.' };
      break;
    case 'DISCARDNEWTIP':
      standardReply(sender_psid, received_postback, 'Jöhet még egy kihívás? :)')
      break;
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


const standardReply = (sender_psid, received_message, before_text) => {
  let response1 = { "text": before_text }
  currentTip = db.getCurrentTipForUser(sender_psid);
  tipText = "*" + currentTip.longTitle + ":* " + currentTip.description + '\n Szólj, ha kész vagy!'

  response2 = templates.buttonMessage(
    tipText,
    [templates.button('Kész vagyok', 'DONE'),
    templates.button('Másikat kérek', 'YES')] // ez another volt
  )

  if (received_message.text || received_message.payload) {
    callSendAPI(sender_psid, response1);
    callSendAPI(sender_psid, response2);
  }
}

module.exports = { handleMessage, handlePostback }
