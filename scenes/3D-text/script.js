import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MSDFTextGeometry, MSDFTextMaterial } from "three-msdf-text-utils";
import { uniforms } from "three-msdf-text-utils";



const canvas = document.getElementById('webglCanvas');

// set up renderer
const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio( Math.min(window.devicePixelRatio,2));
renderer.setClearColor(0x000000,1);


// set up camera
const cameraParams = {
    fov: 75,
    aspectRatio: window.innerWidth/window.innerHeight,
}
const camera = new THREE.PerspectiveCamera(cameraParams.fov, cameraParams.aspectRatio, .01, 105);
camera.position.set(0 , 0 , 5 );
camera.lookAt(new THREE.Vector3(0,0,0));


// create scene
const scene = new THREE.Scene();

// create 3d text
const textParams = {
    thickness: true,
    mainColor: new THREE.Color('rgb(0,255,0)'),
    mainOpacity: 1,
    strokeColor: new THREE.Color('rgb(255,255,255)'),
    strokeOpacity: 1,


}

const centerTextMesh = (textMesh,params={}) => {
    let boundingSphere = textMesh.geometry.boundingSphere;
    let boundingBox = textMesh.geometry.boundingBox;
    if (!boundingSphere) {
        try {
            textMesh.geometry.computeBoundingSphere();
            boundingSphere = textMesh.geometry.boundingSphere;
            if (!boundingSphere) {
                return;
            }
        }
        catch (err) {
            return;
        }
        
    }
    if (!boundingBox) {
        try {
            textMesh.geometry.computeBoundingBox();
            boundingBox = textMesh.geometry.boundingBox;
            if (!boundingBox) {
                return;
            }
        }
        catch (err) {
            return;
        }
        
    }
    const textCenter = boundingSphere.center;
    if (params && params?.flippedY) {
        textCenter.y = -textCenter.y;
    }
    const maxPos = boundingBox.max;
    const minPos = boundingBox.min;

    const textRadius = boundingSphere.radius;


    const screenScale = calcScreenScaleRatio(
        {
            cameraAngle: cameraParams.fov,
            distanceFromCamera: textCenter.z*0 + 5,
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
        }
        );

    let textScale = 1;
    const xLength = screenScale.width;
    const yLength = screenScale.height;
    const textLengthX = (maxPos.x - minPos.x)*1;
    const textLengthY = (maxPos.y - minPos.y)*1;
    if (textLengthY>xLength) {
        textScale = xLength/textLengthX;
    }
    if (textLengthY> yLength) {
        textScale = Math.min(textScale, yLength/textLengthY);
    }

    textMesh.scale.set(textScale,textScale,textScale);
    textMesh.geometry.computeBoundingBox();
    const updatedBoundingBox = textMesh.geometry.boundingBox;

    const zAdjustment = -(maxPos.z - minPos.z)*textScale + textCenter.z*0;
    textMesh.position.set(-textCenter.x*textScale,-textCenter.y*textScale,zAdjustment + 0*textScale*1);

}

const calcScreenScaleRatio = (params) => {
    const screenWidth = Math.tan(((params.cameraAngle/2)/360)*Math.PI*2)*params.distanceFromCamera*2;
    const screenHeight = Math.tan(((params.cameraAngle/2)/360)*Math.PI*2)*params.distanceFromCamera*2;
    const screenWidthAdjusted = screenWidth*(params.windowWidth/params.windowHeight);

    return {width: screenWidthAdjusted, height: screenHeight};
}


