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

let gameData = JSON.parse(fs.readFileSync('./game_data.json'));
for(let pos of gameData.boxes){
    let box = new Box3(new Vector3(-1,-1,-1), new Vector3(1, 1, 1));
    box.translate(pos);
    hashGrid.insert(box);
}

//   id     pos    dir
// { 123: [x,y,z, x,y,z], 234: [x,y,z, x,y,z]}
const PLAYERS = {};
const SOCKETS = {};

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
        /*
    	if (data.bullets){
            let ray = new Ray();
            let impactPoint = new Vector3();
            let closestImpact = 0;
            let tmp = new Vector3();
            let intersection;

            for (let bullet of data.bullets){
                closestImpact = 100000;

                ray.origin.set(bullet.origin.x, bullet.origin.y, bullet.origin.z);
                ray.direction.set(bullet.direction.x, bullet.direction.y, bullet.direction.z);

                for (let box of hashGrid.possible_ray_collisions(ray)){
                    intersection = ray.intersectBox(box, impactPoint);

                    if (intersection){
                        let length = tmp.subVectors(impactPoint, ray.origin).length();
                        if (length < closestImpact) {
                            closestImpact = length;
                            //console.log(`hit box at ${closestImpact}`)
                        }
                    }
                }

                for (let player in PLAYERS){
                    if (player != id){

                        let box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
                        let position = PLAYERS[player];
                        box.translate(new Vector3(position[0], position[1], position[2]));

                        intersection = ray.intersectBox(box, impactPoint);
                        if (intersection){
                            let length = tmp.subVectors(impactPoint, ray.origin).length();

                            if (length < closestImpact){
                                // console.log(`hit player at ${length}`)
                                response.hit = player
                                SOCKETS[player].send(JSON.stringify({'hit_by': id, 'damage': bullet.damage}));
                            } 
                        }
                    }
                }
            }
    	}    
        */

        console.log(PLAYERS)
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
