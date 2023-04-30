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
        uCircleRadius: {value: .1},
        uCircleEdgePct: {value: .1},
        uAspectRatio: {value: window.innerWidth/window.innerHeight},
        uNumCircles: {value: 8},
        uCircleColor: {value: 0},
        uCircleOffset: {value: 0},
        uColors: {type: "v3v", value: [
            new THREE.Color('rgb(16,154,245)'),
            new THREE.Color('rgb(186,93,210)'),
            new THREE.Color('rgb(255,74,65)'),
            new THREE.Color('rgb(255,163,0)'),
            new THREE.Color('rgb(255,210,2)'),
            new THREE.Color('rgb(80,203,36)'),
        ]}
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

    uniform vec3 uColors[6];
    uniform float uCircleRadius;
    uniform float uCircleEdgePct;
    uniform float uAspectRatio;

    uniform float uNumCircles;
    uniform float uCircleColor;
    uniform float uCircleOffset;

    void main() {
        vec2 st = vUv;
        st.x = st.x*max((uAspectRatio),1.) + (1.0-max((uAspectRatio),1.))*.5;
        st.y = st.y*max((1./uAspectRatio),1.) + (1.0-max((1./uAspectRatio),1.))*.5;

        st.y = st.y + uCircleOffset;

        vec2 circle_center = vec2(.5,.5);

        st = fract(st*uNumCircles);

        
        float circle_edge_length = uCircleRadius*uCircleEdgePct;
        float in_circle_val = max(distance(st,circle_center)-uCircleRadius+circle_edge_length ,0.0)/circle_edge_length;
        in_circle_val = smoothstep(0.0,1.,in_circle_val);
        float in_circle = 1.0 - (in_circle_val);

        vec3 circle_color = uColors[int(uCircleColor)];

        gl_FragColor = vec4(vec3(circle_color)*in_circle,1.);
    }    

    `
});

const shaderMesh = new THREE.Mesh(shaderGeometry,shaderMaterial);
scene.add(shaderMesh);




// render scene
renderer.render(scene, camera);


// params

const params = {
    autoAnimate: true,
    animationDuration: 4,
    animationType: 'linear',
    animationTypeOptions: ['linear','sin'],
    animationStart: 0,
    animationEnd: 1,
    hideInstructions: false,
    reverse: false,
}

// state

const animationState = {
    value: 0,
    progress: 0,
    startTime: 0,
    started: false,
    finished: false,

}

const resetAnimationState = () => {
    animationState.value = 0;
    animationState.progress = 0;
    animationState.startTime = 0;
    animationState.started = false;
    animationState.finished = false;
    
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

    let newVal;
    if (params.animationType == 'linear') {
        newVal = progress;
    }
    else if (params.animationType == 'sin') {
        
        newVal =(Math.sin(progress*Math.PI*.5));
    }

    if (params.reverse) {
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
gui.add( params, 'animationDuration', 0,10,.01 ).name('Animations duration');
gui.add(params,'animationType',params.animationTypeOptions).name('Animation type');
gui.add(params, 'reverse').name('Reverse');
gui.add(shaderMesh.material.uniforms.uAspectRatio, 'value', 0, 4,.01).name('Aspect ratio');
gui.add(shaderMesh.material.uniforms.uNumCircles, 'value', 1, 16,.1).name('Number of Circles');
gui.add(shaderMesh.material.uniforms.uCircleRadius, 'value', 0, 1,.01).name('Circle radius');
gui.add(shaderMesh.material.uniforms.uCircleEdgePct, 'value', 0, 1,.01).name('Circle edge length');
gui.add(shaderMesh.material.uniforms.uCircleColor, 'value', 0, 5,1).name('Circle color index');
gui.add(shaderMesh.material.uniforms.uCircleOffset, 'value', 0, 1,.01).name('Circle offset Y');




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

        shaderMesh.material.uniforms.uCircleOffset.value = animationState.value;
    
    
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
    shaderMesh.material.uniforms.uAspectRatio.value = (window.innerWidth/window.innerHeight);
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


