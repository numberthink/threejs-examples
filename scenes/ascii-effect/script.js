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
        alpha: true
    });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( Math.min(window.devicePixelRatio,2));

renderer.setClearColor(0xffffff,1.);


// set up camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, .01, 105);
camera.position.set(0 , 0 , -5 );
camera.lookAt(new THREE.Vector3(0,0,0));


// create scene
const scene = new THREE.Scene();


const ambientLight = new THREE.AmbientLight(0xffffff,1);
scene.add(ambientLight);

// based on: https://github.com/jmswrnr/website-examples/tree/master/3d-header/ascii-effect
const asciiShader = {
    uniforms: {
      tLowRes: { value: null },
      tFont: { value: null },
      tDepth: { value: null },
      fontCharTotalCount: { value: 56 },
      fontCharCount: { value: new THREE.Vector2(8, 7) },
      fontCharSize: { value: new THREE.Vector2(1/8, 1/8) },
      renderCharCount: { value: new THREE.Vector2(1, 1) },
      renderCharSize: { value: new THREE.Vector2(1, 1) },
      cameraNear: { value: .01 },
      cameraFar: { value: 10},
      opacity: {value: 1},
      depthAdjustment: {value: .23},
      maxDepth: {value: 1},
      depthMod: {value: 1},
      doubleXChar: {value: 1},
      uvShiftX: {value: -.1},
      uvShiftY: {value: -.11},
      charCountFactor: {value: 64},
      uTime: {value: 0},
      overallOpacity: {value: 1},
      bgColor: {value: new THREE.Color('rgb(40,70,120)')},
      asciiColor: {value: new THREE.Color('rgb(20,150,40)')}
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
      uniform float depthAdjustment;
      uniform float depthMod;
      uniform float maxDepth;
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
        float depth = (readDepth(tDepth, roundedUv));
        vec4 origColor = texture2D(tLowRes, roundedUv);

        float passedMaxDepth = min(max(ceil(depth-maxDepth),0.0),1.)*(1.-floor(maxDepth));
        depth = min(depth,maxDepth)/maxDepth;
        depth = mod(depth + depthAdjustment, depthMod);
      
        float charIndex = mod((depth * fontCharTotalCount - 2.0),fontCharTotalCount);
        vec2 fontuv = vec2(
          mod(vUv.x+uvShiftX, charCountFactor*renderCharSize.x*(1. + doubleXChar)),
          mod(vUv.y+uvShiftY, charCountFactor*renderCharSize.y)
        ) * renderCharCount/(charCountFactor) * fontCharSize + vec2(
          floor(mod(charIndex, fontCharCount.x)) * fontCharSize.x,
          floor(charIndex * fontCharSize.x) * fontCharSize.y);
        float xIndex = floor(vUv.x*renderCharCount.x/charCountFactor)/(renderCharCount.x/charCountFactor);
        float gray = 0.21 * origColor.r + 0.71 * origColor.g + 0.07 * origColor.b;


        vec4 bgColor = vec4(vec3(bgColor),overallOpacity);
        vec4 mainColor = vec4(vec3(asciiColor),overallOpacity);
        
        gl_FragColor = texture2D(tFont, fontuv) * mainColor * opacity*(1.0 - passedMaxDepth) + (1.-opacity)*vec4(vec3(gray),1.)*(1.0 - passedMaxDepth) + bgColor*passedMaxDepth ;
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

    const tFont = new THREE.TextureLoader().load('../../scene-assets/ascii-effect/asciiFont1.jpg');
    tFont.minFilter = THREE.NearestFilter;
    tFont.magFilter = THREE.NearestFilter;
    effect.fsQuad.mesh.material.uniforms.tFont.value = tFont;

    const charCount = asciiParams.charCount;
    const windowWidth = asciiParams.idealWidth;
    const windowHeight = asciiParams.idealHeight;
    const renderCharSize = new THREE.Vector2(charCount/(windowWidth), charCount/(windowHeight));
    const renderCharCount = new THREE.Vector2(windowWidth/charCount, windowHeight/charCount);
    effect.fsQuad.mesh.material.uniforms.renderCharSize.value = renderCharSize;
    effect.fsQuad.mesh.material.uniforms.renderCharCount.value = renderCharCount;

    effect.fsQuad.mesh.material.uniforms.cameraNear.value = asciiParams.cameraNear;
    effect.fsQuad.mesh.material.uniforms.cameraFar.value = asciiParams.cameraFar;
    effect.fsQuad.mesh.material.uniforms.overallOpacity.value = asciiParams.overallOpacity;

    effect.onWindowResize = function(windowWidth, windowHeight) {
        // const charCount = asciiParams.charCount*asciiParams.charCountFactor;
        // const renderCharSize = new THREE.Vector2(charCount/windowWidth, charCount/windowHeight);
        // const renderCharCount = new THREE.Vector2(windowWidth/charCount, windowHeight/charCount);
        // effect.fsQuad.mesh.material.uniforms.renderCharSize.value = renderCharSize;
        // effect.fsQuad.mesh.material.uniforms.renderCharCount.value = renderCharCount;
    }
    effect.render = function(renderer) {
        this.fsQuad.mesh.material.uniforms.tLowRes.value = this.readBuffer.texture;
        this.fsQuad.render(renderer);
        this.readBuffer = this.writeBuffer;
    }

    return effect;

}
const asciiEffect = createAsciiEffect();

const loader = new GLTFLoader();

let avatar;
loader.load(
	// resource URL
	'../../scene-assets/ascii-effect/brianModel1.glb',
	// called when the resource is loaded
	function ( gltf ) {

        avatar = gltf.scene;
        avatar.rotation.set(-.26,-Math.PI*.5,0);
        avatar.scale.set(0,0,0);
        avatar.position.set(0,-5,.62);
		scene.add( avatar );

        addAvatarGuiControls(avatar);

	},
	// called while loading is progressing
	function ( xhr ) {

		console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

	},
	// called when loading has errors
	function ( error ) {

		console.log( 'An error happened' );

	}
);

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
        doAsciiAnimation(elapsedTime);
        controls.update();
        renderer.setRenderTarget(null);
        asciiEffect.render(renderer);
        renderer.setRenderTarget(asciiEffect.readBuffer);
    
        renderer.render(scene, camera); // render the scene with the updated box in it. 


    }

    window.requestAnimationFrame(tick); // request next frame from browser when its ready

}

