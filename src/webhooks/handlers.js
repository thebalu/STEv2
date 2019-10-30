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
        'Sajnálom, hogy itt hagysz engem. Ha meggondolnád magad, és van kedved segíteni rajtam, kattints a gombra!', [
        templates.button('Mentsük meg a Földet!', 'ACTIVATE')
      ])
      callSendAPI(sender_psid, response);
      break;

    default:
      gernarateString("smiley")
        .then(smiley => standarReply(standardReply(sender_psid, received_message, ("Szia! " + smiley +" Hogy állsz a múltkori kihívással? Mutatom mégegyszer:"))));
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
      await db.newUser(sender_psid);
      await getAndSaveUserFirstName(sender_psid)
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
      response = templates.buttonMessage(
        'Szia ' + user.userFirstName + '! Az én nevem Earthy, és megmutatom, hogy segíthetsz rajtam. Jöhet az első feladat? :)', [
        templates.button((await(generateString("yes"))) + (await generateString("exclamation")) + " " + (await generateString("smiley")), 'YES'),
        templates.button('Mesélj magadról!', 'HELP')
        
      ])
      break;
    case 'HELP':
      response = templates.buttonMessage(
        'Tehát, a nevem Earthy, és én vagyok a bolygó, amin élsz. Sajnos az utóbbi időben Ti, emberek nagyon elhanyagoltok engem, rosszul érzem magam, és az állapotom lassan visszafordíthatatlanná válik. :( ' + 
        'Tudod ' + user.userFirstName + ", az a legszomorúbb, hogy a legtöbb ember azt hiszi, nem tehet semmmit. Pedig ha összefogtok, a sok kicsi dolog csodákra képes! :) Készen állsz, hogy megmutassam, hogyan?", [
        templates.button((await (generateString("yes"))) + (await generateString("exclamation")), 'YES')
      ])
      break;
    case 'DONE':
      response = templates.buttonMessage(
        (await generateString("good")) + ', ' + user.userFirstName + '! '+ (await generateString("smiley")) +' ' + (await generateString("readyForAnother")),
        [templates.button((await(generateString("yes"))) + (await generateString("exclamation")) + " " + (await generateString("smiley")), 'YES'),
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
        [templates.button((await generateString("finished")) + (await generateString("exclamation")) + " " + (await generateString("smiley")), 'DONE'),
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
        [templates.button((await generateString("finished")), 'DONE'),
        templates.button('Másikat kérek', 'ANOTHER')] // ez another volt
      )
      break;
    case 'NO':
      response = { "text": 'Sajnálom, ' + user.userFirstName +'. Várlak vissza! ' + (await generateString("smiley")) }
      break;

    case 'ACTIVATE':
      db.setActive(sender_psid, true);
      standardReply(sender_psid, received_postback, 'Örülök, hogy újra itt vagy, '+ user.userFirstName +'! Folytassuk onnan, ahol a múltkor abbahagytuk. Itt is van a következő kihívás:')
      break;
  }

  callSendAPI(sender_psid, response)

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
    [templates.button((await generateString("finished")), 'DONE'),
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

var templateType = {
  "yes": "0",
  "finished": "1",
  "good": "2",
  "readyForAnother": "3",
  "smiley": "4",
  "exclamation": "5"
};

const generateString = async (s) => {
  
  var list = (await db.getStringTemplate(templateType[s])).variations 
  var l = list.length
  return ((list[Math.floor(Math.random() * (l))]))
}

module.exports = { handleMessage, handlePostback, sendInstantMessage }
