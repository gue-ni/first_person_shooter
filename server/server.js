const express   = require('express');
const http      = require('http');
const websocket = require('ws');

const app 		= express();
const server 	= http.createServer(app);
const wss 		= new websocket.Server({ server });

// serve frontend 
app.use(express.static('../client'));

//   id     pos    dir
// { 123: [x,y,z, x,y,z], 234: [x,y,z, x,y,z]}
const PLAYERS = {};

// TODO: do bullet collision on server

wss.on('connection', (ws) => {

	let id = -1;

    ws.on('message', message => {

    	let data = JSON.parse(message);

    	if (id == -1) id = data.id;

        if (data.player_data){
        	PLAYERS[id] = data.player_data;
	        ws.send(JSON.stringify({"players": PLAYERS}));
        	console.log(PLAYERS);
        }

        if (data.bullets){
            console.log("shot fired");
        }    
    });

    ws.on('close',() => {
    	delete(PLAYERS[id]);
        // notify the others of disconnencted player
    })
});

server.listen(process.env.PORT || 5000, () => {
    console.log(`Multiplayer server started on port ${server.address().port}`);
});