import asyncio
import json
import logging
import websockets

logging.basicConfig()

STATE = {"players": dict()}
USERS = set()

def state_event():
    return json.dumps({"type": "state", **STATE})

def users_event():
    return json.dumps({"type": "users", "count": len(USERS)})


async def notify_state():
    if USERS:  
        message = state_event()
        await asyncio.wait([user.send(message) for user in USERS])


async def notify_users():
    if USERS:  
        message = users_event()
        await asyncio.wait([user.send(message) for user in USERS])


async def register(websocket):
    USERS.add(websocket)
    await notify_users()


async def unregister(websocket):
    STATE["players"].pop(hash(websocket))
    USERS.remove(websocket)
    await notify_users()

async def unregister2(websocket, id):
    STATE["players"].pop(id)
    USERS.remove(websocket)
    await notify_users()


async def counter(websocket, path):
    await register(websocket)
    player_id = 0

    try:
        await websocket.send(state_event())

        async for message in websocket:

            data = json.loads(message)

            if data["action"] == "update":
                
                player_id = data["id"]       

                STATE["players"][player_id] =  data["player_data"]                
                print(STATE) 
                await notify_state()

            else:
                logging.info("unsupported event: {}", data)
    finally:
        await unregister2(websocket, player_id)


start_server = websockets.serve(counter, "localhost", 6788)
asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()