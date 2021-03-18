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
            }
            response.objects = OBJECTS;
    	}

        ws.send(JSON.stringify(response));
	});

	ws.on('close',() => {
    	// notify the others of disconnected player

        let disconnected_objects = [];

        for (let [id, object] of Object.entries(OBJECTS)){
            if (object.connection == cid){
                delete(OBJECTS[id]);
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
