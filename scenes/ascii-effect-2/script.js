import * as THREE from 'three';
import { Effect } from './effect.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';



const canvas = document.getElementById('webglCanvas');

// set up renderer
const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
    });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( Math.min(window.devicePixelRatio,2));

renderer.setClearColor(0xffffff,1.);


// set up camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, .01, 105);
camera.position.set(0 , 0 , -5 );
camera.lookAt(new THREE.Vector3(0,0,0));


// create scene
const scene = new THREE.Scene();

const tImg = new THREE.TextureLoader().load('../../scene-assets/ascii-effect/selfie4.jpg');

const planeGeometry = new THREE.PlaneGeometry( 5, 5 );
const planeMaterial = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide, map: tImg} );
const texturePlane = new THREE.Mesh( planeGeometry, planeMaterial );
texturePlane.position.set(0,-1.02,-3);
scene.add( texturePlane );


const ambientLight = new THREE.AmbientLight(0xffffff,1);
scene.add(ambientLight);

// based on: https://github.com/jmswrnr/website-examples/tree/master/3d-header/ascii-effect
const asciiShader = {
    uniforms: {
      tLowRes: { value: null },
      tFont: { value: null },
      tDepth: { value: null },
      fontCharTotalCount: { value: 16 },
      fontCharCount: { value: new THREE.Vector2(8, 2) },
      fontCharSize: { value: new THREE.Vector2(1/8, 1/2) },
      renderCharCount: { value: new THREE.Vector2(1, 1) },
      renderCharSize: { value: new THREE.Vector2(1, 1) },
      cameraNear: { value: .01 },
      cameraFar: { value: 10},
      opacity: {value: 1},
      brightness: {value: 0},
      depthAdjustment: {value: .47},
      maxDepth: {value: .85},
      minDepth: {value: .19},
      depthMod: {value: 1},
      doubleXChar: {value: 0},
      uvShiftX: {value: -.0},
      uvShiftY: {value: -.0},
      charCountFactor: {value: 2},
      uTime: {value: 0},
      overallOpacity: {value: 1},
      bgColor: {value: new THREE.Color('rgb(40,70,120)')},
      asciiColor: {value: new THREE.Color('rgb(0,255,30)')}
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
     #include <packing>
      varying vec2 vUv;
      uniform sampler2D tLowRes;
      uniform sampler2D tDepth;
      uniform sampler2D tFont;
      uniform float cameraNear;
      uniform float cameraFar;
      uniform float fontCharTotalCount;
      uniform vec2 fontCharSize;
      uniform vec2 fontCharCount;
      uniform vec2 renderCharCount;
      uniform vec2 renderCharSize;
      uniform float opacity;
      uniform float brightness;
      uniform float depthAdjustment;
      uniform float depthMod;
      uniform float maxDepth;
      uniform float minDepth;
      uniform float doubleXChar;
      uniform float uvShiftX;
      uniform float uvShiftY;
      uniform float charCountFactor;
      uniform float uTime;
      uniform float overallOpacity;
      uniform vec3 bgColor; 
      uniform vec3 asciiColor;
      float readDepth(sampler2D depthSampler, vec2 coord) {
        float fragCoordZ = texture2D(depthSampler, coord).x;
        float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
        return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
      }
      void main()
      {
        vec2 roundedUv = vec2(
          floor(vUv.x * renderCharCount.x/charCountFactor),
          floor(vUv.y * renderCharCount.y/charCountFactor)
        ) * renderCharSize*charCountFactor;
        // float depth = (readDepth(tDepth, roundedUv));
        vec4 origColor = texture2D(tLowRes, roundedUv);

        float gray = 0.21 * origColor.r + 0.71 * origColor.g + 0.07 * origColor.b;
        gray= (max(min(gray,maxDepth),minDepth)-minDepth)/(maxDepth-minDepth);
        gray = mod(gray+ depthAdjustment, depthMod);
      
        float charIndex = mod(((gray) * fontCharTotalCount),fontCharTotalCount);
        vec2 fontuv = vec2(
          mod(vUv.x+uvShiftX, charCountFactor*renderCharSize.x*(1. + doubleXChar)),
          mod(vUv.y+uvShiftY, charCountFactor*renderCharSize.y)
        ) * renderCharCount/(charCountFactor) * fontCharSize + vec2(
          floor(mod(charIndex, fontCharCount.x)) * fontCharSize.x,
          floor(charIndex * fontCharSize.x) * fontCharSize.y);
        float xIndex = floor(vUv.x*renderCharCount.x/charCountFactor)/(renderCharCount.x/charCountFactor);
        


        vec4 bgColor = vec4(vec3(bgColor),overallOpacity);
        vec4 mainColor = vec4(vec3(asciiColor),overallOpacity)*((origColor)*(1.-brightness) + brightness);
        
        gl_FragColor = texture2D(tFont, fontuv) * mainColor*opacity + vec4(0.,0.,0.,overallOpacity) + (1.-opacity)*vec4(vec3(gray),1.)*1.0 ;
    }
    `,
  };

  const asciiParams = {
    charCount: 8,
    depthAdjustment: 0,
    cameraNear: .04,
    cameraFar: 10,
    overallOpacity: 1,
    idealWidth: 1190,
    idealHeight: 570,
    zoom: 1,
    zoomAnimation: true,
    zoomAnimationDuration: 4,
    zoomAnimationDelay: 2,

  }

  const rendererParams =  {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    encoding: renderer.outputEncoding,
    type: THREE.UnsignedByteType, // THREE.UnsignedByteType,THREE.HalfFloatType
    antisotropy: 1,
    samples: 1
}

const effectParams = {
    rendererParams: rendererParams,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    shader: asciiShader,
}

const createAsciiEffect = () => {

    const effect = new Effect(effectParams);
    effect.initialize();
    const lowResDepthTexture = new THREE.DepthTexture();
    lowResDepthTexture.type = THREE.UnsignedShortType;

    effect.readBuffer.depthTexture = lowResDepthTexture;
    effect.writeBuffer.depthTexture = lowResDepthTexture;
    effect.fsQuad.mesh.material.uniforms.tDepth.value = lowResDepthTexture;

    const tFont = new THREE.TextureLoader().load('../../scene-assets/ascii-effect/asciiFont2.jpg');
    tFont.minFilter = THREE.NearestFilter;
    tFont.magFilter = THREE.NearestFilter;
    effect.fsQuad.mesh.material.uniforms.tFont.value = tFont;

    const charCount = asciiParams.charCount;
    // const windowWidth = asciiParams.idealWidth;
    // const windowHeight = asciiParams.idealHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const renderCharSize = new THREE.Vector2(charCount/(windowWidth), charCount/(windowHeight));
    const renderCharCount = new THREE.Vector2(windowWidth/charCount, windowHeight/charCount);
    effect.fsQuad.mesh.material.uniforms.renderCharSize.value = renderCharSize;
    effect.fsQuad.mesh.material.uniforms.renderCharCount.value = renderCharCount;

    effect.fsQuad.mesh.material.uniforms.cameraNear.value = asciiParams.cameraNear;
    effect.fsQuad.mesh.material.uniforms.cameraFar.value = asciiParams.cameraFar;
    effect.fsQuad.mesh.material.uniforms.overallOpacity.value = asciiParams.overallOpacity;

    effect.onWindowResize = function(windowWidth, windowHeight) {
        const charCount = asciiParams.charCount;
        const renderCharSize = new THREE.Vector2(charCount/windowWidth, charCount/windowHeight);
        const renderCharCount = new THREE.Vector2(windowWidth/charCount, windowHeight/charCount);
        effect.fsQuad.mesh.material.uniforms.renderCharSize.value = renderCharSize;
        effect.fsQuad.mesh.material.uniforms.renderCharCount.value = renderCharCount;
    }
    effect.render = function(renderer) {
        this.fsQuad.mesh.material.uniforms.tLowRes.value = this.readBuffer.texture;
        this.fsQuad.render(renderer);
        this.readBuffer = this.writeBuffer;
    }

    return effect;

}
const asciiEffect = createAsciiEffect();



// Set up controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;









// update camera and renderer and re-render when window is resized
window.addEventListener('resize',() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth/windowHeight;
    camera.updateProjectionMatrix();


    asciiEffect.onWindowResize(windowWidth,windowHeight);
});

const clock = new THREE.Clock(); // initialize the ThreeJS Clock object
clock.start(); // "start" it by calling the start() method on it
let animationActive = true;
const tick = () => {
    if (animationActive) {

        const elapsedTime = clock.getElapsedTime(); // get elapsed time
        controls.update();
        renderer.setRenderTarget(null);
        asciiEffect.render(renderer);
        renderer.setRenderTarget(asciiEffect.readBuffer);
    
        renderer.render(scene, camera); // render the scene with the updated box in it. 


    }

    window.requestAnimationFrame(tick); // request next frame from browser when its ready

}


// start tick

tick();


// keypress event listener
window.addEventListener('keydown',(event)=> {
    if (event.key=='f') {
       animationActive = !animationActive;

    }
});


const gui = new GUI();
const asciiFolder = gui.addFolder('Ascii Controls');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.opacity, 'value', 0,1,.01).name('Opacity');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.brightness, 'value', 0,1,.01).name('Brightness');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.overallOpacity, 'value', 0,1,.01).name('Overall opacity');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.depthAdjustment, 'value', 0,1,.01).name('Depth adjustment');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.maxDepth, 'value', 0,1,.01).name('Max depth');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.minDepth, 'value', 0,1,.01).name('Min depth');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.depthMod, 'value', .01,3,.01).name('Depth mod');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.charCountFactor, 'value', .25,64,1).name('Char count factor');
asciiFolder.addColor(asciiEffect.fsQuad.mesh.material.uniforms.asciiColor,'value').name('Ascii Color');
asciiFolder.addColor(asciiEffect.fsQuad.mesh.material.uniforms.bgColor,'value').name('Background Color');
const planeFolder = gui.addFolder('Plane controls');
planeFolder.add(texturePlane.position,'y',-5,5,.01).name('Position y');
planeFolder.add(texturePlane.position,'z',-5,5,.01).name('Position z');
planeFolder.add(texturePlane.position,'x',-5,5,.01).name('Position x');
const captureCanvas = {
    takeScreenshot: async function() {
        const png = canvas.toDataURL("image/png",1);
        const blob = await (await fetch(png)).blob()
        downloadButton.href = URL.createObjectURL(blob);
        downloadButton.download="testCapture.png"
        downloadButton.click();
    }
}
gui.add(captureCanvas, 'takeScreenshot').name('Take screenshot');


const downloadButton = document.createElement('a');
document.body.appendChild(downloadButton);
downloadButton.innerText = 'Download';
