const express = require('express');
const path = require('path');
// const Bot = require('./Bot');

const youtubeService = require('./youtubeService.js');

// let bot = new Bot(youtubeService);

const server = express();

let streams = [];

server.get('/', (req, res) =>
  res.sendFile(path.join(__dirname + '/index.html'))
);

server.get('/authorize', (request, response) => {
  console.log('/auth');
  youtubeService.getCode(response);
});

server.get('/callback', (req, response) => {
  const { code } = req.query;
  youtubeService.getTokensWithCode(code);
  response.redirect('/');
});

server.get('/find-active-chat', (req, res) => {
  youtubeService.findActiveChat();
  res.redirect('/');
});

server.get('/start-tracking-chat', (req, res) => {
  let stream = youtubeService.startTrackingChat();
  streams.push(stream);
  console.log(stream);
  res.redirect('/');
});

server.get('/stop-tracking-chat', (req, res) => {
  youtubeService.stopTrackingChat();
  res.redirect('/');
});

server.get('/insert-message', (req, res) => {
  youtubeService.insertMessage('Hello World');
  res.redirect('/');
});

server.listen(3000, function() {
  console.log('Server is Ready');
});
