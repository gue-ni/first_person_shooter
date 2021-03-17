const express   = require('express');
const http      = require('http');
const websocket = require('ws');
const fs        = require('fs');

const { Ray }       = require('./Ray.js')
const { Box3 }      = require('./Box3.js')
const { Vector3 }   = require('./Vector3.js');
const { HashGrid }  = require('./HashGrid.js');

const app 	    = express();
const server 	= http.createServer(app);
const wss 	    = new websocket.Server({ server });

const hashGrid = new HashGrid(2);

// serve frontend 
app.use(express.static('../client'));

//   id           pos    dir
// { 123: { pd: [x,y,z, x,y,z], ... }, 234: { pd: [x,y,z, x,y,z], ... }}
const OBJECTS = {};

const SOCKETS = {};

wss.on('connection', (ws) => {
	let connectionId = -1;

	ws.on('message', message => {
		let data = JSON.parse(message);
    	let response = {};

		if (connectionId == -1) { // first message
        	connectionId = data.id;
            
            console.log(`new connection ${connectionId}`);
            
            SOCKETS[id] = ws;

        	// notify users of new player
            /*
            wss.clients.forEach( client => {
                if (client !== ws && client.readyState === websocket.OPEN){
                    client.send(JSON.stringify({connected: [{ 'id': connectionId, 'player_data': data.player_data}]}))
                }
            })

            // notify user of other connected players
            let connected_players = []

            for (let objectId in OBJECTS){
                connected_players.push({'id': objectId, 'player_data': OBJECTS[objectId]})
            }

            if (connected_players.length > 0){
                ws.send(JSON.stringify({connected: connected_players}))
            }
            */
    	}

    	if (data.player_data){
    		OBJECTS[id] = data.player_data;
            response.players = OBJECTS;
    	}

        console.log(OBJECTS)
        ws.send(JSON.stringify(response));
	});

	ws.on('close',() => {
    	// notify the others of disconnected player
        wss.clients.forEach( client => {
            if (client !== ws && client.readyState === websocket.OPEN){
                client.send(JSON.stringify({disconnected: id}))
            }
        });
		delete(OBJECTS[id]);
        delete(SOCKETS[id]);
	})
});

server.listen(process.env.PORT || 5000, () => {
 	console.log(`Multiplayer server started at http://localhost:${server.address().port}`);
});
