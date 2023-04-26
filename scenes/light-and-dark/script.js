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




// create scene
const scene = new THREE.Scene();

// create shader and add to scene
const camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

const shaderGeometry = new THREE.BufferGeometry();
shaderGeometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
shaderGeometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

const shaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        uLightness: {value: .95},
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `,
    fragmentShader: `
    uniform float uLightness;
    void main() {
        gl_FragColor = vec4(vec3(uLightness),1.);
    }    

    `
});

const shaderMesh = new THREE.Mesh(shaderGeometry,shaderMaterial);
scene.add(shaderMesh);




// render scene
renderer.render(scene, camera);


// params

const params = {
    autoAnimate: false,
    animationDuration: 1,
    animationType: 'linear',
    animationTypeOptions: ['linear','sin'],
    animationStart: 0,
    animationEnd: 1,
    roundTrip: false,
    hideInstructions: false,
}

// state

const animationState = {
    value: 0,
    progress: 0,
    startTime: 0,
    started: false,
    finished: false,
    reverse: false,

}

const resetAnimationState = () => {
    animationState.value = 0;
    animationState.progress = 0;
    animationState.startTime = 0;
    animationState.started = false;
    animationState.finished = false;
    animationState.reverse = false;
    
}

const doAnimation = (elapsedTime) => {
    if (!animationState.started) {
        animationState.started = true;
        animationState.startTime = elapsedTime;
    }
    else if (animationState.finished) {
        return;
    }
    let durationSeconds = params.animationDuration;

    let animationTime = (elapsedTime - animationState.startTime);

    if (params.autoAnimate) {
        animationTime= animationTime%durationSeconds;
    }
    else {
        animationTime = Math.min(animationTime, durationSeconds);
    }

    let progress = (animationTime)/durationSeconds;
    if (!durationSeconds) {
        progress = 1;
    }
    if (params.roundTrip) {
        progress = progress>= .5 ? 2-progress*2 : progress*2;
    }
    let newVal;
    if (params.animationType == 'linear') {
        newVal = progress;
    }
    else if (params.animationType == 'sin') {
        
        newVal =(Math.sin(progress*Math.PI*.5));
    }

    if (animationState.reverse) {
        newVal = 1-newVal;
    }


    animationState.value = params.animationStart + (params.animationEnd - params.animationStart)*newVal;

    if (animationTime>=durationSeconds && !params.autoAnimate) {
        animationState.finished = true;
    }
}

// set up gui
const gui = new GUI();
gui.add(params, 'autoAnimate').name('Auto animate').onChange((value)=> {if (value) startAnimation()});
gui.add( params, 'animationDuration', 0,4,.01 ).name('Animations duration');
gui.add(params,'animationType',params.animationTypeOptions).name('Animation type');
gui.add(params, 'roundTrip').name('Round trip');
gui.add(params, 'animationStart', 0,1, .01).name('Start value');
gui.add(params, 'animationEnd', 0,1, .01).name('End value');
gui.add(params, 'hideInstructions').onChange((value)=> {
    if (value) {
        hideInstructions();
    }
    else {
        showInstructions();
    }
});



// initialize and start clock
const clock = new THREE.Clock();
clock.start();

// animation loop
let animating = true;
let pauseTime = 0;
let lastPauseTime = 0;

const tick = () => {

    if (animating) {

        const elapsedTime = clock.getElapsedTime() - pauseTime;
    
        doAnimation(elapsedTime);

        shaderMesh.material.uniforms.uLightness.value = animationState.value;
    
    
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
    else if (['ArrowRight','ArrowLeft'].includes(event.key) && !params.autoAnimate) {
        if (event.key=='ArrowRight') {
            startAnimation();
        }
        else {
            startAnimation(true);
        }
    }
});

const startAnimation = (reverse=false) => {
    resetAnimationState();
    if (reverse) {
        animationState.reverse = true;
    }
}

const instructionsText = `Press "f" key to freeze/unfreeze animation. Set auto-animation to true for continuous animation. If auto-animation is false, use Arrow-Right and Arrow-Left keys to run animation forward and back.`
document.getElementById('instructions').innerText = instructionsText;
const instructionsElement = document.getElementById('instructions');
instructionsElement.style.visibility = 'visible';
const hideInstructions = () => {
    instructionsElement.style.visibility = 'hidden';
}

const showInstructions = () => {
    instructionsElement.style.visibility = 'visible';
}