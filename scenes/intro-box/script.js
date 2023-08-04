import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';


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

renderer.setClearColor(0xffffff,1);

renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;


// set up camera
const camera = new THREE.PerspectiveCamera(90, window.innerWidth/window.innerHeight, .01, 105);
camera.position.set(0 , 0 , -5 );
camera.lookAt(new THREE.Vector3(0,0,0));


// create scene
const scene = new THREE.Scene();

// create box and add to scene
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const boxMaterial = new THREE.MeshPhongMaterial({shininess: 50,color: new THREE.Color('rgb(0,0,0)'), specular: new THREE.Color('rgb(255,255,255)')});
const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
boxMesh.rotation.set(0,Math.PI*2*.04,0);
boxMesh.scale.set(2,2,2);

scene.add(boxMesh);

//create light and add to scene
const spotlight = new THREE.PointLight(0xffffff, .5,6);
spotlight.position.set(-1.5,0,-5);


scene.add(spotlight);



// render scene
renderer.render(scene, camera);

// update camera and renderer and re-render when window is resized
window.addEventListener('resize',() => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    renderer.setSize(windowWidth, windowHeight);
    camera.aspect = windowWidth/windowHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
});


// gui to set it to black monolith dimensions
const makeBox = () => {
    boxMesh.scale.set(2,2,2);
    boxMesh.rotation.set(0,Math.PI*2*.04,0);
    spotlight.position.set(-1.5,0,-5);
    spotlight.intensity=.5;
    renderer.render(scene, camera);
}

const makeMonolith = () => {
    const scaleRatio = .75;
    boxMesh.scale.set(4*scaleRatio,9*scaleRatio,1*scaleRatio);
    boxMesh.rotation.set(0,Math.PI*2*.075,0);
    spotlight.position.set(-1.5,2,-5);
    spotlight.intensity=1;
    renderer.render(scene, camera);
}

const params = {
    monolith: false,
}
const gui = new GUI();
gui.add(params, 'monolith').name('Black monolith').onChange((value)=> {
    if (value) {
        makeMonolith()
    }
    else {
        makeBox();
    }
});
const captureCanvas = {
    takeScreenshot: async function() {
        const png = canvas.toDataURL("image/png",1);
        const blob = await (await fetch(png)).blob()
        downloadButton.href = URL.createObjectURL(blob);
        downloadButton.download="screenshot.png"
        downloadButton.click();
    }
}
gui.add(captureCanvas, 'takeScreenshot').name('Take screenshot');

const downloadButton = document.createElement('a');
document.body.appendChild(downloadButton);
// downloadButton.innerText = 'Download';