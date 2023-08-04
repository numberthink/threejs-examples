import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {SpringAnimation} from './animation.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


const gridShader = {
    uniforms: {
        uTime: {value: 0},
        uXProgress: {value: 0},
        uYProgress: {value: 0},
        uNumCols: {value: 8},
        uNumRows: {value: 16},
        uSpeed: {value: .4},
        uXMod: {value: .5},
        uYMod: {value: .25},
        uXOffset: {value: 5.2},
        uYOffset: {value: 2.8},
        uXVisiblePct: {value: .8},
        uYVisiblePct: {value: .84},

    },
    vertexShader: `

    varying vec2 vUv;
    varying vec3 vertex;
    void main() {
      vUv = uv;
      vertex = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,

    fragmentShader: `

    varying vec2 vUv;
    varying vec3 vertex;

    uniform float uTime;
    uniform float uXProgress;
    uniform float uYProgress;
    uniform float uNumCols;
    uniform float uNumRows;
    uniform float uSpeed;
    uniform float uXMod;
    uniform float uYMod;
    uniform float uXOffset;
    uniform float uYOffset;
    uniform float uXVisiblePct;
    uniform float uYVisiblePct;

    void main() {
  
      vec2 coord = vertex.xy;

      vec2 uv = vUv;

      coord.x = coord.x*uNumCols;
      coord.y = coord.y*uNumRows;
    
     
      vec2 grid = abs(fract(coord - 0.5) - 0.5)*1. / fwidth(coord*1.);
    
      // animate
   
      float lineX = 1.0 - min(grid.y*1.,1.0);
      lineX = pow(lineX, 1.0 / 2.2);

      float lineY = 1.0 - min(grid.x*1.5,1.0);
      lineY = pow(lineY, 1.0 / 2.2);

    
      float xVisibleInd = (mod(vertex.x+uXProgress + floor(abs(vertex.y+.55)*uNumRows*.99)*(1./uNumRows)*uXOffset, uXMod)/uXMod - (1.0-uXVisiblePct))*lineX ;
      float yVisibleInd = (mod(vertex.y+uYProgress + vertex.x*uYOffset, uYMod)/uYMod - (1.0 - uYVisiblePct))*lineY;
      float xVisible = ceil(xVisibleInd);
      float yVisible = ceil(yVisibleInd) ;
      float visible = max(xVisible,yVisible);

      vec3 color = vec3(.1,.6,.3);

      color = color*visible;

      gl_FragColor = vec4(color, 1.0);
    }
    `
}

const sceneState = {
    updatedSinceLastRender: false,
    initialized: false,
    lastPauseTime: 0,
    pausedTime: 0,
    animating: true,
}

const params =  {
    cameraAngle: 90,
    minSquarePx: 35,
    maxSquarePx: 100,
    squarePxWidthPct: .065,
    squareWidthFn: function(windowWidth,windowHeight) {

        let squarePx = Math.max(this.minSquarePx,Math.min(this.maxSquarePx,windowWidth*this.squarePxWidthPct));
        return squarePx;
    },
    width: 1,
    height: 1,
    screenScale: 1,
    xSegments: 1,
    ySegments: 1,
};



const defaultScreenRatioParams = {
    cameraAngle: 90,
    distanceFromCamera: 10,
    windowWidth: 1132,
    windowHeight: 703,
}

const calcScreenScaleRatio = (params=defaultScreenRatioParams) => {
    const screenWidth = Math.tan(((params.cameraAngle/2)/360)*Math.PI*2)*params.distanceFromCamera*2;
    const screenHeight = Math.tan(((params.cameraAngle/2)/360)*Math.PI*2)*params.distanceFromCamera*2;
    const screenWidthAdjusted = screenWidth*(params.windowWidth/params.windowHeight);

    return {width: screenWidthAdjusted, height: screenHeight};
}

let renderer,scene,camera, gridMesh, canvas,clock,controls;

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
    camera = new THREE.PerspectiveCamera(90, windowWidth/windowHeight, .01, 105);
    camera.position.set(0 , 0 , -5 );
    camera.lookAt(new THREE.Vector3(0,0,0));
    
    // set up grid
    
    const gridGeo = new THREE.PlaneGeometry(params.width, params.height, params.xSegments, params.ySegments);
    const gridMat = new THREE.ShaderMaterial(gridShader);
    gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.set(0,0,5);
    gridMesh.rotation.set(0,Math.PI, 0);
    setGridScale(windowWidth,windowHeight);
    
    // create scene
    scene = new THREE.Scene();

    scene.add(gridMesh);
    
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

const animationParams = {
    xSpeed: .03,
    ySpeed: .04,
    spring1Params: {
        time_factor: .03,
        tension: 90,
        friction: 5,
        clamp: true,
        loop: true,
    },
    spring2Params: {
        time_factor: .02,
        tension: 150,
        friction: 40,
        clamp: true,
        loop: true,
    },
    xVisiblePctBase: .4,
    xVisiblePctVar: .7,
    xYSpringPct: 1,
    yXSpringPct: .5,
}

const animationState = {
    spring1: null,
    spring2: null,
}

const initAnimation = () => {
    animationState.spring1 = new SpringAnimation(animationParams.spring1Params);
    animationState.spring1.activate();
    animationState.spring2= new SpringAnimation(animationParams.spring2Params);
    animationState.spring2.activate();
}


const animate = () => {

    if (sceneState.initialized && sceneState.animating) {
        const elapsedTime = clock.getElapsedTime() - sceneState.pausedTime;
        const deltaTime = elapsedTime - sceneState.elapsedTime; 
        sceneState.elapsedTime = elapsedTime;
        animationState.spring1.update(deltaTime,elapsedTime);
        animationState.spring2.update(deltaTime,elapsedTime);
        const spring1Position = animationState.spring1.getPosition();
        const spring2Position = animationState.spring2.getPosition();
        gridMesh.material.uniforms.uXProgress.value = spring1Position + elapsedTime*animationParams.xSpeed + animationParams.xYSpringPct*spring2Position;
        gridMesh.material.uniforms.uYProgress.value = spring2Position + elapsedTime*animationParams.ySpeed + animationParams.yXSpringPct*spring1Position;
        gridMesh.material.uniforms.uXVisiblePct.value = (Math.sin(spring1Position*Math.PI))*animationParams.xVisiblePctVar + animationParams.xVisiblePctBase;
        controls.update();
        renderer.render(scene, camera);
        sceneState.updatedSinceLastRender = false;
    }

    window.requestAnimationFrame(animate);
}

const initGui = () => {
    const gui = new GUI();
    const gridFolder = gui.addFolder('Grid Controls');
    gridFolder.add(gridMesh.material.uniforms.uNumCols, 'value',0,40,1).name('Columns');
    gridFolder.add(gridMesh.material.uniforms.uNumRows, 'value',0,40,1).name('Rows');
    gridFolder.add(gridMesh.material.uniforms.uYVisiblePct, 'value',0,1,.01).name('Y visible pct');
    gridFolder.add(gridMesh.material.uniforms.uYOffset, 'value',0,10,.01).name('Y offset');
    gridFolder.add(gridMesh.material.uniforms.uXOffset, 'value',0,10,.01).name('X offset');
    gridFolder.add(gridMesh.material.uniforms.uYMod, 'value',0,3,.01).name('Y mod');
    gridFolder.add(gridMesh.material.uniforms.uXMod, 'value',0,3,.01).name('X mod');
    const animationFolder = gui.addFolder('Animation Controls');
    animationFolder.add(animationParams, 'xSpeed', 0,1,.01).name('X base speed');
    animationFolder.add(animationParams, 'ySpeed', 0,1,.01).name('Y base speed');
    animationFolder.add(animationParams, 'xVisiblePctVar', 0,1,.01).name('X visible pct var');
    animationFolder.add(animationParams, 'xVisiblePctBase', 0,1,.01).name('X visible pct base');
    animationFolder.add(animationParams.spring1Params, 'time_factor',0,1,.01).name('X spring speed').onChange(()=> {
        animationState.spring1.setParameters(animationParams.spring1Params)
    });
    animationFolder.add(animationParams.spring1Params, 'tension',0,250,1).name('X spring tension').onChange(()=> {
        animationState.spring1.setParameters(animationParams.spring1Params)
    });
    animationFolder.add(animationParams.spring1Params, 'friction',0,50,1).name('X spring friction').onChange(()=> {
        animationState.spring1.setParameters(animationParams.spring1Params)
    });
    animationFolder.add(animationParams.spring2Params, 'time_factor',0,1,.01).name('Y spring speed').onChange(()=> {
        animationState.spring2.setParameters(animationParams.spring2Params)
    });
    animationFolder.add(animationParams.spring2Params, 'tension',0,250,1).name('Y spring tension').onChange(()=> {
        animationState.spring2.setParameters(animationParams.spring2Params)
    });
    animationFolder.add(animationParams.spring2Params, 'friction',0,50,1).name('Y spring friction').onChange(()=> {
        animationState.spring2.setParameters(animationParams.spring2Params)
    });
}

const setGridScale = (windowWidth,windowHeight) => {

    const squarePx = params.squareWidthFn(windowWidth,windowHeight);
    const screenDims = calcScreenScaleRatio({
        cameraAngle: params.cameraAngle,
        distanceFromCamera: 10,
        windowWidth: windowWidth,
        windowHeight: windowHeight,
    });

    let numCols = Math.floor(windowWidth/(squarePx*2*(1/params.screenScale)))*2;
    let numRows = Math.floor(windowHeight/(squarePx*2*(1/params.screenScale)))*2;

    gridMesh.material.uniforms.uNumCols.value = numCols;
    gridMesh.material.uniforms.uNumRows.value = numRows;
    
    gridMesh.scale.set(screenDims.width*params.screenScale,screenDims.height*params.screenScale,1);
}

export const onWindowResize = (windowWidth,windowHeight) => {
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