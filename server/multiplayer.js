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
	let connId = -1;

	ws.on('message', message => {
		let data = JSON.parse(message);
    	let response = {};

		if (connId == -1) { // first message
        	connId = data.id;            
            console.log(`new connection ${connId}`);
            SOCKETS[connId] = ws;

            wss.clients.forEach( client => {
                if (client !== ws && client.readyState === websocket.OPEN){
                    client.send(JSON.stringify({ 
                        'connected': { 
                            'ids': [connId], 
                            'objects': data.objects
                        }
                    }));
                }
            });

            // notify user of other connected players
            let connected = []
            for (const [id, _] of Object.entries(SOCKETS)){
                if (id != connId) connected.push(id);
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
                object.connection = connId;
                OBJECTS[id] = object;
            }
            response.objects = OBJECTS;
    	}

        ws.send(JSON.stringify(response));
	});

	ws.on('close',() => {
    	// notify the others of disconnected player

        wss.clients.forEach( client => {
            if (client !== ws && client.readyState === websocket.OPEN){
                client.send(JSON.stringify({disconnected: connId}))
            }
        });

        for (let [id, object] of Object.entries(OBJECTS)){
            if (object.connection == connId){
                delete(OBJECTS[id]);
            }
        }

        console.log(`lost connection ${connId}`);
        delete(SOCKETS[connId]);
	})
});

server.listen(process.env.PORT || 5000, () => {
 	console.log(`Multiplayer server started at http://localhost:${server.address().port}`);
});
