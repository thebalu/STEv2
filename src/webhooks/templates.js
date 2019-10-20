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

function firstGetUserName(user_psid){
  var https = require('https');
 
  function getCall() {
    //initialize options values, the value of the method can be changed to POST to make https post calls
    var userAccessToken = user_psid;
    var appAccessToken = config.get('Facebook.access_token');
    var options = {
        host :  'graph.facebook.com',
        port : 443,
        path : '/debug_token?input_token=' + userAccessToken + '&access_token=' + appAccessToken,
        method : 'GET'
    }
    ret
    //making the https get call
    var getReq = https.request(options, function(res) {
        console.log("\nstatus code: ", res.statusCode);
        res.on('data', function(data) {
            ret = JSON.parse(data);
            
        });
    });
 
    //end the request
    getReq.end();
    getReq.on('error', function(err){
        console.log("Error: ", err);
    }); 
}
 
  getCall();
  return ret;
}

module.exports = {button, buttonMessage, firstGetUserName}