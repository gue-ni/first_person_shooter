const express   = require('express');
const http      = require('http');
const websocket = require('ws');

const app 	    = express();
const server 	= http.createServer(app);
const wss 	    = new websocket.Server({ server });

// serve frontend 
app.use(express.static('../client'));

//   id     pos    dir
// { 123: [x,y,z, x,y,z], 234: [x,y,z, x,y,z]}
const PLAYERS = {};

// TODO: do bullet collision on server
// TODO: create broadcast function

wss.on('connection', (ws) => {
	let id = -1;

	ws.on('message', message => {

		let data = JSON.parse(message);
    	let response = {};

		if (id == -1) { // first message
        	id = data.id;

        	// notify users of new player
            wss.clients.forEach( client => {
                if (client !== ws && client.readyState === websocket.OPEN){

                    let new_player = { 'id': id, 'player_data': data.player_data};

                    client.send(JSON.stringify({connected: [new_player]}))
                }
            })

            // notify user of other connected players
            let connected_players = []

            for (let player_id in PLAYERS){
                connected_players.push({'id': player_id, 'player_data': PLAYERS[player_id]})
            }

            if (connected_players.length > 0){
                ws.send(JSON.stringify({connected: connected_players}))
            }

    	}

    	if (data.player_data){
    		PLAYERS[id] = data.player_data;
        	response.players = PLAYERS;
        	ws.send(JSON.stringify(response));
    	}

    	if (data.bullets){
        	console.log("shot fired");
    	}    
    	//console.log(response)
	});

	ws.on('close',() => {
    	// notify the others of disconnected player
        wss.clients.forEach( client => {
            if (client !== ws && client.readyState === websocket.OPEN){
                client.send(JSON.stringify({disconnected: id}))
            }
        })
		delete(PLAYERS[id]);
	})
});

server.listen(process.env.PORT || 5000, () => {
 	console.log(`Multiplayer server started at http://localhost:${server.address().port}`);
});
