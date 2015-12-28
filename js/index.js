var renderer = new THREE.WebGLRenderer({antialias: true});

// cardboard/paper stuff
var camera, scene, renderer;
var effect, controls;
var element, container;

var mesh;

var clock = new THREE.Clock();

var _pt;

var settings = {
  scale: 1/70,
  modelSize: 44.0,
  filtering: {
    enabled: true,
    num_samples: 3
  },
  prediction: {
    enabled: false,
    delta: 0.05
  }
};

var useMarkerOrientation = false;

var num_samples = settings.filtering.num_samples;

var max = moving_average(num_samples);
var may = moving_average(num_samples);
var maz = moving_average(num_samples);

effect = new THREE.StereoEffect(renderer);

_pt = new GP.PaperTracker(settings);

_pt.postInit();

function setOrientationControls(e) {
  if (!e.alpha) {
    return;
  }

  controls = new THREE.DeviceOrientationControls(camera, true);
  controls.connect();
  controls.update();

  element.addEventListener('click', fullscreen, false);

  window.removeEventListener('deviceorientation', setOrientationControls);
}
  window.addEventListener('deviceorientation', setOrientationControls, true);

/*function resize() {
  var width = container.offsetWidth;
  var height = container.offsetHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  effect.setSize(width, height);
}*/

function update(dt) {
  // resize();

  camera.updateProjectionMatrix();

  controls.update(dt);

  var success = _pt.process();

  if (success && _pt.updateTracking() && _pt.trackingInfo.translation !== undefined) {
    updateObject(camera, _pt.trackingInfo.rotation, _pt.trackingInfo.translation, _pt.camDirection);
  }
}

function updateObject(obj, rotation, translation, camDir){
  var trans = translation;
  if (trans === undefined) {
    return false;
  }
  var tx = !settings.filtering.enabled ? -trans[0] : max(-trans[0]);
  var ty = settings.filtering.enabled ? may(trans[1]) : trans[1];
  var tz = settings.filtering.enabled ? maz(trans[2]) : trans[2];

  obj.position.x = tx * settings.scale * (camDir == 'back' ? -1 : 1);
  obj.position.y = ty * settings.scale + 10;
  obj.position.z = tz * settings.scale - 0.5;

  if (useMarkerOrientation && false) {
    obj.rotation.x = -Math.asin(-rotation[1][2]);
    obj.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
    obj.rotation.z = Math.atan2(rotation[1][0], rotation[1][1]);
  }
}

function fullscreen() {
  if (container.requestFullscreen) {
    container.requestFullscreen();
  } else if (container.msRequestFullscreen) {
    container.msRequestFullscreen();
  } else if (container.mozRequestFullScreen) {
    container.mozRequestFullScreen();
  } else if (container.webkitRequestFullscreen) {
    container.webkitRequestFullscreen();
  }
}


// real stuff below


// Setup three.js WebGL renderer

renderer.setClearColor(0xddddfd);

// Append the canvas element created by the renderer to document body element.
document.body.appendChild(renderer.domElement);

// Create a three.js scene
var scene = new THREE.Scene();

// Create a three.js camera
var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000);
scene.add(camera);
camera.position.set(0, 1, 0);

// Apply VR headset positional data to camera.
var controls = new THREE.VRControls(camera);

// Apply VR stereo rendering to renderer
var effect = new THREE.VREffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);

// VR Scene Below

// yay constants
var pi = 3.141592653589793238;
var phi = 1.618033988749894848;
var tau = 6.28318530717958;

scene.fog = new THREE.FogExp2(0xddddfd, 0.07);

var everything = new THREE.Object3D();
scene.add(everything);

// ground
var groundGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
var groundMaterial = new THREE.MeshLambertMaterial({color: 0xffffff});
var ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -pi / 2;
everything.add(ground);

for (var i = 0; i<ground.geometry.vertices.length; i++) {
  ground.geometry.vertices[i].z = (Math.random() + 1) - 1.5 * Math.sin(ground.geometry.vertices[i].y/5) - 1.5 * Math.sin(ground.geometry.vertices[i].x/5) - 2.8 * Math.cos(ground.geometry.vertices[i].y/18);
}

// sky
var skyGeometry = new THREE.PlaneGeometry(100, 100, 50, 50);
var skyMaterial = new THREE.MeshBasicMaterial({color: 0xbcbcbc});
var sky = new THREE.Mesh(skyGeometry, skyMaterial);
sky.rotation.x = -pi / 2;
sky.position.y = 12;
everything.add(sky);
for (var i = 0; i<sky.geometry.vertices.length;i++) {
  sky.geometry.vertices[i].z = 2.3 * Math.sin(sky.geometry.vertices[i].y / 5) - 1.2 * Math.sin(sky.geometry.vertices[i].x / 4);
}

