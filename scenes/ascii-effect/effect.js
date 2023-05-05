import * as THREE from 'three';

export class FullScreenShaderQuad {

    constructor(shader) {

        this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );

        const _geometry = new THREE.BufferGeometry();
        _geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ - 1, 3, 0, - 1, - 1, 0, 3, - 1, 0 ], 3 ) );
        _geometry.setAttribute( 'uv', new THREE.Float32BufferAttribute( [ 0, 2, 0, 0, 2, 0 ], 2 ) );

        this.geometry = _geometry;

        this.material = new THREE.ShaderMaterial(shader);

        this.mesh =  new THREE.Mesh( this.geometry, this.material);

    }

    render(renderer) {
        renderer.render(this.mesh,this.camera);
    }


};

export class Effect {

    constructor(effectParams) {

        this.writeBuffer = null;
        this.readBuffer = null;

        this.inputBuffer = null;

        this.outputBuffer = null;
        this.fsQuad = null;

        this.params = effectParams;
        

    }
    /**
     * @param {Object} initParams
     * @property {number} windowWidth
     * @property {number} windowHeight
     * @property {Object} rendererParams
     * @property {boolean} [depthTexture]
    */
    initialize() {
        let rt1 = new THREE.WebGLRenderTarget(this.params.windowWidth,this.params.windowHeight, this.params.rendererParams);
        if (this.params.depthTexutre) {
            rt1.depthBuffer = true;
            const depthResolution =  512;
            rt1.depthTexture = new THREE.DepthTexture(depthResolution, depthResolution);
            rt1.depthTexture.format = THREE.DepthFormat
            rt1.depthTexture.type = THREE.UnsignedShortType
        }
        this.writeBuffer = rt1;
        this.readBuffer = rt1.clone();

        this.fsQuad = new FullScreenShaderQuad(this.params.shader); 

    }


}