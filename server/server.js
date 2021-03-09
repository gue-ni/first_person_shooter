const express   = require('express');
const http      = require('http');
const websocket = require('ws');

const { Ray, AABB, Vector3 } = require('./collision.js')

const app 	    = express();
const server 	= http.createServer(app);
const wss 	    = new websocket.Server({ server });

// serve frontend 
app.use(express.static('../client'));

//   id     pos    dir
// { 123: [x,y,z, x,y,z], 234: [x,y,z, x,y,z]}
const PLAYERS = {};
const SOCKETS = {};

// TODO: do bullet collision on server
// TODO: create broadcast function

wss.on('connection', (ws) => {
	let id = -1;
    console.log("new connection");

	ws.on('message', message => {

		let data = JSON.parse(message);
    	let response = {};

		if (id == -1) { // first message
        	id = data.id;
            SOCKETS[id] = ws;

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
    	}

    	if (data.bullets){
            let box = new AABB([0,0,0], new Vector3(1,2,0.5));

            for (let bullet_ray of data.bullets){
                //console.log(bullet_ray)
                for (let player in PLAYERS){

                    if (player != id){ // don't shoot yourself

                        box.position = PLAYERS[player]
                     
                        if (Ray.intersect_box(bullet_ray, box)){
                            response.hit = player
                            SOCKETS[player].send(JSON.stringify({'hit_by': id, 'damage': bullet_ray[6]}));
                        }
                    }
                }
            }
    	}    
        //console.log(response)
        ws.send(JSON.stringify(response));
	});

	ws.on('close',() => {
    	// notify the others of disconnected player
        wss.clients.forEach( client => {
            if (client !== ws && client.readyState === websocket.OPEN){
                client.send(JSON.stringify({disconnected: id}))
            }
        });
		delete(PLAYERS[id]);
        delete(SOCKETS[id]);
	})
});

server.listen(process.env.PORT || 5000, () => {
 	console.log(`Multiplayer server started at http://localhost:${server.address().port}`);
});
