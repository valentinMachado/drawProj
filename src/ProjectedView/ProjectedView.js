/** @format */
import * as THREE from 'three';

import './projectedcss.css';

export class ProjectedView {
  constructor() {
    this.model = new SceneModel();

    this.renderer = new THREE.WebGLRenderer();

    this.rootHtml = this.renderer.domElement;
  }

  html() {
    return this.rootHtml;
  }

  tick() {
    this.model.tick(this.renderer);

    requestAnimationFrame(this.tick.bind(this));
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.model.orthoCamera.updateProjectionMatrix();
    this.model.perspectiveCamera.updateProjectionMatrix();
  }

  keyup(event) {
    if (event.key == 't') {
      this.model.screenPlane.rotateY(0.01);
    }
  }

  init() {
    this.model.init();

    this.resize();
    window.addEventListener('resize', this.resize.bind(this));
    window.addEventListener('keyup', this.keyup.bind(this));

    requestAnimationFrame(this.tick.bind(this));
  }

  dispose() {
    window.removeEventListener('resize', this.resize.bind(this));
    window.removeEventListener('keyup', this.keyup.bind(this));
  }
}

class SceneModel {
  constructor() {
    this.scenePlane = new THREE.Scene();
    this.sceneImages = new THREE.Scene();

    this.screenPlane = null;

    this.perspectiveCamera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);

    const width = 1;
    const height = 1;

    this.orthoCamera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    );
    this.orthoCamera.position.set(0, 0, 1);
    this.orthoCamera.lookAt(new THREE.Vector3());

    this.bufferTexture = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
      }
    );
  }

  tick(renderer) {
    renderer.setRenderTarget(this.bufferTexture);
    renderer.clear();
    renderer.render(this.sceneImages, this.perspectiveCamera);

    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(this.scenePlane, this.orthoCamera);
  }

  init() {
    const vertexString =
      'varying vec2 vUv;' +
      'void main() {' +
      'vUv = uv;' +
      'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );' +
      '}';

    const materialScreen = new THREE.ShaderMaterial({
      uniforms: { tDiffuse: { value: this.bufferTexture.texture } },
      fragmentShader:
        'varying vec2 vUv;' +
        'uniform sampler2D tDiffuse;' +
        'void main() {' +
        'gl_FragColor = texture2D( tDiffuse, vUv );' +
        // 'gl_FragColor = vec4(1,0,0,1);' +
        '}',
      vertexShader: vertexString,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const geometry = new THREE.PlaneGeometry(1, 1);
    this.screenPlane = new THREE.Mesh(geometry, materialScreen);
    this.scenePlane.add(this.screenPlane);

    //scene images
    this.sceneImages.background = new THREE.Color(0xffffff);

    const dirLight = new THREE.DirectionalLight();
    dirLight.position.set(10, 10, 10);
    dirLight.lookAt(new THREE.Vector3());
    this.sceneImages.add(dirLight);

    const materialBox = new THREE.MeshBasicMaterial({
      color: 'red',
    });
    const geometryBox = new THREE.BoxGeometry(1, 5, 1);
    const box = new THREE.Mesh(geometryBox, materialBox);
    this.sceneImages.add(box);
    box.rotateY(Math.PI / 4);

    this.perspectiveCamera.position.set(0, 0, 10);
    this.perspectiveCamera.lookAt(new THREE.Vector3());
  }
}
