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


module.exports = {button, buttonMessage}