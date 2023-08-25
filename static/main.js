import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { InstagramFilter } from './vignetteShader.js';
import { LensDistortionShader } from './LensDistortionShader.js'


// create a scene 
const scene = new THREE.Scene();
const manager = new THREE.LoadingManager();
const loader = new GLTFLoader( manager );

// stereo camera setup here
var stereocam = new THREE.StereoCamera();
stereocam.eyeSep = 1.5;

// scene camera update
const camera = new THREE.PerspectiveCamera( 60, window.innerWidth/2 / window.innerHeight, 0.1, 1000 );
camera.up.set( 0, 0, 1 );
camera.position.set( 0, -20, 5 );
camera.lookAt( 0, 0, 5 );
scene.add( camera );
stereocam.update( camera );

window.setInterval(() => {
    fetch("http://127.0.0.1:8000/getimu")
      .then((response) => {
            if (response.status != 500) {
                response.json().then((t) => {

					// // set the camera quaternion.
                    // camera.rotation.set[t[0],t[1],t[2]];
                    // camera.quaternion.set(t[0], t[1], t[2], t[3]);
                    // camera.updateMatrixWorld(true);
                    
                })
            }
        }
        )
      
    }, 50)

var currGesture = "None";
window.setInterval(() => {
    fetch("http://127.0.0.1:8000/getGesture")
      .then((response) => {
            if (response.status != 500) {
                response.json().then((t) => {

                    currGesture = t;
                    console.log(currGesture);
                    
                })
            }
        }
        )
      
    }, 50)


// create a timestamp
const clock = new THREE.Clock();

// left and right renderers setup
var half_canvas_seperation = 5;

// create a container to hold both camera views
var container = document.createElement( 'div' );
container.style.cssText = 'position:absolute;width:0%;height:0%;opacity:0;z-index:1;background:#FFFFFF';
document.body.appendChild( container );

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


// enable shadow maps
rendererLeft.shadowMap.enabled = true;
rendererLeft.shadowMap.type = THREE.PCFSoftShadowMap;
rendererRight.shadowMap.enabled = true;
rendererRight.shadowMap.type = THREE.PCFSoftShadowMap;


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


// vignette shader pass setup
var vignettePass = new ShaderPass( InstagramFilter );
composerLeft.addPass( vignettePass );
composerRight.addPass( vignettePass );

// lens distortion shader pass set up
var distortionPass = new ShaderPass( LensDistortionShader );
composerLeft.addPass( distortionPass );
composerRight.addPass( distortionPass );

// Controller setup
let controller = new FlyControls( camera, container );
controller.dragToLook = true;
controller.movementSpeed = 0.1;


// * IMPORTING THE SCENE
const shadowBias = -0.001;
const shadowMapSize = 128;

const pointLight0 = new THREE.PointLight( 0xffffff, 1, 100 );
pointLight0.position.set( -10, 0, 10 );
pointLight0.castShadow = true;
pointLight0.shadow.mapSize.width = shadowMapSize;
pointLight0.shadow.mapSize.height = shadowMapSize;
pointLight0.shadow.bias = shadowBias;
scene.add( pointLight0 );

const pointLight1 = new THREE.PointLight( 0xffffff, 1, 100 );
pointLight1.position.set( 10, 0, 10 );
pointLight1.castShadow = true;
pointLight1.shadow.mapSize.width = shadowMapSize;
pointLight1.shadow.mapSize.height = shadowMapSize;
pointLight1.shadow.bias = shadowBias;
scene.add( pointLight1 );

const areaLight = new THREE.AmbientLight( 0x202020 ); // soft white areaLight
scene.add( areaLight );

const sphereSize = 0.1;
const pointLightHelper0 = new THREE.PointLightHelper( pointLight0, sphereSize );
scene.add( pointLightHelper0 );
const pointLightHelper1 = new THREE.PointLightHelper( pointLight1, sphereSize );
scene.add( pointLightHelper1 );

