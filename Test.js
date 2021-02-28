
let cam;
function setup() {
  createCanvas(100, 100, WEBGL);
  requestPointerLock();
  cam = createCamera();
}

function draw() {
  background(255);
  cam.pan(-movedX * 0.001);
  cam.tilt(movedY * 0.001);
  sphere(25);
}
