const { google } = require('googleapis');
const Emitter = require("events");
const Poll = require("./Poll");
const Command = require("./Command");

const NEW_MESSAGE_EVENT = 'NewMessage';

// Put the following at the top of the file
// right below the'googleapis' import
const util = require('util');
const fs = require('fs');
let emitter = new Emitter();

let liveChatId; // Where we'll store the id of our liveChat
let adminId;
let nextPage; // How we'll keep track of pagination for chat messages
const intervalTime = 5000; // Miliseconds between requests to check chat messages
let interval; // variable to store and control the interval that will check messages
let chatMessages = []; // where we'll store all messages
let badWords = ['хуй', 'пизда', 'снюс', 'гашиш', 'бедтрип']
let poll = new Poll();
let isPolling = false;
let commands = {
  '@poll-start': startListeningPoll,
  '@poll-stop': stopListeningPoll,
  '@*': addVariant,
};

const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);

function startListeningPoll() {
  if(!isPolling) {
    isPolling = true;
    //youtubeService.insertMessage('Poll is start!');
  }
}
function stopListeningPoll() {
  if(isPolling) {
    let report = poll.report();
    poll.clear();
    isPolling = false;
    //youtubeService.insertMessage('Poll is stop!');
    youtubeService.insertMessage(report);
  }
}
function addVariant(variant) {
  if(isPolling) {
    poll.add(variant);
  }
}

const save = async (path, str) => {
  fs.writeFileSync(path, str, function (err) {
    if (err) return console.log(err);
    console.log('Hello World > helloworld.txt');
  });
  console.log('Successfully Saved');
};

const read = async path => {
  const fileContents = await readFilePromise(path);
  return JSON.parse(fileContents);
};

const youtube = google.youtube('v3');
const OAuth2 = google.auth.OAuth2;

const clientId = '582503504062-rgps5t3lmfghoupj1mthtpnffn9ua83h.apps.googleusercontent.com';
const clientSecret = '6Wl8oL7GlYWLgq98Ur-PfTn0';
const redirectURI = 'http://localhost:3000/callback';

// Permissions needed to view and submit live chat comments
const scope = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

const auth = new OAuth2(clientId, clientSecret, redirectURI);

const youtubeService = {};

youtubeService.getCode = response => {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope
  });
  response.redirect(authUrl);
};

// Request access from tokens using code from login
youtubeService.getTokensWithCode = async code => {
  const credentials = await auth.getToken(code);
  youtubeService.authorize(credentials);
};

// Storing access tokens received from google in auth object
youtubeService.authorize = ({ tokens }) => {
  auth.setCredentials(tokens);
  console.log('Successfully set credentials');
  console.log('tokens:', tokens);
  save('./tokens.json', JSON.stringify(tokens));
};

youtubeService.findActiveChat = async () => {
  const response = await youtube.liveBroadcasts.list({
    auth,
    part: 'snippet,status',
    mine: 'true',
    maxResults: 50
  });
  const chats = response.data.items;
  chats.forEach((chat) => {
      if(chat.status.lifeCycleStatus === 'live') {
        liveChatId = chat.snippet.liveChatId;
        adminId = chat.snippet.channelId;
        console.log("Chat ID Found:", liveChatId);
        return 1;
      }
  });
  if(liveChatId === undefined)
    console.log("No Active Chat Found");
  // const latestChat = chats[0];
  // if (latestChat && latestChat.snippet.liveChatId) {
  //   liveChatId = latestChat.snippet.liveChatId;
  //   console.log("Chat ID Found:", liveChatId);
  // } else {
  //   console.log("No Active Chat Found");
  // }
};

// Update the tokens automatically when they expire
auth.on('tokens', tokens => {
  if (tokens.refresh_token) {
    // store the refresh_token in my database!
    save('./tokens.json', JSON.stringify(auth.tokens));
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

// Read tokens from stored file
const checkTokens = async () => {
  const tokens = await read('./tokens.json');
  if (tokens) {
    auth.setCredentials(tokens);
    console.log('tokens set');
  } else {
    console.log('no tokens set');
  }
};

const respond = newMessages => {
  newMessages.forEach(message => {
    const messageText = message.snippet.displayMessage.toLowerCase();
    if (messageText.includes('thank')) {
      const author = message.authorDetails.displayName;
      const response = `You're welcome ${author}!`;
      youtubeService.insertMessage(response);
    }
  });
};

const messagesFilter = (messages) => {
  var goodMessages = [];
  messages.forEach((message) => {
        let messageText = message.snippet.textMessageDetails.messageText;
        let messageId = message.id;
        let isGood = false;
        badWords.forEach((badWord) => {
          if(messageText.includes(badWord))
            youtubeService.deleteMessage(messageId);
          else
            isGood = true;
        });
        if(isGood)
          goodMessages.push(message);
      }
  );
  return goodMessages;
};

const getChatMessages = async () => {
  const response = await youtube.liveChatMessages.list({
    auth,
    part: 'id,snippet,authorDetails',
    liveChatId,
    pageToken: nextPage
  });
  const { data } = response;
  let newMessages = data.items;
  newMessages = messagesFilter(newMessages);
  chatMessages.push(...newMessages);
  nextPage = data.nextPageToken;
  newMessages.forEach((newMessage) => {
    emitter.emit(NEW_MESSAGE_EVENT, newMessage);
  });
  console.log('Total Chat Messages:', chatMessages.length);
  respond(newMessages);
};

const onNewMessage = (message) => {
  let command = detectCommand(message);
  if(!command)
    return ;
  command.exec();
}

const detectCommand = (message) => {
  let authorId = message.authorDetails.channelId;
  let messageText = message.snippet.textMessageDetails.messageText;
  let command = new Command(commands);
  command.load(messageText);
  if(adminId == authorId && command.validate())
  {
    return command;
  }
  return false;
}



youtubeService.startTrackingChat = () => {
  interval = setInterval(getChatMessages, intervalTime);
  emitter.on(NEW_MESSAGE_EVENT, onNewMessage);
  return interval;
};

youtubeService.stopTrackingChat = () => {
  clearInterval(interval);
};

youtubeService.insertMessage = messageText => {
  youtube.liveChatMessages.insert(
    {
      auth,
      part: 'snippet',
      resource: {
        snippet: {
          type: 'textMessageEvent',
          liveChatId,
          textMessageDetails: {
            messageText
          }
        }
      }
    },
    () => {}
  );
};

youtubeService.deleteMessage = messageId => {
  youtube.liveChatMessages.delete(
      {
        auth,
        id: messageId,
      },
      () => {}
  );
};

checkTokens();

// As we progress throug this turtorial, Keep the following line at the nery bottom of the file
// It will allow other files to access to our functions
module.exports = youtubeService;
