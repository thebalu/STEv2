const templates = require('./templates')
const db = require('../resources/dbAPI')
const request = require('request')
const config = require('config')

let titleAdded = false
let descriptionAdded = false
let title
let tipDescription

const handleMessage = async (sender_psid, received_message) => {
  console.log("Received message: " + received_message.text)
  let user = await db.getUser(sender_psid);
  // db.getUser(sender_psid)
  //       .then(u => {
  //         user = u;
  //         console.log("set user," + user);
  //       });
  console.log("User: " + user);
  var lan = user.language;
  if (titleAdded) {
    titleAdded = false
    title = received_message.text
    response = { "text": 'Add meg a kihívás leírását!' };
    descriptionAdded = true
    callSendAPI(sender_psid, response);
  }
  else if (descriptionAdded) {
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
    case 'unsubscribe':
      db.setActive(sender_psid, false);
      var leaving = await generateString("leaving", lan)
      var saveTheEarth = await generateString("saveTheEarth", lan)
      let response = templates.buttonMessage(
        leaving, [
        templates.button(saveTheEarth, 'ACTIVATE')
      ])
      callSendAPI(sender_psid, response);
      break;
    case 'lb':
      await showLaderboard()
      break;
    default:
      var hi = await generateString("hi", lan) + await generateString("exclamation", lan)
      var smiley = await generateString("smiley", lan)
      var whatAbout = await generateString("whatAbout",lan)
      standardReply(sender_psid, received_message, (hi + " " + smiley + " " + whatAbout), lan);
      break;
  }

}