const make3DText = () => {
    if (textParams.thickness) {
        makeThickText();
    }
    else {
        makeFlatText();
    }
}
const makeThickText = () => {
    fontLoader.load(fontPath,
        function (font) {
            const tempParams = {
                height: 20,
                size: 70,
                curveSegments: 10,
                bevelThickness: 2,
                bevelSize: 6,
            }
            const defaultParams= {
                size: 8,
                height: .5,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: .03,
                bevelSize: .02,
                bevelOffset: 0,
                bevelSegments: 5,
            }
            const textGeometry = new TextGeometry(
                textContent,
                {
                    font: font,
                    size: 70,
                    height: 20,
                    curveSegments: 12,
                    bevelEnabled: true,
                    bevelThickness: 8,
                    bevelSize: 3,
                    bevelOffset: 0,
                    bevelSegments: 10,
                    // size: 8,
                    // height: 0.5,
                    // curveSegments: 12,
                    // bevelEnabled: true,
                    // bevelThickness: 0.03,
                    // bevelSize: 0.02,
                    // bevelOffset: 0,
                    // bevelSegments: 5
                }
            )

       
            const textMaterials = [new THREE.MeshStandardMaterial({color: textParams.mainColor,opacity: textParams.mainOpacity,transparent: true}), new THREE.MeshStandardMaterial({color: textParams.strokeColor,opacity: textParams.strokeOpacity, transparent: true})]
     
            
            textMesh = new THREE.Mesh(textGeometry, textMaterials);
    
            textMesh.geometry.computeBoundingSphere();
            textMesh.geometry.computeBoundingBox();

   
    
            centerTextMesh(textMesh);
    
            scene.add(textMesh);
    
            renderer.render(scene, camera);
    
    });
}
const makeFlatText = () => {
    Promise.all([
        loadFontAtlas("/scenes/3D-text/open_sans_font_2.png"),
        loadFont("/scenes/3D-text/open_sans_font_2.json"),
    ]).then(([atlas, font]) => {
        const geometry = new MSDFTextGeometry({
            text: textContent,
            font: font.data,
        });
    
        const material = makeMSDFTextMaterial();
        material.uniforms.uMap.value = atlas;
        material.uniforms.uStrokeInsetWidth.value = .14;
        material.uniforms.uStrokeOutsetWidth.value = .0;
        material.uniforms.uThreshold.value = .05;
        material.uniforms.uOpacity.value = .8;
        material.uniforms.uStrokeColor.value = new THREE.Color('rgb(255,0,0)');
        material.uniforms.uColor.value = new THREE.Color('rgb(100,200,200)');
        material.uniforms.uAlphaTest.value = .01;
    
        textMesh = new THREE.Mesh(geometry, material);
        
        textMesh.rotation.set(Math.PI,0,0);
        // textMesh.updateMatrix();
        // textMesh.updateMatrixWorld({force: true});

        centerTextMesh(textMesh,{flippedY: true});

        
        scene.add(textMesh);
    
        renderer.render(scene, camera);
    });
}
function loadFontAtlas(path) {
    const promise = new Promise((resolve, reject) => {
        const loader = new THREE.TextureLoader();
        loader.load(path, resolve);
    });

    return promise;
}

function loadFont(path) {
    const promise = new Promise((resolve, reject) => {
        const loader = new FontLoader();
        loader.load(path, resolve);
    });

    return promise;
}
const makeMSDFTextMaterial = () => {
    const material = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        transparent: true,
        defines: {
            IS_SMALL: false,
        },
        extensions: {
            derivatives: true,
        },
        uniforms: {
            // Common
            ...uniforms.common,
            
            // Rendering
            ...uniforms.rendering,
            
            // Strokes
            ...uniforms.strokes,
        },
        vertexShader: `
            // Attribute
            attribute vec2 layoutUv;
    
            attribute float lineIndex;
    
            attribute float lineLettersTotal;
            attribute float lineLetterIndex;
    
            attribute float lineWordsTotal;
            attribute float lineWordIndex;
    
            attribute float wordIndex;
    
            attribute float letterIndex;
    
            // Varyings
            varying vec2 vUv;
            varying vec2 vLayoutUv;
            varying vec3 vViewPosition;
            varying vec3 vNormal;
    
            varying float vLineIndex;
    
            varying float vLineLettersTotal;
            varying float vLineLetterIndex;
    
            varying float vLineWordsTotal;
            varying float vLineWordIndex;
    
            varying float vWordIndex;
    
            varying float vLetterIndex;
    
            void main() {
                // Output
                vec4 mvPosition = vec4(position, 1.0);
                mvPosition = modelViewMatrix * mvPosition;
                gl_Position = projectionMatrix * mvPosition;
    
                // Varyings
                vUv = uv;
                vLayoutUv = layoutUv;
                vViewPosition = -mvPosition.xyz;
                vNormal = normal;
    
                vLineIndex = lineIndex;
    
                vLineLettersTotal = lineLettersTotal;
                vLineLetterIndex = lineLetterIndex;
    
                vLineWordsTotal = lineWordsTotal;
                vLineWordIndex = lineWordIndex;
    
                vWordIndex = wordIndex;
    
                vLetterIndex = letterIndex;
            }
        `,
        fragmentShader: `
            // Varyings
            varying vec2 vUv;
    
            // Uniforms: Common
            uniform float uOpacity;
            uniform float uThreshold;
            uniform float uAlphaTest;
            uniform vec3 uColor;
            uniform sampler2D uMap;
    
            // Uniforms: Strokes
            uniform vec3 uStrokeColor;
            uniform float uStrokeOutsetWidth;
            uniform float uStrokeInsetWidth;
    
            // Utils: Median
            float median(float r, float g, float b) {
                return max(min(r, g), min(max(r, g), b));
            }
    
            void main() {
                // Common
                // Texture sample
                vec3 s = texture2D(uMap, vUv).rgb;
    
                // Signed distance
                float sigDist = median(s.r, s.g, s.b) - 0.5;
    
                float afwidth = 1.4142135623730951 / 2.0;
    
                #ifdef IS_SMALL
                    float alpha = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDist);
                #else
                    float alpha = clamp(sigDist / fwidth(sigDist) + 0.5, 0.0, 1.0);
                #endif
    
                // Strokes
                // Outset
                float sigDistOutset = sigDist + uStrokeOutsetWidth * 0.5;
    
                // Inset
                float sigDistInset = sigDist - uStrokeInsetWidth * 0.5;
    
                #ifdef IS_SMALL
                    float outset = smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistOutset);
                    float inset = 1.0 - smoothstep(uThreshold - afwidth, uThreshold + afwidth, sigDistInset);
                #else
                    float outset = clamp(sigDistOutset / fwidth(sigDistOutset) + 0.5, 0.0, 1.0);
                    float inset = 1.0 - clamp(sigDistInset / fwidth(sigDistInset) + 0.5, 0.0, 1.0);
                #endif
    
                // Border
                float border = outset * inset;
    
                // Alpha Test
                if (alpha < uAlphaTest) discard;
    
                // Output: Common
                vec4 filledFragColor = vec4(uColor, uOpacity * alpha);
    
                // Output: Strokes
                vec4 strokedFragColor = vec4(uStrokeColor, uOpacity * border);
    
                gl_FragColor = strokedFragColor;
            }
        `,
    });
    return material;
}
let textMesh;
const textContent  = 'Text!!!';
const fontPath = '/scenes/3D-text/helvetiker_regular.typeface.json';
const fontLoader = new FontLoader();

