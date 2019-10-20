// takes a text, and an array of buttons, returns a template
const buttonMessage = (message, buttons) => {
  return {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": message,
        "buttons": buttons
      }
    }
  }
}

const button = (title, postback) => {
  return {
    "type": "postback",
    "title": title,
    "payload": postback
    }
}

function firstGetUserName(user_id){
  info = request({
    url: "https://graph.facebook.com/v2.6/" + user_id + "?",
    qs: {
      access_token: config.get('facebook.access_token')
    },
    headers: {
        'Accept': 'application/json',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'test-bot'
    },
    method: "GET",
    json: true,
    time: true
  }, 
  function(error, res, faceUserInfo) {
   return (error, res, faceUserInfo)
  }
);
}

module.exports = {button, buttonMessage, firstGetUserName}