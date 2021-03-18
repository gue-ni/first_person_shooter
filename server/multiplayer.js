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

let gameData = JSON.parse(fs.readFileSync('./game_data.json'));
for(let pos of gameData.boxes){
    let box = new Box3(new Vector3(-1,-1,-1), new Vector3(1, 1, 1));
    box.translate(pos);
    hashGrid.insert(box);
}

// serve frontend 
app.use(express.static('../client'));

//   id           pos    dir
// { 123: { pd: [x,y,z, x,y,z], ... }, 234: { pd: [x,y,z, x,y,z], ... }}
const OBJECTS = {};

const PLAYERS = {};

const SOCKETS = {};

wss.on('connection', (ws) => {
	let cid = -1;

	ws.on('message', message => {
		let data = JSON.parse(message);
    	let response = {};

		if (cid == -1) { // first message
        	cid = data.id;            
            console.log(`new connection ${cid}`);
            SOCKETS[cid] = ws;

            wss.clients.forEach( client => {
                if (client !== ws && client.readyState === websocket.OPEN){
                    client.send(JSON.stringify({ 
                        'connected': { 
                            'ids': [cid], 
                            'objects': data.objects
                        }
                    }));
                }
            });

            // notify user of other connected players
            let connected = []
            for (const [id, _] of Object.entries(SOCKETS)){
                if (id != cid) connected.push(id);
            }

            ws.send(JSON.stringify({
                'connected': {
                    'ids': connected,
                    'objects': OBJECTS
                }
            }));
    	}

    	if (data.objects){
            for (const [id, object] of Object.entries(data.objects)){
                object.connection = cid;
                OBJECTS[id] = object;
                if (object.type == "player") {
                    PLAYERS[id] = object;
                }
            }
            response.objects = OBJECTS;
    	}

        //console.log(PLAYERS)

    	if (data.rays){
            let ray = new Ray();
            let impactPoint = new Vector3();
            let closestImpact = 0;
            let tmp = new Vector3();
            let intersection;

            for (let bullet of data.rays){
                closestImpact = 1000;
                
                ray.origin.set(bullet.origin.x, bullet.origin.y, bullet.origin.z);
                ray.direction.set(bullet.direction.x, bullet.direction.y, bullet.direction.z);

                response.hit = [];

                for (let box of hashGrid.possible_ray_collisions(ray)){
                    intersection = ray.intersectBox(box, impactPoint);

                    if (intersection){
                        let length = tmp.subVectors(impactPoint, ray.origin).length();
                        if (length < closestImpact) {
                            closestImpact = length;
                            // console.log(`hit box at ${closestImpact}`)
                        }
                    }
                }

                for (const [id, player] of Object.entries(PLAYERS)){
                    if (id != bullet.owner){
                        
                        let box = new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
                        let pd  = player.pd;
                        box.translate(new Vector3(pd[0], pd[1], pd[2]));

                        intersection = ray.intersectBox(box, impactPoint);
                        if (intersection){
                            let length = tmp.subVectors(impactPoint, ray.origin).length();

                            if (length < closestImpact){
                                console.log(`hit player at ${length}`)
                                
                                response.hit.push({ 
                                    'id': bullet.owner,
                                    'impact': impactPoint
                                });
                                
                                SOCKETS[player.connection].send(JSON.stringify({
                                    'damage': {
                                        'id': id, 
                                        'damage': bullet.damage 
                                    }
                                }));
                            } 
                        }
                    }
                }
            }
    	}    

        ws.send(JSON.stringify(response));
	});

	ws.on('close',() => {
    	// notify the others of disconnected player

        let disconnected_objects = [];

        for (let [id, object] of Object.entries(OBJECTS)){
            if (object.connection == cid){
                delete(OBJECTS[id]);
                if (PLAYERS[id]) delete(PLAYERS[id]);
                disconnected_objects.push(id);
            }
        }

        wss.clients.forEach( client => {
            if (client !== ws && client.readyState === websocket.OPEN){
                client.send(JSON.stringify({
                    'disconnected': {
                        'id': cid,
                        'objects': disconnected_objects
                    }
                }))
            }
        });

        console.log(`lost connection ${cid}`);
        delete(SOCKETS[cid]);
	})
});

server.listen(process.env.PORT || 5000, () => {
 	console.log(`Multiplayer server started at http://localhost:${server.address().port}`);
});
