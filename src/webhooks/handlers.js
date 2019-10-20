const templates = require('./templates')
const db = require('../resources/dbAPI')
const request = require('request')
const config = require('config')

const handleMessage = (sender_psid, received_message) => {

  console.log(received_message.text)
  switch (received_message.text) {
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

const handlePostback = async (sender_psid, received_postback) => {
  let response

  let payload = received_postback.payload

  // Set the response based on the postback payload

  try {
    if (!(await db.getUser(sender_psid))) {
      console.log('Creating user' + sender_psid);
      db.newUser(sender_psid);
    }
  } catch (error) {
    console.error("Promise rejected" + error)
  }
  var user
  try{
    user = (await db.getUser(sender_psid))
  }catch (error) {
    console.error("Promise rejected" + error)
  }

  switch (payload) {
    case 'GET_STARTED':
      console.log("GETSTARTED")
      try {
        await getAndSaveUserFirstName(sender_psid)
        console.log('User first name saved' + sender_psid);
      }
      catch (error) {
        console.error("Promise rejected" + error)
      }
      response = templates.buttonMessage(
        'Jöhet az első kihívás', + user.userFirstName + '?', [
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
      try {
        nextTip = await db.getNextTipForUser(sender_psid);
        tipText = "*" + nextTip.longTitle + ":* " + nextTip.description + '\n Szólj, ha kész vagy!'
      } catch (error) {
        console.error("promise rejected " + error)
      }
      response = templates.buttonMessage(
        tipText,
        [templates.button('Kész vagyok', 'DONE'),
        templates.button('Másikat kérek', 'ANOTHER')] // ez another volt
      )
      break;

    case 'ANOTHER':
      try {
        nextTip = await db.getNextTipForUser(sender_psid);
        tipText = "Ok, itt egy másik: \n *" + nextTip.longTitle + ":* " + nextTip.description + '\n Szólj, ha kész vagy!'
      } catch (error) {
        console.error("promise rejected " + error)
      }
      response = templates.buttonMessage(
        tipText,
        [templates.button('Kész vagyok', 'DONE'),
        templates.button('Másikat kérek', 'ANOTHER')] // ez another volt
      )
      break;
    case 'NO':
      response = { "text": 'Ilyet nem csinálhatsz!' }
      break;

    case 'ACTIVATE':
      db.setActive(sender_psid, true);
      standardReply(sender_psid, received_postback, 'Örülünk, hogy újra itt vagy! Folytassuk onnan, ahol a múltkor abbahagytuk. Itt is van az első kihívás:')
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


const standardReply = async (sender_psid, received_message, before_text) => {
  let response1 = { "text": before_text }
  try {
    currentTip = await db.getCurrentTipForUser(sender_psid);
  } catch (error) {
    console.error("Promise rejected" + error);
  }
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

const sendInstantMessage = async (req, res) => {
  let body = req.body
  console.log(body)
  if (body.secret && body.secret == 'NAGYONTITKOSJELSZO') {
    // users = await db.getAllUsers()
    let users
    if (body.users) {
      users = body.users
    } else {
      // todo kérjük le az adatbázisból az összes usert
      users = ['2572117989520100', '2707581762588340']
    }

    users.forEach(user_id => {
      callSendAPI(user_id, body.message, () => { console.log("Message sent to " + user_id) })
    });

    res.status(200).send(users)
  } else {
    res.status(403).send("You can't do this")
  }
}

async function getAndSaveUserFirstName(senderId){
  var request = require('request');

  var name = "";
  await request({
      url: "https://graph.facebook.com/v2.6/" + senderId,
      qs: {
        access_token: config.get('Facebook.access_token'),
        fields: "first_name"
      },
      method: "GET"
    }, function(error, response, body) {
      if (error) {
        console.log("Error getting user's name: " +  error);
      } else {
        var bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        console.log("First name: " +  name);
        db.addUserName(senderId, name)
      }
    });
    
}

module.exports = { handleMessage, handlePostback, sendInstantMessage }
