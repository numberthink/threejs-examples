import * as THREE from 'three';
import colors from './nicePalettes1.json';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import {SpringAnimation} from './animation.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


let renderer,scene,camera, canvas,clock,controls, gridMesh;

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
    camera = new THREE.PerspectiveCamera(params.cameraAngle, windowWidth/windowHeight, .01, 105);
    camera.position.set(params.cameraX , params.cameraY , params.cameraZ);
    camera.lookAt(new THREE.Vector3(0,0,0));

    
    // create scene
    scene = new THREE.Scene();



    const gridGeo = new THREE.PlaneGeometry(params.width, params.height, params.xSegments, params.ySegments);
    const gridMat = new THREE.ShaderMaterial(gridShader);
    gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.set(0,0,-5);
    gridMesh.rotation.set(0,0, 0);
    gridMesh.scale.set(params.scaleX, params.scaleY,1);
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

const params =  {
    cameraAngle: 90,
    cameraX: 0,
    cameraY: 0,
    cameraZ: 5,
    cameraWidth: 20,
    cameraHeight: 20,
    width: 1,
    height: 1,
    xSegments: 1,
    ySegments: 1,
    scaleX: 5,
    scaleY: 5,
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


const paletteIndex = Math.floor(Math.random()*colors.length);

const gridShader = {
    uniforms: {
        uTime: {value: 0},
        uNumCols: {value: 8},
        uNumRows: {value: 16},
        uSpeed: {value: .4},
        uColFactor: {value: 1},
        uRowFactor: {value: 1},
        uOffset: {value: 0},
        uNoiseCutoff: {value: .5},
        uNoise: {value: 1},
        uNoiseCeil: {value: .8},
        uNoiseFreqX: {value: 1},
        uNoiseFreqY: {value: 1},
        uNoiseSeed: {value: 1},
        uColors: {type: "v3v",value: [new THREE.Color(colors[paletteIndex][0]), new THREE.Color(colors[paletteIndex][1]),
        new THREE.Color(colors[paletteIndex][2]),new THREE.Color(colors[paletteIndex][3]),new THREE.Color(colors[paletteIndex][4])]},

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
    uniform float uNumCols;
    uniform float uNumRows;
    uniform float uSpeed;
    uniform float uColFactor;
    uniform float uRowFactor;
    uniform float uOffset;
    uniform float uNoise;
    uniform float uNoiseCutoff;
    uniform float uNoiseFreqX;
    uniform float uNoiseFreqY;
    uniform float uNoiseSeed;
    uniform vec3 uColors[5];

    vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
    vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

    float snoise(vec3 v){ 
        const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
        const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
      
      // First corner
        vec3 i  = floor(v + dot(v, C.yyy) );
        vec3 x0 =   v - i + dot(i, C.xxx) ;
      
      // Other corners
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min( g.xyz, l.zxy );
        vec3 i2 = max( g.xyz, l.zxy );
      
        //  x0 = x0 - 0. + 0.0 * C 
        vec3 x1 = x0 - i1 + 1.0 * C.xxx;
        vec3 x2 = x0 - i2 + 2.0 * C.xxx;
        vec3 x3 = x0 - 1. + 3.0 * C.xxx;
      
      // Permutations
        i = mod(i, 289.0 ); 
        vec4 p = permute( permute( permute( 
                   i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                 + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                 + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
      
      // Gradients
      // ( N*N points uniformly over a square, mapped onto an octahedron.)
        float n_ = 1.0/7.0; // N=7
        vec3  ns = n_ * D.wyz - D.xzx;
      
        vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)
      
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)
      
        vec4 x = x_ *ns.x + ns.yyyy;
        vec4 y = y_ *ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
      
        vec4 b0 = vec4( x.xy, y.xy );
        vec4 b1 = vec4( x.zw, y.zw );
      
        vec4 s0 = floor(b0)*2.0 + 1.0;
        vec4 s1 = floor(b1)*2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
      
        vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
        vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
      
        vec3 p0 = vec3(a0.xy,h.x);
        vec3 p1 = vec3(a0.zw,h.y);
        vec3 p2 = vec3(a1.xy,h.z);
        vec3 p3 = vec3(a1.zw,h.w);
      
      //Normalise gradients
        vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;
      
      // Mix final noise value
        vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
        m = m * m;
        return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                      dot(p2,x2), dot(p3,x3) ) );
      }

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

      float line = min(grid.x, grid.y);

      // Just visualize the grid lines directly
      float lineVisible = 1.0 - min(line, 1.0);

      lineVisible = pow(lineVisible, 1.0 / 2.2);
      vec3 lineColor = vec3(.1,.6,.3);
      vec3 finalColor = lineColor*lineVisible;


      float colInd = floor(uv.x*uNumCols);
      float rowInd = floor(uv.y*uNumRows);

      float colGrad = mod(colInd*uColFactor + rowInd*uRowFactor + uOffset,5.);
      vec3 gridColor = uColors[int(colGrad)];

      float noiseVal = snoise(vec3((colInd/uNumCols)*uNoiseFreqX, (rowInd/uNumRows)*uNoiseFreqY, uNoiseSeed));
      noiseVal = max(ceil(noiseVal - uNoiseCutoff),0.0);
    
    

      gridColor = gridColor*noiseVal*uNoise + (1. - uNoise)*gridColor;


      finalColor = finalColor + (1.0 - lineVisible)*(gridColor);

      gl_FragColor = vec4(finalColor, 1.0);
    }
    `
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

}



const initAnimation = () => {

}


const animate = () => {

    if (sceneState.initialized && sceneState.animating) {
        const elapsedTime = clock.getElapsedTime() - sceneState.pausedTime;
        const deltaTime = elapsedTime - sceneState.elapsedTime; 
        sceneState.elapsedTime = elapsedTime;

        controls.update();
        renderer.render(scene, camera);
        sceneState.updatedSinceLastRender = false;
    }

    window.requestAnimationFrame(animate);
}

const initGui = () => {
    const gui = new GUI();
    gui.add(gridMesh.rotation, 'x',-Math.PI,Math.PI, .01).name('Grid rotation x');
    gui.add(gridMesh.rotation, 'y',-Math.PI,Math.PI, .01).name('Grid rotation y');
    gui.add(gridMesh.rotation, 'z',-Math.PI,Math.PI, .01).name('Grid rotation z');
    gui.add(gridMesh.material.uniforms.uNumCols, 'value',0,30, 2).name('Grid columns');
    gui.add(gridMesh.material.uniforms.uNumRows, 'value',0,30, 2).name('Grid rows');
    gui.add(gridMesh.material.uniforms.uColFactor, 'value',0,10, .01).name('Column factor');
    gui.add(gridMesh.material.uniforms.uRowFactor, 'value',0,10, .01).name('Row factor');
    gui.add(gridMesh.material.uniforms.uOffset, 'value',0,5, .01).name('Offset');
    gui.add(gridMesh.material.uniforms.uNoiseCutoff, 'value',0,1, .01).name('Noise cutoff');
    gui.add(gridMesh.material.uniforms.uNoise, 'value',0,1, .01).name('Noise');
    gui.add(gridMesh.material.uniforms.uNoiseFreqX, 'value',0,5, .01).name('Noise freq x');
    gui.add(gridMesh.material.uniforms.uNoiseFreqY, 'value',0,5, .01).name('Noise freq y');
    gui.add(gridMesh.material.uniforms.uNoiseSeed, 'value',0,5, .01).name('Noise seed');
    gui.add(gridMesh.position, 'x',-30,0,.01).name('Grid position X');
    gui.add(gridMesh.position, 'y',-20,20,.01).name('Grid position Y');
    gui.add(gridMesh.position, 'z',0,30,.01).name('Grid position Z');
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