const doAsciiAnimation = (elapsedTime) => {
    if (asciiParams.zoomAnimation && elapsedTime<=(asciiParams.zoomAnimationDuration+asciiParams.zoomAnimationDelay) && elapsedTime>=asciiParams.zoomAnimationDelay) {
        let newZoom = ((asciiParams.zoomAnimationDuration+asciiParams.zoomAnimationDelay) - elapsedTime)/asciiParams.zoomAnimationDuration;
        newZoom = Math.min(Math.max(newZoom,0),1);
        asciiParams.zoom = newZoom;
        onZoomUpdate(newZoom);
    }
}
// start tick

tick();


// keypress event listener
window.addEventListener('keydown',(event)=> {
    if (event.key=='f') {
       animationActive = !animationActive;

    }
});

const viewSettings = {
    doubleXChar: {full: 0, zoom: 1,pctFull: .75},
    depthAdjustment: {full: .29, zoom: .23},
    uvShiftX: {full: 0, zoom: -0.1, pctFull: .75},
    uvShiftY: {full: 0, zoom: -.11, pctFull: .75},
    charCountFactor: {full: 2, zoom: 64},
    scale: {full: 9, zoom: 0, avatar: true},
    opacity: {full: .9, zoom: 1},


}
const gui = new GUI();
const asciiFolder = gui.addFolder('Ascii Controls');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.opacity, 'value', 0,1,.01).name('Opacity');

asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.depthAdjustment, 'value', 0,1,.01).name('Depth adjustment');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.maxDepth, 'value', 0,1,.01).name('Max depth');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.depthMod, 'value', .01,1,.01).name('Depth mod');
asciiFolder.add(asciiEffect.fsQuad.mesh.material.uniforms.charCountFactor, 'value', .25,64,1).name('Char count factor');
asciiFolder.add(asciiParams, 'zoom', 0,1,.01).name('Zoom').onChange((value)=> onZoomUpdate(value));
asciiFolder.addColor(asciiEffect.fsQuad.mesh.material.uniforms.asciiColor,'value').name('Ascii Color');
asciiFolder.addColor(asciiEffect.fsQuad.mesh.material.uniforms.bgColor,'value').name('Background Color');
const onZoomUpdate = (value) => {
    Object.keys(viewSettings).forEach((uniformName)=> {
        let zoomPct = parseFloat(value);
        if (viewSettings[uniformName]?.pctFull) {
            zoomPct = Math.max((value-viewSettings[uniformName].pctFull)/(1-viewSettings[uniformName].pctFull),0);
        }
        const newVal = zoomPct*(viewSettings[uniformName].zoom - viewSettings[uniformName].full) + viewSettings[uniformName].full;
        if (viewSettings[uniformName]?.avatar) {
            if (avatar) {
                avatar[uniformName].set(newVal, newVal, newVal);
            }
            
        }
        else {
            asciiEffect.fsQuad.mesh.material.uniforms[uniformName].value = newVal;
        }
    })
}


const addAvatarGuiControls = (avatar) => {
    const avatarFolder = gui.addFolder('Avatar controls');
    avatarFolder.add(avatar.position,'x',-2,2,.01).name('Position x');
    avatarFolder.add(avatar.position,'y',-5,2,.01).name('Position y');
    avatarFolder.add(avatar.position,'z',-2,2,.01).name('Position z');
    avatarFolder.add(avatar.rotation,'y',-Math.PI,Math.PI,.01).name('Rotation y');
    avatarFolder.add(avatar.rotation,'x',-Math.PI,Math.PI,.01).name('Rotation x');
    avatarFolder.add(avatar.scale,'x', 0,10,.01).name('scale').onChange((value)=> {
        avatar.scale.set(value,value,value);
    })
}