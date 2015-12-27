
var clock = new THREE.Clock();

var useMarkerOrientation = false, markerBtn;

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


var num_samples = settings.filtering.num_samples;

var max = moving_average(num_samples);
var may = moving_average(num_samples);
var maz = moving_average(num_samples);

var _pt;

function onLoad(){

  _pt = new GP.PaperTracker(settings);

  if (navigator.getUserMedia){
    init();
  }
};

function init(){
  _pt.postInit();

  setupRendering();
  setupScene();
  setupEvents();

  requestAnimationFrame(animate);
};

function setOrientationControls(e) {
  if (!e.alpha) {
    return;
  }

  alpha.innerHTML = e.alpha.toFixed(2);
  beta.innerHTML  = e.beta.toFixed(2);
  gamma.innerHTML = e.gamma.toFixed(2);

  window.removeEventListener('deviceorientation', setOrientationControls);
}

function setupEvents() {
  alpha = document.getElementById('alpha');
  beta  = document.getElementById('beta');
  gamma = document.getElementById('gamma');

  window.addEventListener('deviceorientation', setOrientationControls, true);

  markerBtn = document.getElementById('toggle-marker-orientation');
  markerBtn.addEventListener('click', toggleMarkerOrientation, true);
}

function toggleMarkerOrientation() {
  useMarkerOrientation = !useMarkerOrientation;
  markerBtn.innerHTML = (useMarkerOrientation) ? 'Don\'t Use Marker Orientation' : 'Use Marker Orientation';
}

function animate(){
  requestAnimationFrame(animate);

  var dt = clock.getDelta();

  var success = _pt.process();

  if (success && _pt.updateTracking() && _pt.trackingInfo.translation != undefined) {
    updateObject(camera, _pt.trackingInfo.rotation, _pt.trackingInfo.translation, _pt.camDirection);
    updatePose("pose1", _pt.markers[0].id, "", _pt.trackingInfo.rotation, _pt.trackingInfo.translation);
  }

  mesh.rotation.y += 0.004;

  render(dt);
};

function render(dt){
  renderer.render(scene, camera);
};

function updateObject(obj, rotation, translation, camDir){
  var trans = translation;
  if (trans == undefined) {
    return false;
  }
  var tx = settings.filtering.enabled ? max(-trans[0]) : -trans[0];
  var ty = settings.filtering.enabled ? may(trans[1]) : trans[1];
  var tz = settings.filtering.enabled ? maz(trans[2]) : trans[2];

  obj.position.x = tx * settings.scale * (camDir == 'back' ? -1 : 1);
  obj.position.y = ty * settings.scale;
  obj.position.z = tz * settings.scale - 0.5;

  if (useMarkerOrientation) {
    obj.rotation.x = -Math.asin(-rotation[1][2]);
    obj.rotation.y = -Math.atan2(rotation[0][2], rotation[2][2]);
    obj.rotation.z = Math.atan2(rotation[1][0], rotation[1][1]);
  }
};

function updatePose(elId, id, error, rotation, translation){
  var yaw = -Math.atan2(rotation[0][2], rotation[2][2]);
  var pitch = -Math.asin(-rotation[1][2]);
  var roll = Math.atan2(rotation[1][0], rotation[1][1]);

  var orientationStr = "yaw: " + Math.round(-yaw * 180.0/Math.PI)
              + " pitch: " + Math.round(-pitch * 180.0/Math.PI)
              + " roll: " + Math.round(roll * 180.0/Math.PI);

  var t = translation;

  var d = document.getElementById(elId);
  d.innerHTML = " x: " + (t[0] | 0)
              + " y: " + (t[1] | 0)
              + " z: " + (t[2] | 0)
              + "<br/>" + orientationStr;

  var marker = document.getElementById('marker');
  marker.innerHTML = "markerID: " + id;
};

window.onload = onLoad;
