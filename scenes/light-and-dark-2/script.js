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
        uLightness: {value: 1},
        uStripeHeight: {value: .1},
    },
    vertexShader: `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `,
    fragmentShader: `
    varying vec2 vUv;
    uniform float uLightness;
    uniform float uStripeHeight;
    void main() {
        vec2 st = vUv;
        float inStripe = ceil(max((1. - (abs(st.y-.5)*2.))-(1.-uStripeHeight),0.0));
        gl_FragColor = vec4(vec3(uLightness*inStripe),1.);
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
    lightnessAnimationType: 'sin',
    lightnessAnimationTypeOptions: ['linear','sin'],
    lightnessStart: 1,
    lightnessEnd: 0,
    roundTrip: false,
    stripeStart: 0,
    stripeEnd: .7,
    hideInstructions: false,
}

// state

const animationState = {
    lightnessValue: 0,
    stripeValue: 0,
    progress: 0,
    startTime: 0,
    started: false,
    finished: false,
    reverse: false,
}

const resetAnimationState = () => {
    animationState.lightnessValue = 0;
    animationState.stripeValue = 0;
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
    let durationSeconds = params.animationDuration;

    let progress;
    if (params.autoAnimate) {
        progress = ((elapsedTime - animationState.startTime)%durationSeconds)/durationSeconds;
    }
    else {
        progress = Math.min((elapsedTime - animationState.startTime)/durationSeconds, 1);
    }

    if (params.roundTrip) {
        progress = progress>= .5 ? 2-progress*2 : progress*2;
    }
    let lightnessVal;
    if (params.lightnessAnimationType == 'linear') {
        lightnessVal = progress;
    }
    else if (params.lightnessAnimationType == 'sin') {
        
        lightnessVal =(Math.sin(progress*Math.PI*.5));
    }

    if (animationState.reverse) {
        lightnessVal = 1-lightnessVal;
        progress = 1-progress;
    }


    animationState.lightnessValue = params.lightnessStart + (params.lightnessEnd - params.lightnessStart)*lightnessVal;
    animationState.stripeValue = params.stripeStart + (params.stripeEnd - params.stripeStart)*progress;

    if ((elapsedTime - animationState.startTime)>=durationSeconds && !params.autoAnimate) {
        animationState.finished = true;
    }
}

// set up gui
const gui = new GUI();
gui.add(params, 'autoAnimate').name('Auto animate').onChange((value)=> {if (value) startAnimation()});
gui.add( params, 'animationDuration', 0,4,.01 ).name('Animations duration');
gui.add(params, 'roundTrip').name('Round trip');
gui.add(params,'lightnessAnimationType',params.lightnessAnimationTypeOptions).name('Lightness animation type');
gui.add(params, 'lightnessStart', 0,1, .01).name('Lightness start value');
gui.add(params, 'lightnessEnd', 0,1, .01).name('Lightness end value');
gui.add(params, 'stripeStart', 0,1, .01).name('Stripe start value');
gui.add(params, 'stripeEnd', 0,1, .01).name('Stripe end value');
gui.add(params, 'hideInstructions').onChange((value)=> {
    if (value) {
        hideInstructions();
    }
    else {
        showInstructions();
    }
})


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

        shaderMesh.material.uniforms.uLightness.value = animationState.lightnessValue;
        shaderMesh.material.uniforms.uStripeHeight.value = animationState.stripeValue;
    
    
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