const handlePostback = async (sender_psid, received_postback) => {
  let response

  let payload = received_postback.payload

  // Set the response based on the postback payload
  var name = ""
  var lan = ""
  try {
    if (!(await db.getUser(sender_psid))) {
      console.log('Creating user' + sender_psid);
      await db.newUser(sender_psid);
      let ret = await getAndSaveUserFirstName(sender_psid)
      name = ret[0]
      lan = ret[1]
      console.log("Name after getAndSaveUserFirstName: " + name)
    }
  } catch (error) {
    console.error("Promise rejected" + error)
  }
  if (name == ""){
    console.log("Getting user data from database.")
    var user = (await db.getUser(sender_psid))
  lan = user.language;
  }
  
  switch (payload) {
    case 'GET_STARTED':
      console.log("GETSTARTED")
      console.log(user)
      console.log(lan)
      hi = await generateString("hi", lan) + " " + name + await generateString("exclamation") + " ";

      response = templates.buttonMessage(
        (hi + await (generateString("intro_short", lan))), [
        templates.button((await (generateString("yes", lan))) + (await generateString("exclamation", lan)) + " " + (await generateString("smiley", lan)), 'YES'),
        templates.button((await (generateString("more_intro", lan))), 'HELP')

      ])
      break;
    case 'HELP':
      response = templates.buttonMessage(
        (await (generateString("intro_long", lan))), 
        [templates.button((await (generateString("yes", lan))) + (await generateString("exclamation", lan)), 'YES')
      ])

      break;
    case 'DONE':
      db.addNumberDone(sender_psid, user.done + 1)
      
      if (await maybeShowProgress(sender_psid, user, user.done + 1)){
        response = templates.buttonMessage(
          (await generateString("readyForAnother", lan)),
          [templates.button((await(generateString("yes", lan))) + (await generateString("exclamation", lan)) + " " + (await generateString("smiley", lan)), 'YES'),
          templates.button((await(generateString("enough", lan))), 'NO')]
        )
      }
      else{
        response = templates.buttonMessage(
          (await generateString("good", lan)) + ', ' + user.userFirstName + '! '+ (await generateString("smiley", lan)) +' ' + (await generateString("readyForAnother", lan)),
          [templates.button((await(generateString("yes", lan))) + (await generateString("exclamation", lan)) + " " + (await generateString("smiley", lan)), 'YES'),
          templates.button((await(generateString("enough", lan))), 'NO')]
        )
      }
      break;

    case 'YES':
      var tipText;
      if (await db.checkFinished(sender_psid)) {
        finished = await generateString("finishedAll", lan)
        response = {text: finished}
      } else {
        try {
          let nextTip = await db.getNextTipForUser(sender_psid);
          
          if (user.language=='hu_HU'){
            tipText = "*" + nextTip.longTitle + ":* " + nextTip.description + '\nSzólj, ha kész vagy!'
          }
          else{
            tipText = "*" + nextTip.longTitle_en + ":* " + nextTip.description_en + "\nTell me, when you're ready!"
          }
          
        } catch (error) {
          console.error("promise rejected " + error)
        }
        console.log("TipText:" + tipText)
        let fin = (await generateString("finished", lan)) + (await generateString("exclamation", lan)) + " " + (await generateString("smiley", lan));
        let ano = (await generateString("another", lan));
        response = templates.buttonMessage(
          tipText,
          [templates.button(fin, 'DONE'),
          templates.button(ano, 'ANOTHER')]
        )
      }
      break;

    case 'ANOTHER':
      try {
        nextTip = await db.getNextTipForUser(sender_psid);
        var tipText;
        if (user.language == 'hu_HU'){
          tipText = "Rendben, itt egy másik: \n*" + nextTip.longTitle + ":* " + nextTip.description + '\nSzólj, ha kész vagy!'
        }
        else{
          tipText = "Okay, here is another: \n*" + nextTip.longTitle_en + ":* " + nextTip.description_en + "\nTell me when you're ready!"
        }
       
      } catch (error) {
        console.error("promise rejected " + error)
      }
      let fin = (await generateString("finished", lan)) + (await generateString("exclamation", lan)) + " " + (await generateString("smiley", lan));
      let ano = (await generateString("another", lan));
      response = templates.buttonMessage(
          tipText,
          [templates.button(fin, 'DONE'),
          templates.button(ano, 'ANOTHER')]
      )
      break;
    case 'NO':
      response = { "text": (await generateString("sorry", lan)) + ", " + user.userFirstName + '. ' + (await generateString("seeYou", lan)) + (await generateString("exclamation", lan)) + (await generateString("smiley", lan)) }
      break;

    case 'ACTIVATE':
      db.setActive(sender_psid, true);
      var againBegin = await generateString("againBegin", lan)
      var againEnd = await generateString("againEnd", lan)
      await standardReply(sender_psid, received_postback, againBegin + " " + user.userFirstName + againEnd, lan)
      break;

    case 'TIPTITLE':
      response = { "text": 'Add meg a kihívás rövid címét!' };
      titleAdded = true
      break;
    case 'SAVENEWTIP':
      db.newTip(sender_psid, title, tipDescription)
      response = { "text": 'A kihívásod mentésre került.' };
      break;
    case 'DISCARDNEWTIP':
      await standardReply(sender_psid, received_postback, 'Jöhet még egy kihívás? :)', lan)
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
    "qs": { access_token: config.get('Facebook.access_token')},
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


const standardReply = async (sender_psid, received_message, before_text, lan) => {
  let response1 = { "text": before_text }
  try {
    currentTip = await db.getCurrentTipForUser(sender_psid);
  } catch (error) {
    console.error("Promise rejected" + error);
  }
  if (lan=='hu_HU'){
    tipText = "*" + currentTip.longTitle + ":* " + currentTip.description + '\nSzólj, ha kész vagy!'
  }
  else{
    tipText = "*" + currentTip.longTitle_en + ":* " + currentTip.description_en + "\nTell me when you're done!"
  }
  

  response2 = templates.buttonMessage(
    tipText,
    [templates.button((await generateString("finished", lan)), 'DONE'),
    templates.button((await generateString("another", lan)), 'YES')] // ez another volt
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
      // users = ['2572117989520100', '2707581762588340']
      users = await db.getAllUsers()

    }

    users.forEach(user_id => {
      callSendAPI(user_id, body.message, () => { console.log("Message sent to " + user_id) })
    });

    res.status(200).send(users)
  } else {
    res.status(403).send("You can't do this")
  }
}

var lan = "";
var name = "";

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForLan(){
  while (lan == "" || lan === undefined){
    await sleep(100);
    console.log("wait in waitForLan where lan is: " + lan)
  }
}

async function getAndSaveUserFirstName(senderId) {
  var request = require('request');

  request({
    url: "https://graph.facebook.com/v2.6/" + senderId,
    qs: {
      access_token: config.get('Facebook.access_token'),
      fields: "first_name, locale"
    },
    method: "GET"
  }, function (error, response, body) {
    if (error) {
      console.log("Error getting user's name: " + error);
    } else {
      var bodyObj = JSON.parse(body);
      console.log(bodyObj);
      name = bodyObj.first_name;
      lan = bodyObj.locale;
      console.log("First name: " + name);
      console.log("Language: " + lan);
      db.addUserName(senderId, name)
      db.addUserLanguage(senderId, lan);
      console.log("language ready")
    }
  });
  
  await waitForLan()
  console.log("in getAndFirstName result: " + name);
  return [name, lan];

}

var templateType = {
  "yes": "0",
  "finished": "1",
  "good": "2",
  "readyForAnother": "3",
  "smiley": "4",
  "exclamation": "5",
  "hi": "6",
  "another": "7",
  "enough": "8",
  "intro_short": "9",
  "intro_long": "10",
  "more_intro": "11",
  "sorry": "12",
  "seeYou": "13",
  "progressBegin": "14",
  "progressEnd": "15",
  "whatAbout": "16",
  "leaving": "17",
  "saveTheEarth": "18",
  "finishedAll": "19",
  "againBegin": "20",
  "againEnd": "21"

};

const generateString = async (s, userLanguage) => {
  var list
  if (userLanguage=='hu_HU' || s == "smiley" || s == "exclamation")
    list = (await db.getStringTemplate(templateType[s])).variations
  else
    list = (await db.getStringTemplate(templateType[s])).variations_en
  var l = list.length
  console.log("l: " + l)
  console.log("variations: " + list);
  let r = (list[Math.floor(Math.random() * (l))])
  console.log("generateString return: " + r)
  return (r)
}

const maybeShowProgress = async (sender_psid, user, done) => {
  var r = Math.floor(Math.random() * 3)
  console.log("showing progress")
  var lan = user.language;
  if (r==1){
    good = await generateString("good", lan)
    smiley = await generateString("smiley", lan)
    progB = await generateString("progressBegin", lan)
    progE = await generateString("progressEnd", lan)
    callSendAPI (sender_psid, {text: good + " "+ user.userFirstName + "! " + smiley + " " + progB + " " + done + " " + progE + " " + smiley})
    return true
  }
  return false
}

function writeResults(value, key, map){
  console.log(`m[${key}] = ${value}`);
}

const showLaderboard = async (sender_psid, user, done) => {
  let users = await db.getAllUsers()
  var results = new Map;
  var fe = new Promise ((resolve, reject) => {
    users.forEach(user_id => {
      db.getUser(user_id)
        .then( u => {
          results.set(u.done, u.name);
          console.log("my_user.done " + u.done)
        }
        )
    });
  })

  fe.then(() => {
    console.log("map sort started")
    const mapSort1 = new Map([...results.entries()].sort((a, b) => b[1] - a[1]));
    console.log("mapSort1: " + mapSort1);             // sorted order
  }

  )
  


}

module.exports = { handleMessage, handlePostback, sendInstantMessage }
