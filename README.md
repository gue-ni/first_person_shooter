# 3d multiplayer shooter in three.js and websockets

https://developer.mozilla.org/en-US/docs/Games

ground: 0x90b325
boxes: 0xff0051

https://www.donmccurdy.com/2017/11/06/creating-animated-gltf-characters-with-mixamo-and-blender/
https://unboring.net/workflows/animation.html
https://gltf-viewer.donmccurdy.com/
http://touchcontrols.kissr.com/

## TODO
* improve physics

## Software Architecture

* GameObject
* Components

Components belong to a GameObject. Components can communicate by publishing and subscribing to events.

### Networking

Messages:
* take damage
* hit something
* connected/disconnected player
* 
