const express = require('express');
const http = require('http')
const websocket = require('ws')

const app 		= express();
const server 	= http.createServer(app);
const wss 		= new websocket.Server({ server });

const PLAYERS = {}

wss.on('connection', (ws) => {

	let id = 0

    ws.on('message', message => {

    	let player_data = JSON.parse(message)

    	if (id == 0){
	       	id = player_data.id;
    	}	

        if (player_data.action == "update"){
        	PLAYERS[id] = player_data.player_data
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