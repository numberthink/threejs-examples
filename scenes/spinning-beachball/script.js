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
        uCircleRadius: {value: .1},
        uRotationPct: {value: 0},
        uFunRotationPct: {value: 0},
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
    uniform float uFunRotationPct;
    uniform float uRotationPct;

    void main() {
        vec2 st = vUv;

        vec2 circle_center = vec2(.5,.5);
        float circle_edge_length = uCircleRadius*.1;
        float in_circle_val = max(distance(st,circle_center)-uCircleRadius+circle_edge_length ,0.0);
        in_circle_val = smoothstep(0.0,1.,in_circle_val);
        float in_circle = 1.0 - ceil(in_circle_val);
        float angle = atan(st.x-circle_center.x,st.y-circle_center.y);
        float angle_pct = 1.0 - mod((angle+3.1415),3.1415*2.)/(3.1415*2.);

        st.x = cos((angle_pct+uRotationPct)*3.1415*2.)*distance(vUv,circle_center) + circle_center.x;
        st.y = sin((angle_pct+uRotationPct)*3.1415*2.)*distance(vUv,circle_center) + circle_center.y;
        angle = atan(st.x-circle_center.x,st.y-circle_center.y);

        angle_pct = 1.0 - mod((angle+3.1415),3.1415*2.)/(3.1415*2.);

        angle_pct = mod(angle_pct + uFunRotationPct,1. );



        float rotation_amount = sin(3.1415*.5*(1.0 - abs(distance(st,circle_center) - uCircleRadius*.5)/(uCircleRadius*.5)));
        vec2 new_st = st;
        float tran_pct = .027;
        new_st.x = st.x + cos(angle_pct*3.1415*2.)*rotation_amount*tran_pct;
        new_st.y = st.y + sin(angle_pct*3.1415*2.)*rotation_amount*tran_pct;

        float new_angle = atan(new_st.x-circle_center.x,new_st.y-circle_center.y);
        float new_angle_pct = 1.0 - mod((new_angle+3.1415),3.1415*2.)/(3.1415*2.);

        vec3 circle_color = uColors[int(floor(new_angle_pct*6.))];

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
    animationDuration: 1,
    animationType: 'linear',
    animationTypeOptions: ['linear','sin'],
    animationStart: 0,
    animationEnd: 1,
    hideInstructions: false,
    funRotation: false,
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
gui.add( params, 'animationDuration', 0,4,.01 ).name('Animations duration');
gui.add(params,'animationType',params.animationTypeOptions).name('Animation type');
gui.add(params, 'funRotation').name('Fun rotation');
gui.add(params, 'reverse').name('Reverse');
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

        if (params.funRotation) {
            shaderMesh.material.uniforms.uFunRotationPct.value = animationState.value;
            shaderMesh.material.uniforms.uRotationPct.value = 0;
        }
        else {
            shaderMesh.material.uniforms.uRotationPct.value = animationState.value;
            shaderMesh.material.uniforms.uFunRotationPct.value = 0;
        }
    
    
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

// const instructionsText = `Press "f" key to freeze/unfreeze animation. Set auto-animation to true for continuous animation. If auto-animation is false, use Arrow-Right and Arrow-Left keys to run animation forward and back.`
// document.getElementById('instructions').innerText = instructionsText;
// const instructionsElement = document.getElementById('instructions');
// instructionsElement.style.visibility = 'visible';
// const hideInstructions = () => {
//     instructionsElement.style.visibility = 'hidden';
// }

// const showInstructions = () => {
//     instructionsElement.style.visibility = 'visible';
// }