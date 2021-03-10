const express   = require('express');
const http      = require('http');
const websocket = require('ws');

//const { Ray, AABB, Vector3 } = require('./collision.js')
const { Ray } = require('./Ray.js')
const { Box3 } = require('./Box3.js')
const { Vector3 } = require('./Vector3.js');

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
                    client.send(JSON.stringify({connected: [{ 'id': id, 'player_data': data.player_data}]}))
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
            // TODO check if the bullet hit a box, if so 

            let ray = new Ray();

            for (let bullet of data.bullets){
                
                ray.origin      = bullet.origin;
                ray.direction   = bullet.direction;

                for (let player in PLAYERS){
                    if (player != id){
                        console.log("check")
                        let box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));

                        let position = PLAYERS[player];
                        box.translate(new Vector3(position[0], position[1], position[2]));

                        if (ray.intersectsBox(box)){

                            console.log(`hit ${Date.now()}`)

                            response.hit = player
                            
                            SOCKETS[player].send(JSON.stringify({'hit_by': id, 'damage': bullet.damage}));
                        }
                    }
                }
            }


            /*
            let box = new AABB([0,0,0], new Vector3(1,2,1));

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
            */
    	}    

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
