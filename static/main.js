import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { InstagramFilter } from './vignetteShader.js';
import { LensDistortionShader } from './LensDistortionShader.js'
import { CopyShader } from 'three/addons/shaders/CopyShader.js';

// create a scene 
const scene = new THREE.Scene();

// stereo camera setup here
var stereocam = new THREE.StereoCamera();
stereocam.eyeSep = 1.5;

// scene camera update
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth /2/ window.innerHeight, 0.1, 1000 );
camera.position.set(0, 0, 7);
camera.lookAt(0, 0, 0);
stereocam.update(camera);

// create a timestamp
const clock = new THREE.Clock();

// left and right renderers setup
var half_canvas_seperation = 5;

// left
const rendererLeft = new THREE.WebGLRenderer();
rendererLeft.setSize( window.innerWidth/2-half_canvas_seperation, window.innerHeight );
rendererLeft.domElement.style.position = 'absolute';
rendererLeft.domElement.style.left = (0) + 'px';
rendererLeft.domElement.style.right = (window.innerWidth/2-half_canvas_seperation) + 'px';
rendererLeft.domElement.style.top = '0px';
document.body.appendChild( rendererLeft.domElement );

// right 
const rendererRight = new THREE.WebGLRenderer();
rendererRight.setSize(window.innerWidth/2-half_canvas_seperation, window.innerHeight);
rendererRight.domElement.style.position = 'absolute';
rendererRight.domElement.style.left = (window.innerWidth/2+half_canvas_seperation) + 'px';
rendererRight.domElement.style.top = '0px';
document.body.appendChild(rendererRight.domElement);


// EffectComposer setup
var renderTargetLeft = new THREE.WebGLRenderTarget(window.innerWidth/2,window.innerHeight);
var renderTargetRight = new THREE.WebGLRenderTarget(window.innerWidth/2,window.innerHeight);

const renderPassL = new RenderPass( scene, stereocam.cameraL );
const renderPassR = new RenderPass( scene, stereocam.cameraR );

// add the RenderPasses
const composerLeft = new EffectComposer( rendererLeft, renderTargetLeft );
const composerRight = new EffectComposer( rendererRight, renderTargetRight );

composerLeft.addPass( renderPassL );
composerRight.addPass( renderPassR );

// storing camera information
var c = {
    lookat: new THREE.Vector3(0, 0, 1),
    pos: new THREE.Vector3(11, 3, 24),
    up: new THREE.Vector3(0, 1, 0),
    quat: new THREE.Quaternion(),
};

// recording camera behavior
var s = {
    pitch: 0,
    yaw: -1.5600000000000007,
    perspective: true,
    movement: false,
    moveablelights: true,
};

// dictionary of keys behavior
var k = {};

// list of keys for keyboard detection
let validKeys = [
    'w',
    'a',
    's',
    'd',
    ' ',
    'Shift',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
];

// set keydown and keyup listener
window.addEventListener(
    'keydown',
    (e) => {
        if (validKeys.includes(e.key)) {
            k[e.key] = true;
        }
    },
    false
);

window.addEventListener(
    'keyup',
    (e) => {
        if (validKeys.includes(e.key)) {
            k[e.key] = false;
        }
    },
    false
);

// window.setInterval(() => {
//     fetch("http://127.0.0.1:8000/getimu")
//       .then((response) => {
//             if (response.status != 500) {
//                 response.json().then((t) => {

// 					// YOUR CODE:

// 					// set the camera quaternion.
//                     camera.rotation.set[t[0],t[1],t[2]]
//                     camera.quaternion.set(t[0], t[1], t[2], t[3])
//                     camera.updateMatrixWorld(true)
                    
//                 })
//             }
//         }
//         )
      
//     }, 50)

window.setInterval(() => {
    fetch("http://127.0.0.1:8000/getGesture")
      .then((response) => {
            if (response.status != 500) {
                response.json().then((t) => {

                    console.log(t);
                    
                })
            }
        }
        )
      
    }, 500)

// vignette shader pass setup
var vignettePass = new ShaderPass(InstagramFilter);
composerLeft.addPass( vignettePass );
composerRight.addPass( vignettePass );

// lens distortion shader pass set up

var lensDistortion = new ShaderPass(LensDistortionShader);
composerLeft.addPass( lensDistortion );
composerRight.addPass( lensDistortion );

// create a cube 
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshBasicMaterial( { color: 0x5AD684 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );


// Euler Test
// var cx = camera.rotation.x;
// var cy = camera.rotation.y;
// var cz = camera.rotation.z;
//var cw = camera.rotation.w;

// Quaternion Test
var cx = camera.quaternion.x;
var cy = camera.quaternion.y;
var cz = camera.quaternion.z;
var cw = camera.quaternion.w;

function animate() {

    //cy = cy + 0.1;
   //camera.rotation.set(cx,cy,cz);

    camera.quaternion.set(cx,cy,cz,cw);
	camera.quaternion.normalize();

    doMovement(camera);


    camera.updateWorldMatrix(true);
    // console.log(camera.rotation)
    // console.log(camera.quaternion)

	const delta = clock.getDelta();
	stereocam.update(camera)
	requestAnimationFrame( animate );

	// call camera navigation function
	//doMovement(camera);

	// update sphere motion
	cube.rotation.x += delta;
	cube.rotation.y += delta;

	// render both EffectComposers
	rendererLeft.setRenderTarget(renderTargetLeft);
	composerLeft.render();

    rendererRight.setRenderTarget(renderTargetRight);
    composerRight.render();

}

// YOUR CODE:

// some useful variable to use
var scaling = 0.1
var xoff = 0
var yoff = 0

function doMovement(camera) {

	// four arrow behaviors, change camera rotation, and thus the lookat point of camera.
	// space and shift are zoom in and out
	// wsad can be use to change camera position

	// Arrow Key Control
	// Note: we want to update the camera yaw and pitch information here
	// Note: when pitch is over 90 degree, you want to keep it as 90, and smaller than -90 need to be -90. 
	let r = 0.5
    
    if (k['ArrowUp'] == true) yoff -= r
    if (k['ArrowDown'] == true) yoff += r

    if (k['ArrowLeft'] == true) xoff += r
    if (k['ArrowRight'] == true) xoff -= r

    xoff *= scaling
    yoff *= scaling

    s.yaw += xoff
    s.pitch += yoff

    if (s.pitch > Math.PI / 2 - 0.01) s.pitch = Math.PI / 2 - 0.01
    if (s.pitch < -(Math.PI / 2) + 0.01) s.pitch = -Math.PI / 2 + 0.01

	// maybe keep here.
    c.lookat.x = -Math.cos(s.pitch) * Math.cos(s.yaw)
    c.lookat.z = -Math.cos(s.pitch) * Math.sin(-s.yaw)
    c.lookat.y = -Math.sin(s.pitch)

    let mScaling = 0.1

    c.lookat.normalize()

	// Space and Shift Control
	// zoom in and out, change z of camera pos.

	if (k[' '] == true) c.pos.z-=mScaling
	if (k['Shift'] == true) c.pos.z+=mScaling

	// WSAD Control
	// change camera position, change x and y of camera pos.

    if (k['w'] == true) c.pos.y-=mScaling
    if (k['s'] == true) c.pos.y+=mScaling

    if (k['a'] == true) c.pos.x-=mScaling
    if (k['d'] == true) c.pos.x+=mScaling

	// update camera position and lookat point
	// Note: the lookat point need to combine c.lookat and c.pos.

    camera.position.copy(c.pos)
    let templookat = new THREE.Vector3().addVectors(c.lookat, c.pos)
    camera.lookAt(templookat)
}

animate();