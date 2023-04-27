import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';


const canvas = document.getElementById('webglCanvas');

// set up renderer
const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( Math.min(window.devicePixelRatio,2));

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;


// set up camera
const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, .01, 105);
camera.position.set(0 , 0 , -5 );
camera.lookAt(new THREE.Vector3(0,0,0));


// create scene
const scene = new THREE.Scene();

// create box and add to scene
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshPhongMaterial({shininess: 50,color: new THREE.Color('rgb(0,0,0)'), specular: new THREE.Color('rgb(255,255,255)')});
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);

scene.add(boxMesh);

const spotlight = new THREE.PointLight(0xffffff, 1,6);
spotlight.position.set(0,0,-5);

scene.add(spotlight);


// render scene
renderer.render(scene, camera);


// Set up controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;

// initialize and start clock
const clock = new THREE.Clock();
clock.start();

// animation loop
let animating = true;
let pauseTime = 0;
let lastPauseTime = 0;
const boxParams = {
    xRotationSpeed: .05,
    yRotationSpeed: .1,
    zRotationSpeed: .1,
}
const tick = () => {

    if (animating) {

        const elapsedTime = clock.getElapsedTime() - pauseTime;
    
        boxMesh.rotation.set(elapsedTime*Math.PI*2*boxParams.xRotationSpeed,elapsedTime*Math.PI*2*boxParams.yRotationSpeed, elapsedTime*Math.PI*2*boxParams.zRotationSpeed);
    
        controls.update();
    
        renderer.render(scene, camera);
    }


    window.requestAnimationFrame(tick);
    

}

tick();


// update camera and renderer when window is resized
window.addEventListener('resize',() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth/windowHeight;
    camera.updateProjectionMatrix();
});


// freeze animation when "f" key is pressed
window.addEventListener('keydown',(event)=> {
    if (event.key=='f') {
        if (animating) {
            lastPauseTime = clock.getElapsedTime();
            animating = false;
        }
        else {
            pauseTime = pauseTime + clock.getElapsedTime() - lastPauseTime;
            animating = true;
        }
    }
});