// snow
var snowFloor = -3;
var particles = new THREE.Geometry();
var partCount = 2200;
for (var p = 0; p<partCount; p++) {
  var part = new THREE.Vector3(
    24 * Math.random() - 12,
    12 * Math.random() + snowFloor,
    24 * Math.random() - 12
);
  part.velocity = new THREE.Vector3(
    Math.random() / 100,
    -Math.random() * 0.05,
    Math.random() / 100
);
  particles.vertices.push(part);
}
var partMat = new THREE.PointCloudMaterial({color: 0xffffff, size: 0.09});
var partSystem = new THREE.PointCloud(particles, partMat);
partSystem.sortParticles = true;
partSystem.frustumCulled = false;
everything.add(partSystem);

// normal trees
var tree = [];
var treeVector = [];
var treeHeight = [];
var treeWidth = [];
var treeNumber = 18;
for (var i = 0; i<treeNumber; i++) {
  treeVector[i] = new THREE.Vector2();
  treeWidth[i] = Math.random() / 4 + 1;
  treeHeight[i] = Math.random() * 7 + 3;
  tree[i] = new THREE.Mesh(
    new THREE.CylinderGeometry(0.01, treeWidth[i], treeHeight[i]),
    new THREE.MeshLambertMaterial({color: 0x00bb00})
  );
  tree[i].position.x = Math.random() * 100 - 50;
  tree[i].position.z = Math.random() * 100 - 50;
  everything.add(tree[i]);
}

// cool trees
// TODO: MAKE BRANCH AN ARRAY OF AN ARRAY
var pine = [];
var branch = [];
var pineNumber = 20;
for (var i = 0; i<pineNumber; i++) {
  var b = 0;
  pine[i] = new THREE.Object3D();
  // trunk
  var treeTrunkHeight = 0.1 + Math.random() / 5;
  var treeTrunkWidth = Math.random() * (0.3 - 0.2) + 0.2;
  var treeTrunk = new THREE.Mesh(
    new THREE.CylinderGeometry(treeTrunkWidth - 0.05, treeTrunkWidth, treeTrunkHeight),
    new THREE.MeshLambertMaterial({color: 0x330000})
  );
  treeTrunk.position.y = treeTrunkHeight / 2;
  pine[i].add(treeTrunk);
  // branches
  branch[i] = [];
  var branchNumber = Math.random() * 20 + 30;
  var outness = 0.3 + Math.random() / 3;
  var pineSlope = Math.random() * 3 + 2;
  for (b = 0; b<branchNumber; b++) {
    branch[i][b] = new THREE.Mesh(
      new THREE.TetrahedronGeometry(0.5),
      new THREE.MeshLambertMaterial({color: 0x00ee00})
    );
    var branchSlope = -Math.random();
    branch[i][b].geometry.vertices[1].z = 1 + outness;
    branch[i][b].geometry.vertices[1].y = branchSlope;
    branch[i][b].position.y = b / branchNumber * (0.7 + 1.3 / (b + 1)) + treeTrunk.position.y + treeTrunkHeight;
    branch[i][b].rotation.y = b * phi * tau;
    var branchScale = 2*(branchNumber + 1 - b)/(pineSlope * branchNumber + 1);
    branch[i][b].scale.set(branchScale, branchScale, branchScale);
    pine[i].add(branch[i][b]);
  }
  var treeScale = Math.random() + 5;
  pine[i].scale.set(treeScale, treeScale, treeScale);
  pine[i].position.x = Math.random() * 100 - 50;
  pine[i].position.z = Math.random() * 100 - 50;
  everything.add(pine[i]);
}

// snowmen
var snowman = [];
var bodyPart = [];
var face = [];
var leftEye = [];
var rightEye = [];
var nose = [];
var mouth = [];
var snowmanNumber = 1;
var bodyPartNumber = 3;
var maxDimensions = 1.5;
for (i = 0; i<snowmanNumber; i++) {
  // body
  snowman[i] = new THREE.Object3D();
  bodyPart[i] = [];
  for (var j = 0; j<bodyPartNumber; j++) {
    bodyPart[i][j] = new THREE.Mesh(
      new THREE.BoxGeometry(1 - j / 4, 1 - j / 4, 1 - j /4),
      new THREE.MeshLambertMaterial({color: 0xffffff})
    );
    snowman[i].add(bodyPart[i][j]);
    if (bodyPart[i][j - 1]) {
      bodyPart[i][j].position.y = bodyPart[i][j - 1].position.y + (bodyPart[i][j - 1].geometry.parameters.height / 2) + bodyPart[i][j].geometry.parameters.height / 2;
    } else {
      bodyPart[i][j].position.y = (bodyPart[i][j].geometry.parameters.height / 2);
    }
  }
  // face
  face[i] = new THREE.Object3D();
  var eyeSize = bodyPart[i][2] / 8;
  leftEye[i] = new THREE.Mesh(
    new THREE.BoxGeometry(eyeSize, eyeSize, eyeSize),
    new THREE.MeshLambertMaterial({color: 0x000000})
  );
  face[i].add(leftEye[i]);
  rightEye[i] = new THREE.Mesh(
    new THREE.BoxGeometry(eyeSize, eyeSize, eyeSize),
    new THREE.MeshLambertMaterial({color: 0x000000})
  );
  snowman[i].add(face[i]);
  //snowman[i].position.x = Math.random() * 100 - 50;
  //snowman[i].position.z = Math.random() * 100 - 50;
  everything.add(snowman[i]);
}
snowman[0].position.set(0,0,0);

