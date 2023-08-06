
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import {SpringAnimation} from './animation.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


let renderer,scene,camera, canvas,clock,controls, lines;

const init = () => {
    canvas = document.getElementById('webglCanvas');

    // set up renderer
    renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
        });

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    renderer.setSize(windowWidth, windowHeight);
    renderer.setPixelRatio( Math.min(window.devicePixelRatio,2));
    renderer.setClearColor(0x000000, 1);


    
    // set up camera
    // camera = new THREE.PerspectiveCamera(params.cameraAngle, windowWidth/windowHeight, .01, 105);
    // camera.position.set(params.cameraX , params.cameraY , params.cameraZ);
    // camera.lookAt(new THREE.Vector3(0,0,0));
    camera = new THREE.OrthographicCamera(-params.cameraWidth*.5,params.cameraWidth*.5,params.cameraHeight*.5,-params.cameraHeight*.5, .01, 105);
    camera.position.set(params.cameraX , params.cameraY , params.cameraZ);
    camera.lookAt(new THREE.Vector3(0,0,0));

    
    // create scene
    scene = new THREE.Scene();


    lines = makeLines();
    scene.add(lines);
    
    // set up clock
    clock = new THREE.Clock();
    clock.start();

    // Set up controls
    controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true;
    
    // render scene
    renderer.render(scene, camera);
    sceneState.initialized = true;
    
    initGui();
    initAnimation();
    addWindowResizeListener();
    addKeyPressListener();
}

const params =  {
    cameraAngle: 90,
    cameraX: .9,
    cameraY: -1.31,
    cameraZ: -10,
    cameraWidth: 20,
    cameraHeight: 20,
    width: 40,
    height: 30,
    xSegments: 1,
    ySegments: 1,
    horizLines: 17,
    vertLines: 20,
    horizLineLength: 50,
    vertLineLength: 40,
    lineWidth: .1,
    zPosition: 0,
    xPosition: 0,
    yPosition: 0,
    horizLineOffset: .35,
    tiltAngleX: 0,

};

const makeLines = () => {

    const lineGroup = new THREE.Group();

    for (let i=0;i<(params.horizLines);i++) {
        let posY = (i/params.horizLines)*params.height - params.height*.5;
        posY += Math.ceil((i%3)/3)*(-params.horizLineOffset)*(params.height/params.horizLines) + Math.ceil((i+1)%3)*(-params.horizLineOffset*.5)*(params.height/params.horizLines);
        const posX = 0;
        const lineGeo = new THREE.PlaneGeometry(params.horizLineLength, params.lineWidth, 1, 1);
        const lineMat = new THREE.MeshBasicMaterial({color: new THREE.Color('rgb(60,130,220)')});
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.position.set(posX,posY,params.zPosition);
        lineMesh.rotation.set(0,Math.PI + Math.PI*2*(.0), Math.PI*2*(params.tiltAngleX/360));
        lineGroup.add(lineMesh);
        sceneState.xLines[String(i)] = lineMesh;
    }

    for (let i=0;i<(params.vertLines);i++) {
        let posX = (i/params.vertLines)*params.width - params.width*.5;
        const posY = 0;
        const lineGeo = new THREE.PlaneGeometry(params.lineWidth, params.vertLineLength, 1, 1);
        const lineMat = new THREE.MeshBasicMaterial({color: new THREE.Color('rgb(100,230,100)')});
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.position.set(posX,posY,params.zPosition);
        lineMesh.rotation.set(0,Math.PI + Math.PI*2*(.0), Math.PI*2*(params.tiltAngleX/360));
        sceneState.yLines[String(i)] = lineMesh;
        lineGroup.add(lineMesh);
    }

    lineGroup.rotation.set((-.26),(-.49),(-.41));

    return lineGroup;
}

const sceneState = {
    updatedSinceLastRender: false,
    initialized: false,
    elapsedTime: 0,
    lastPauseTime: 0,
    pausedTime: 0,
    animating: true,
    xLines: {},
    yLines: {},
}

const animationParams = {
    xDuration: 10,
    yDuration: 9,
    yDelay: 2,
    xWidth: params.width*1.25,
    yHeight: params.height*1.25,
    xRand: 3,
    yRand: 3,
}