make3DText();


// add test objects
const screenScale = calcScreenScaleRatio(
    {
        cameraAngle: cameraParams.fov,
        distanceFromCamera:  5,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
    }
);


const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshPhongMaterial({color: new THREE.Color('rgb(200,0,0)')});
const boxMesh1 = new THREE.Mesh(boxGeometry, boxMaterial);
boxMesh1.position.set(-screenScale.width*.5,0,0);

const boxMaterial2 = new THREE.MeshPhongMaterial({color: new THREE.Color('rgb(0,200,0)')});
const boxMesh2 = new THREE.Mesh(boxGeometry, boxMaterial2);
boxMesh2.position.set(screenScale.width*.5,0,0);

const boxScale = .001
boxMesh1.scale.set(boxScale, boxScale,boxScale);
boxMesh2.scale.set(boxScale, boxScale,boxScale);

// scene.add(boxMesh1);
// scene.add(boxMesh2);

// add some light

const spotlight = new THREE.PointLight(0xffffff, .5,6);
spotlight.position.set(-1.5,0,-5);


scene.add(spotlight);

//create hemisphere light and add to scene
const hemispherelight = new THREE.HemisphereLight( 0xffffff, 0x000, 7);

scene.add(hemispherelight);



// render scene
renderer.render(scene, camera);

// update camera and renderer and re-render when window is resized
window.addEventListener('resize',() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
    const newAspectRatio = windowWidth/windowHeight;
    camera.aspect = newAspectRatio;
    camera.updateProjectionMatrix();
    cameraParams.aspectRatio = newAspectRatio;
    
});


// animate

// Set up controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true;

const clock = new THREE.Clock(); // initialize the ThreeJS Clock object
clock.start(); // "start" it by calling the start() method on it


let animationActive = true;
const tick = () => {
    if (animationActive) {

        const deltaTime = clock.getDelta(); // get the delta time at each frame
        const elapsedTime = clock.getElapsedTime();

        controls.update();

        renderer.render(scene, camera); // render the scene with the updated box in it.

 

    }

    window.requestAnimationFrame(tick); // request next frame from browser when its ready

}
tick();

// keypress event listener
window.addEventListener('keydown',(event)=> {
    if (event.key=='f') {
       animationActive = !animationActive;

    }
});



const curveTextGeometry = (textGeometry, curvePct, cameraParams) => {
    if (!textGeometry.boundingBox) {
        textGeometry.computeBoundingBox();
    }
  
    const maxPos = textGeometry.boundingBox.max;
    const minPos = textGeometry.boundingBox.min;
    const circleRadius = 5;
    const posArray = textGeometry.attributes.position.array;

    let newPosArray = [];
    for (let i=0;i<posArray.length/3;i++) {
        const posIndex = i*3;
        const pos = {x: posArray[posIndex],y: posArray[posIndex+1],z: posArray[posIndex+2]};

        const xPct = (pos.x - minPos.x)/(maxPos.x - minPos.x);
        const angleToUse = ((xPct*2)*Math.PI+Math.PI*.5)*curvePct;
        const newXNormalized = Math.cos(angleToUse)*circleRadius;
        const newZNormalized = Math.sin(angleToUse)*circleRadius;

        const newX = newXNormalized*(maxPos.x - minPos.x) + minPos.x;

        const newZ = newZNormalized*(5);

        const newPos = {x: (newX), y: pos.y, z: pos.z+newZ};

        newPosArray.push(newPos.x);
        newPosArray.push(newPos.y);
        newPosArray.push(newPos.z);

    }

    textGeometry.setAttribute( 'position', new THREE.BufferAttribute( new Float32Array(newPosArray), 3 ) );
}