// lights
var light = new THREE.PointLight(0xffffff, 1.25, 100);
light.position.set(0, 25, 0);
light.castShadow = true;
everything.add(light);

// directional cubes because I am completely unable to think spatially
var cubePosX = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0x00ff00}));
cubePosX.position.set(1, 3, 0);
// everything.add(cubePosX);

var cubePosY = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0x0000ff}));
cubePosY.position.set(0, 4, 0);
// everything.add(cubePosY);

var cubePosZ = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({color: 0xff0000}));
cubePosZ.position.set(0, 3, 1);
// everything.add(cubePosZ);

/* sled which I can't
  var sled = new THREE.Object3D();

  // var sledCenter = new THREE.Mesh(
  //  new THREE.TetrahedronGeometry(),
  //  new THREE.MeshLambertMaterial({color: 0xffff00})
  //);
  // sledCenter.scale.set(0.1,0.1,0.1);
  // sled.add(sledCenter);

  var sledFront = new THREE.Mesh(
    new THREE.TetrahedronGeometry(),
    new THREE.MeshLambertMaterial({color: 0x550000})
);
  sledFront.position.z = 0.5;
  sledFront.scale.set(0.1,0.1,0.1);
  sled.add(sledFront);

  var slat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5,0.05,1),
    new THREE.MeshLambertMaterial({color: 0x330000})
);
  sled.add(slat);

  scene.add(sled);

  // var headProjection = new THREE.Mesh(
  //  new THREE.IcosahedronGeometry(),
  //  new THREE.MeshLambertMaterial({color: 0x0000ff})
  //);
  // headProjection.scale.set(0.1,0.1,0.1);
  // scene.add(headProjection);

  var pos = new THREE.Vector2;
  var moveVector = new THREE.Vector2;
  var crouchHeight = 1.2;
  var crouchToggleHeight = 0.5;
  var sledDistance = 0.8;
  var speed = 0.2;
  var sledToggle = 0;
  var sledToggleDistance = 0.4;

  var t = 0;*/

/*
Request animation frame loop function
*/
function render(dt) {
  effect.render(scene, camera);
}
function animate() {
  // Apply any desired changes for the next frame here.
  for (var p = 0; p<partCount; p++) {
    // check if we need to reset particles
    if (particles.vertices[p].y<snowFloor) {
      particles.vertices[p].set(
        24 * Math.random() - 12 + camera.position.x,
        12 * Math.random(),
        24 * Math.random() - 12 + camera.position.z);
      particles.vertices[p].velocity.x = Math.random() / 100;
      particles.vertices[p].velocity.y = -Math.random() * 0.1;
      particles.vertices[p].velocity.z = Math.random() / 100;
    }

    particles.vertices[p].y += particles.vertices[p].velocity.y;
    particles.vertices[p].z += particles.vertices[p].velocity.z;
    particles.vertices[p].x += particles.vertices[p].velocity.x;
  }
  light.position.x = camera.position.x - 10;
  light.position.z = camera.position.z + 6;

  requestAnimationFrame(animate);

  update(clock.getDelta());
  render(clock.getDelta());
}

animate();	// Kick off animation loop


/*
Listen for click event to enter full-screen mode.
We listen for single click because that works best for mobile for now

document.body.addEventListener('click', function(){
  effect.setFullScreen(true);
})

/*
Listen for keyboard events

function onkey(event) {
  event.preventDefault();

  if (event.keyCode == 90) { // z
    camera.rotation.z = 0; //zero rotation
  } else if (event.keyCode == 70 || event.keyCode == 13) { //f or enter
    effect.setFullScreen(true) //fullscreen
  }
};
window.addEventListener("keydown", onkey, true);

/*
Handle window resizes

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  effect.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize, false);

/*
stuff TODO
make things actually be on the ground
make cone trees actually be cones
*/