const animationState = {
    started: false,
    xFinished: false,
    yFinished: false,
}

const updateLines = (elapsedTime) => {
    if (!animationState.xFinished) {
        const xProgress = Math.min(1,elapsedTime/animationParams.xDuration);
        if (xProgress>=1) {
            animationState.xFinished = true;
        }
        for (let i=0;i<(params.horizLines);i++) {
            let animationLength = animationParams.xWidth ;
            let xMod = .18;
            animationLength += animationParams.xRand*(((i/params.horizLines + 1.264)%xMod)/xMod);
            sceneState.xLines[String(i)].position.x = -animationLength + animationLength*xProgress;
        }
    }
    if (!animationState.yFinished) {
        const yProgress = Math.max(Math.min(1,(elapsedTime-animationParams.yDelay)/animationParams.yDuration),0);
        if (yProgress>=1) {
            animationState.yFinished = true;
        }
        for (let i=0;i<(params.vertLines);i++) {
            let animationLength = animationParams.yHeight;
            let yMod = .18;
            animationLength += animationParams.yRand*(((i/params.horizLines + 1.264)%yMod)/yMod);
            if (i<params.vertLines*.5) {
                animationLength = -animationLength;
            }
            sceneState.yLines[String(i)].position.y = -animationLength + animationLength*yProgress;
        }
    }


}

const initAnimation = () => {

}


const animate = () => {

    if (sceneState.initialized && sceneState.animating) {
        const elapsedTime = clock.getElapsedTime() - sceneState.pausedTime;
        const deltaTime = elapsedTime - sceneState.elapsedTime; 
        sceneState.elapsedTime = elapsedTime;
        updateLines(elapsedTime);
        controls.update();
        renderer.render(scene, camera);
        sceneState.updatedSinceLastRender = false;
    }

    window.requestAnimationFrame(animate);
}

const initGui = () => {
    const gui = new GUI();
    gui.add(lines.rotation, 'x',-Math.PI,Math.PI, .01).name('Lines rotation x');
    gui.add(lines.rotation, 'y',-Math.PI,Math.PI, .01).name('Lines rotation y');
    gui.add(lines.rotation, 'z',-Math.PI,Math.PI, .01).name('Lines rotation z');
    gui.add(lines.position, 'x',-30,0,.01).name('Lines position X');
    gui.add(lines.position, 'y',-20,20,.01).name('Lines position Y');
    gui.add(lines.position, 'z',0,30,.01).name('Lines position Z');
    gui.add(params, 'cameraAngle',0,180,1).name('Camera angle').onChange(()=> {
        camera.fov = params.cameraAngle;
        camera.updateProjectionMatrix();
    });
    gui.add(params, 'cameraX',-10,10,.01).name('Camera x').onChange(()=> {
        camera.position.x = params.cameraX;
        camera.updateProjectionMatrix();
    });
    gui.add(params, 'cameraY',-10,10,.01).name('Camera Y').onChange(()=> {
        camera.position.y = params.cameraY;
        camera.updateProjectionMatrix();
    });
    gui.add(params, 'cameraZ',-10,0,.01).name('Camera Z').onChange(()=> {
        camera.position.z = params.cameraZ;
        camera.updateProjectionMatrix();
    });


}

const onWindowResize = (windowWidth,windowHeight) => {
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth/windowHeight;
    camera.updateProjectionMatrix();
    setGridScale(windowWidth,windowHeight);
    sceneState.updatedSinceLastRender = true;
}

const addWindowResizeListener = () => {
    window.addEventListener('resize',() => {
        onWindowResize(window.innerWidth,window.innerHeight);
    })
}


const addKeyPressListener = () => {
    window.addEventListener('keydown',(event)=> {
        if (event.key=='f') {
            if (sceneState.animating) {
                sceneState.lastPauseTime = clock.getElapsedTime();
                sceneState.animating = false;
                console.log('paused');
            }
            else {
                sceneState.pausedTime = sceneState.pausedTime + clock.getElapsedTime() - sceneState.lastPauseTime;
                sceneState.animating = true;
            }
        }
    })
}

init();
animate();