let teapot
loader.load( 'utah_teapot_continous_quads.glb', function ( gltf ) {

	teapot = gltf.scene;
	teapot.position.setX( 5 );
	teapot.position.setZ( 0 );
	teapot.rotation.x = Math.PI / 2;
	teapot.scale.set( 2, 2, 2 );
	teapot.traverse( function( child ) {
		if ( child.isMesh ) {
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});
	scene.add( teapot );

}, undefined, function ( error ) {

	console.error( error );

} );

let knight;
loader.load( 'low_poly_chess_knight.glb', function ( gltf ) {
	
	knight = gltf.scene;
	knight.position.setX( -5 );
	knight.position.setZ( 0 );
	knight.rotation.x = Math.PI / 2;
	knight.rotation.y = Math.PI / 2;

	knight.traverse( function( child ) {
		if ( child.isMesh ) {
			child.castShadow = true;
			child.receiveShadow = true;
		}
	});
	scene.add( knight );

}, undefined, function ( error ) {

	console.error( error );

} );

const planeGeometry = new THREE.PlaneGeometry( 100, 100, 1, 1 );
const planeMaterial = new THREE.MeshStandardMaterial( { color: 0x027148 } );
const plane = new THREE.Mesh( planeGeometry, planeMaterial );
plane.rotation.z = Math.PI / 2;
plane.castShadow = true;
plane.receiveShadow = true;
scene.add( plane );

const cubeGeometry = new THREE.BoxGeometry( 1, 1, 1 );
const cubeMaterial = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
cube.position.set(0, 0, 2);
cube.castShadow = true;
cube.receiveShadow = true;
scene.add( cube );

var sphereDist = 10;
var sphereRad = 1;

const sphereGeometry = new THREE.SphereGeometry( sphereRad, 32, 16 ); 
const sphereMaterial = new THREE.MeshStandardMaterial( { color: 0xffff00 } ); 
const sphere0 = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
sphere0.position.set( sphereDist, 0, sphereRad ); // need to raise slightly above plane to prevent shadow bugs :(
sphere0.castShadow = true;
sphere0.receiveShadow = true;
scene.add( sphere0 );

const sphere1 = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
sphere1.position.set( -sphereDist, 0, sphereRad );
sphere1.castShadow = true;
sphere1.receiveShadow = true;
scene.add( sphere1 );

const sphere2 = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
sphere2.position.set( 0, sphereDist, sphereRad );
sphere2.castShadow = true;
sphere2.receiveShadow = true;
scene.add( sphere2 );

const sphere3 = new THREE.Mesh( sphereGeometry, sphereMaterial ); 
sphere3.position.set( 0, -sphereDist, sphereRad );
sphere3.castShadow = true;
sphere3.receiveShadow = true;
scene.add( sphere3 );

// Adding in a skybox (following https://codinhood.com/post/create-skybox-with-threejs)
function createPathStrings(filename) {
	const basePath = "./skybox/";
	const baseFilename = basePath + filename;
	const fileType = ".png";
	const sides = ["ft", "bk", "up", "dn", "rt", "lf"];
	const pathStrings = sides.map(side => {
		return baseFilename + "_" + side + fileType;
	});
	return pathStrings;
}

function createMaterialArray(filename) {
	const skyboxImagepaths = createPathStrings(filename);
	const materialArray = skyboxImagepaths.map(image => {
		let texture = new THREE.TextureLoader().load(image);
		return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide });
	});
	return materialArray;
}

const materialArray = createMaterialArray( "space" );
var skyboxGeo = new THREE.BoxGeometry( 1000, 1000, 1000 );
var skybox = new THREE.Mesh( skyboxGeo, materialArray );
scene.add( skybox );


function animate() {

    if (currGesture != "None") {
        switch(currGesture) {
            case "Thumb_Up":
                camera.position.y += 0.1;
                break;
            case "Thumb_Down":
                camera.position.y -= 0.1;
                break;
            case "Victory":
                camera.position.z += 0.1;
                break;
            case "Open_Palm":
                camera.position.z -= 0.1;
                break;
            case "ILoveYou":
                camera.position.x += 0.1;
                break;
            case "Closed_Fist":
                camera.position.x -= 0.1;
                break;
            default:
                break;
        }
    }

	const delta = clock.getDelta();
	stereocam.update(camera)
	requestAnimationFrame( animate );

	controller.update( 1 );
	stereocam.update( camera );

	cube.rotation.x += delta;
	cube.rotation.y += delta;

	// render both EffectComposers
	rendererLeft.setRenderTarget(renderTargetLeft);
	composerLeft.render();

    rendererRight.setRenderTarget(renderTargetRight);
    composerRight.render();

}

animate();