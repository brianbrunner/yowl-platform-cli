var argv = require('yargs').argv,
    local = argv.local,
    auth = argv.auth,
    sessionId = argv.session || "local";

// Define our platform characteristics

var bot_name = "";
var platform = {
  name: "local",
  capabilities: ["say", "actions"],
  send: function(context, event, response, cb) {
    if (typeof response == "string") {
      console.log(bot_name + ' > ' + response);
    } else {
      console.log(bot_name + ' > ' + response.message);
      if (response.actions) {
        var actionsString = '[' + response.actions.join(',') + ']';
        console.log(bot_name + ' > ' + actionsString);
      }
    }
    cb(null, context, event, response);
  }
};

// Define our stdin listener

function listener(bot) {
  return function(buffer) {
    var line = buffer.toString();
    var truncatedLine = line.slice(0,line.length-1);
    bot(platform, { sessionId: sessionId }, { type: 'message', message: truncatedLine }, oncomplete);
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

exports = module.exports = function(bot) {

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
