import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';



const canvas = document.getElementById('webglCanvas');

// set up renderer
const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer : true,
    });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( Math.min(window.devicePixelRatio,2));
renderer.setClearColor(0xffffff,1);




// create scene
const scene = new THREE.Scene();

// create shader and add to scene
// set up camera
const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, .01, 105);
camera.position.set(0 , 0 , -5 );
camera.lookAt(new THREE.Vector3(0,0,0));


const fixedCircleParams1 = {
    numRings: 12,
    maxCircleRadius: .25,
    minCircleRadius: .075,
    maxCircles: 110,
    minCircles: 1,
    totalRadius: 10,
    scale: .75,
    circleRadiusPow: 1.3,
    totalRadiusPow: .8,
    rotationOffset: .1,
    rotationOffsetPow: .3,
    skew: 0,
    maxZOffset: 5,
    zOffsetPow: .55,
    middleCircle: false,
    minOpacity: .6,
    opacityPow: .85,
}

const fixedCircleParams2 = {
    numRings: 8,
    maxCircleRadius: .45,
    minCircleRadius: .15,
    maxCircles: 50,
    minCircles: 1,
    totalRadius: 10,
    scale: 1.15,
    circleRadiusPow: 1.3,
    totalRadiusPow: .7,
    rotationOffset: .2,
    rotationOffsetPow: .3,
    skew: 0,
    maxZOffset: 7,
    zOffsetPow: .45,
    middleCircle: false,
    minOpacity: .7,
    opacityPow: .85,
}

const circleParams = {
    numRings: 12,
    maxCircleRadius: .25,
    minCircleRadius: .075,
    maxCircles: 110,
    minCircles: 1,
    totalRadius: 10,
    scale: .75,
    circleRadiusPow: 1.3,
    totalRadiusPow: .8,
    rotationOffset: .1,
    rotationOffsetPow: .3,
    skew: 0,
    maxZOffset: 5,
    zOffsetPow: .55,
    middleCircle: false,
    minOpacity: .6,
    opacityPow: .85,
}

const makeCircles = () => {
    for (let i=0;i<circleParams.numRings;i++) {
        if (i==0 && !circleParams.middleCircle) {
            continue;
        }
        let ringPct = i/circleParams.numRings;

        let numCircles = Math.floor(ringPct*(circleParams.maxCircles - circleParams.minCircles)+circleParams.minCircles);
        let circleRadius = Math.pow((1-ringPct),circleParams.circleRadiusPow)*(circleParams.maxCircleRadius-circleParams.minCircleRadius) + circleParams.minCircleRadius;
        let totalRadius = Math.pow(ringPct,circleParams.totalRadiusPow)*circleParams.totalRadius;
        let rotationOffset = Math.pow(ringPct,circleParams.rotationOffsetPow)*(circleParams.rotationOffset)*Math.PI*2;
        for (let j=0;j<numCircles;j++) {

            let circlePct = j/numCircles;
            let circleAngle = circlePct*Math.PI*2 + rotationOffset;
            let circleX = Math.cos(circleAngle)*totalRadius + Math.cos(2.4)*ringPct*circleParams.skew;
            let circleY = Math.sin(circleAngle)*totalRadius + Math.sin(2.4)*ringPct*circleParams.skew;
            const arcShape = new THREE.Shape()
            .moveTo(circleRadius+circleX,circleRadius+circleY)
            .absarc(circleX,circleY,circleRadius,0,Math.PI*2, false);

            const zOffset = circleParams.maxZOffset*Math.pow(ringPct,circleParams.zOffsetPow);
            const matOpacity = Math.pow((1-ringPct),circleParams.opacityPow)*(1-circleParams.minOpacity) + circleParams.minOpacity;
            const geometry = new THREE.ShapeGeometry( arcShape,24 );
            const material = new THREE.MeshBasicMaterial( { color: 0x000000, side: THREE.DoubleSide,transparent: true } );
            material.opacity = matOpacity;
            const mesh = new THREE.Mesh( geometry, material ) ;
            mesh.scale.set(circleParams.scale, circleParams.scale,circleParams.scale);
            mesh.position.set(0,0,zOffset);
            scene.add( mesh );

        }
    }
}
makeCircles();


const ambientLight = new THREE.AmbientLight(0xffffff,1);
scene.add(ambientLight);

// Set up controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;

// render scene
renderer.render(scene, camera);


// params

const params = {
    autoAnimate: false,
    animationDuration: 4,
    animationType: 'linear',
    animationTypeOptions: ['linear','sin'],
    animationStart: 0,
    animationEnd: 1,
    hideInstructions: false,
    reverse: false,
    screenshotSize: 32,
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
gui.add(params, 'screenshotSize',1,200,1).name('Screen shot size');
// gui.add(params, 'autoAnimate').name('Auto animate').onChange((value)=> {if (value) startAnimation()});
// gui.add( params, 'animationDuration', 0,10,.01 ).name('Animations duration');
// gui.add(params,'animationType',params.animationTypeOptions).name('Animation type');
// gui.add(params, 'reverse').name('Reverse');
// gui.add(shaderMesh.material.uniforms.uAspectRatio, 'value', 0, 4,.01).name('Aspect ratio');
// gui.add(shaderMesh.material.uniforms.uNumCircles, 'value', 1, 16,.1).name('Number of Circles');
// gui.add(shaderMesh.material.uniforms.uCircleRadius, 'value', 0, 1,.01).name('Circle radius');
// gui.add(shaderMesh.material.uniforms.uCircleEdgePct, 'value', 0, 1,.01).name('Circle edge length');
// gui.add(shaderMesh.material.uniforms.uCircleColor, 'value', 0, 5,1).name('Circle color index');
// gui.add(shaderMesh.material.uniforms.uCircleOffset, 'value', 0, 1,.01).name('Circle offset Y');




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

        controls.update();
    
        renderer.render(scene, camera);
    }


    window.requestAnimationFrame(tick);
    

}

tick();


// update camera and renderer when window is resized
const onWindowResize = () => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth/windowHeight;
    camera.updateProjectionMatrix();
}

window.addEventListener('resize',() => {
    onWindowResize();
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
    if (event.key=='s') {
        snapshotCanvas();
    }
});

const manualCanvasResize = (size) => {
    renderer.setSize(size,size);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
}

const snapshotCanvas = () => {
    manualCanvasResize(params.screenshotSize);
    const canvas = document.getElementById('webglCanvas');
    const imgUrl = canvas.toDataURL('image/png',1);
    console.log(imgUrl);
    onWindowResize();
}


