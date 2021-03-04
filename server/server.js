const express = require('express');
const http = require('http')
const websocket = require('ws')

const app 		= express();
const server 	= http.createServer(app);
const wss 		= new websocket.Server({ server });

const PLAYERS = {}

// TODO: do bullet collision on server

wss.on('connection', (ws) => {

	let id = -1

    ws.on('message', message => {

    	let data = JSON.parse(message)

    	if (id == -1) id = data.id;

        if (data.action == "update"){
        	PLAYERS[id] = data.player_data
	        ws.send(JSON.stringify({"type": "state", "players": PLAYERS}))
        	console.log(PLAYERS)
        }
    });

    ws.on('close',() => {
    	delete(PLAYERS[id])
    })
});

server.listen(process.env.PORT || 6788, () => {
    console.log(`Server started on port ${server.address().port}`);
});