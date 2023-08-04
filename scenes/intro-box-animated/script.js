import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


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
renderer.toneMappingExposure = 1.5;


// set up camera
const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, .01, 105);
camera.position.set(0 , 0 , -5 );
camera.lookAt(new THREE.Vector3(0,0,0));


// create scene
const scene = new THREE.Scene();

// create box and add to scene
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshPhongMaterial({shininess: 50,color: new THREE.Color('rgb(5,5,5)'),
 specular: new THREE.Color('rgb(255,255,255)')});
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
boxMesh.rotation.set(0,Math.PI*2*.04,0);
boxMesh.scale.set(2,2,2);

scene.add(boxMesh);

//create light and add to scene
const spotlight = new THREE.PointLight(0xffffff, .5,6);
spotlight.position.set(-1.5,0,-5);


scene.add(spotlight);

//create hemisphere light and add to scene
const hemispherelight = new THREE.HemisphereLight( 0xffffff, 0x000, 7);

scene.add(hemispherelight);



// render scene
renderer.render(scene, camera);


// add animation

const clock = new THREE.Clock(); // initialize the ThreeJS Clock object
clock.start(); // "start" it by calling the start() method on it

// set the rotation speeds for the box.
const animationParams = {
    xRotationSpeed: .05*Math.PI*2,
    yRotationSpeed: .1*Math.PI*2,
    zRotationSpeed: .1*Math.PI*2,
    active: true,
}

const boxState = {
    xRotation: boxMesh.rotation.x,
    yRotation: boxMesh.rotation.y,
    zRotation: boxMesh.rotation.z,
}

let animationActive = true;
const tick = () => {
    if (animationActive) {

        const deltaTime = clock.getDelta(); // get the delta time at each frame

        // multiply the elapsed time by rotation speed to get the new rotation value
        const xRotation = boxState.xRotation + deltaTime*animationParams.xRotationSpeed;
        const yRotation = boxState.yRotation + deltaTime*animationParams.yRotationSpeed;
        const zRotation = boxState.zRotation + deltaTime*animationParams.zRotationSpeed;

        boxMesh.rotation.set(xRotation, yRotation, zRotation); // set the new rotation values on the box mesh

        renderer.render(scene, camera); // render the scene with the updated box in it. 

        // update box state for next frame
        boxState.xRotation = xRotation;
        boxState.yRotation = yRotation;
        boxState.zRotation = zRotation;

    }

    window.requestAnimationFrame(tick); // request next frame from browser when its ready

}
tick();

// update camera and renderer and re-render when window is resized
window.addEventListener('resize',() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth/windowHeight;
    camera.updateProjectionMatrix();
});


// gui to set it to black monolith dimensions
const makeBox = () => {
    boxMesh.scale.set(2,2,2);
    spotlight.position.set(-1.5,0,-5);
    spotlight.intensity=.5;
}

const makeMonolith = () => {
    const scaleRatio = .75;
    boxMesh.scale.set(4*scaleRatio,9*scaleRatio,1*scaleRatio);
    spotlight.position.set(-1.5,2,-5);
    spotlight.intensity=1;

}

const params = {
    monolith: false,
    hideInstructions: false,
}
const gui = new GUI();
gui.add(params, 'monolith').name('Black monolith').onChange((value)=> {
    if (value) {
        makeMonolith()
    }
    else {
        makeBox();
    }
});
gui.add(animationParams, 'xRotationSpeed', 0, 2,.01).name('X Rotation Speed');
gui.add(animationParams, 'yRotationSpeed', 0, 2,.01).name('Y Rotation Speed');
gui.add(animationParams, 'zRotationSpeed', 0, 2,.01).name('Z Rotation Speed');
gui.add(animationParams, 'active').name('Animation active').onChange((value) => {
    animationActive = value;
    if (value) {
        const elapsedTime = clock.getElapsedTime();
        // resets clock so getDelta() will be since now (so no jumps)
    }
});
gui.add(params, 'hideInstructions').onChange((value)=> {
    if (value) {
        hideInstructions();
    }
    else {
        showInstructions();
    }
});



// keypress event listener
window.addEventListener('keydown',(event)=> {
    if (event.key=='f') {
       animationParams.active = !animationParams.active;
       animationActive = animationParams.active;
       if (animationParams.active) {
            const elapsedTime = clock.getElapsedTime();
            // resets clock so getDelta() will be since now (so no jumps)
       }

    }
});

const instructionsText = `Press "f" key or select/unselect "Animation active" to freeze/unfreeze animation.`
const instructionsElement = document.getElementById('instructions');
if (instructionsElement && !params.hideInstructions) {
    instructionsElement.innerText = instructionsText; 
    instructionsElement.style.visibility = 'visible';
}

const hideInstructions = () => {
    if (!instructionsElement) {
        return;
    }
    instructionsElement.style.visibility = 'hidden';
}

const showInstructions = () => {
    if (!instructionsElement) {
        return;
    }
    instructionsElement.style.visibility = 'visible';
}