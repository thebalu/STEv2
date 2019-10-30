const templates = require('./templates')
const db = require('../resources/dbAPI')
const request = require('request')
const config = require('config')

const handleMessage = (sender_psid, received_message) => {
  generateYes()
  console.log(received_message.text)
  switch (received_message.text) {
    case 'leiratkozás':
      db.setActive(sender_psid, false);
      let response = templates.buttonMessage(
        'Sajnálom, hogy itt hagysz engem. Ha meggondolnád magad, és van kedved segíteni rajtam, kattints a gombra!', [
        templates.button('Mentsük meg a Földet!', 'ACTIVATE')
      ])
      callSendAPI(sender_psid, response);
      break;

    default:
      standardReply(sender_psid, received_message, "Szia! :) Hogy állsz a múltkori kihívással? Mutatom mégegyszer:");
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
        'Szia ' + user.userFirstName + '! Az én nevem Earthy, és megmutatom, hogy segíthetsz rajtam. Jöhet az első feladat? :)', [
        templates.button("Igen!", 'YES'),
        templates.button('Mesélj magadról!', 'HELP')
        
      ])
      break;
    case 'HELP':
      response = templates.buttonMessage(
        'Tehát, a nevem Earthy, és én vagyok a bolygó, amin élsz. Sajnos az utóbbi időben Ti, emberek nagyon elhanyagoltok engem, rosszul érzem magam, és az állapotom lassan visszafordíthatatlanná válik. :( ' + 
        'Tudod ' + user.userFirstName + ", az a legszomorúbb, hogy a legtöbb ember azt hiszi, nem tehet semmmit. Pedig ha összefogtok, a sok kicsi dolog csodákra képes! :) Készen állsz, hogy megmutassam, hogyan?", [
        templates.button('Igen', 'YES')
      ])
      break;
    case 'DONE':
      response = templates.buttonMessage(
        'Remek, ' + user.userFirstName + '! :) Jöhet még egy kihívás?',
        [templates.button('Igen! :)', 'YES'),
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
        [templates.button('Kész vagyok! :)', 'DONE'),
        templates.button('Másikat kérek', 'ANOTHER')] // ez another volt
      )
      break;

    case 'ANOTHER':
      try {
        nextTip = await db.getNextTipForUser(sender_psid);
        tipText = "Rendben, itt egy másik: \n *" + nextTip.longTitle + ":* " + nextTip.description + '\n Szólj, ha kész vagy!'
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
      response = { "text": 'Sajnálom, ' + user.userFirstName +'. Várlak vissza! :)' }
      break;

    case 'ACTIVATE':
      db.setActive(sender_psid, true);
      standardReply(sender_psid, received_postback, 'Örülök, hogy újra itt vagy, '+ user.userFirstName +'! Folytassuk onnan, ahol a múltkor abbahagytuk. Itt is van a következő kihívás:')
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
  const request = require('request');

  let name = "";
  await name({
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
        const bodyObj = JSON.parse(body);
        name = bodyObj.first_name;
        console.log("First name: " +  name);
        db.addUserName(senderId, name)
      }
    });
    
}

async function generateYes(){
  console.log("YESES:")
  list = (await db.getYes()).variations
  l = list.length
  console.log((list[Math.floor(Math.random() * (l))]))
}

module.exports = { handleMessage, handlePostback, sendInstantMessage }
