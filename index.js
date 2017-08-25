var argv = require('yargs').argv,
    unfluff = require('unfluff'),
    request = require('request'),
    local = argv.local,
    auth = argv.auth,
    sessionId = argv.session || "local";

// Define our platform characteristics

var bot_name = "";
var platform = module.exports = function(bot) {

  if (local) {

    bot_name = bot.display_name;
    process.stdin.setRawMode(false);
    process.stdout.write("> ");
    process.stdin.on('data', listener(bot)); 
    if (auth) {
      bot(platform, { sessionId: sessionId }, { type: 'authenticate' }, oncomplete);
    }

  }

};

var current_actions;

platform.id = "local";
platform.capabilities = ["say", "actions"];
platform.send = function(context, event, response, cb) {
  if (typeof response == "string") {
    console.log(bot_name + ' > ' + response);
  } else {
    console.log(bot_name + ' > ' + response.message);
    if (response.actions) {
      current_actions = response.actions;
      var action_strings = response.actions.map(function(action) {
        if (typeof action == "string") {
          return action;
        } else {
          var action_string = action.title;
          if (action.url) {
            action_string += ' (' + action.url + ')'
          }
          return action.title;
        }
      });
      console.log(bot_name + ' > Choose an action by entering its number:');
      action_strings.forEach(function(action_string, index) {
        console.log(''+index+' > ' + action_string);
      });
    }
  }
  cb(null, context, event, response);
}

// Define our stdin listener

function listener(bot) {
  return function(buffer) {
    var line = buffer.toString();
    var truncatedLine = line.slice(0,line.length-1);
    if (current_actions && !isNaN(parseInt(truncatedLine))) {
      var action = current_actions[parseInt(truncatedLine)];
      current_actions = null;
      if (typeof action === "string") {
        bot(platform, { sessionId: sessionId }, { type: 'action', message: action, action: action }, oncomplete);
      } else if (action.url) {
        request(action.url, function (error, response, body) {
          var article = unfluff(body);
          console.log(bot_name + ' > Processed Body For ' + article.title);
          console.log('\n'+article.text+'\n');
          oncomplete(null, null, null, function() {});
        });
      } else {
        bot(platform, { sessionId: sessionId }, { type: 'action', message: action.payload, action: action.payload }, oncomplete);
      }
    } else {
      bot(platform, { sessionId: sessionId }, { type: 'message', message: truncatedLine }, oncomplete);
    }
  };
}

function oncomplete(err, context, event, cb) {
  if (err) {
    event.send("Uh oh! Something went wrong!", function(err, context, event, response) {
      process.stdout.write("> ");
      cb(err, context, event);
    });
  } else {
    process.stdout.write("> ");
    cb(err, context, event);
  }
}

