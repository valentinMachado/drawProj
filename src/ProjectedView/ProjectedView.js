/** @format */
import * as THREE from 'three/build/three.module.js';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls';

import './projectedcss.css';

export class ProjectedView {
  constructor() {
    this.model = new SceneModel();

    this.renderer = new THREE.WebGLRenderer();

    this.rootHtml = this.renderer.domElement;

    this.renderingPlane = true;
  }

  html() {
    return this.rootHtml;
  }

  tick() {
    if (!this.freezed) {
      const renderer_width = window.innerWidth;
      const renderer_height = window.innerHeight;

      if (this.renderingPlane) {
        this.renderer.setClearColor(0xe0e0e0);
        this.renderer.setScissorTest(false);
        this.renderer.clear();

        this.renderer.setRenderTarget(this.model.bufferTexture);
        this.renderer.clear();
        this.renderer.render(
          this.model.sceneImages,
          this.model.defaultcameraImages
        );

        this.renderer.setScissorTest(true);
        this.renderer.setRenderTarget(null);
        this.renderer.clear();
        this.renderer.setViewport(0, 0, renderer_width, renderer_height);
        this.renderer.setScissor(0, 0, renderer_width, renderer_height);
        this.renderer.render(this.model.scenePlane, this.model.cameraPlane);
      } else {
        this.renderer.setClearColor(0xffffff);
        this.renderer.setScissorTest(false);
        this.renderer.clear();

        this.renderer.setClearColor(0xe0e0e0);
        this.renderer.setScissorTest(true);

        this.renderer.setViewport(0, 0, renderer_width, renderer_height);
        this.renderer.setScissor(0, 0, renderer_width, renderer_height);
        this.renderer.render(this.model.sceneImages, this.model.cameraImages);

        this.renderer.setRenderTarget(this.model.bufferTexture);
        this.renderer.clear();
        this.renderer.render(
          this.model.sceneImages,
          this.model.defaultcameraImages
        );

        this.renderer.setRenderTarget(null);

        const left = renderer_width * 0.8;
        const top = 0;
        const width = renderer_width * 0.2;
        const height = renderer_height * 0.2;
        this.renderer.setViewport(left, top, width, height);
        this.renderer.setScissor(left, top, width, height);
        this.renderer.render(this.model.scenePlane, this.model.cameraPlane);
      }
    }

    requestAnimationFrame(this.tick.bind(this));
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.model.cameraPlane.updateProjectionMatrix();
    this.model.cameraImages.updateProjectionMatrix();
  }

  keyup(event) {
    if (event.key == 'f') {
      this.freeze(!this.freezed);
    }

    if (event.key == 'Escape') {
      if (this.transformCtrl && this.transformCtrl.object)
        this.transformCtrl.detach();
    }

    if (event.key == 'u') {
      this.toggleUIVisibility();
    }
  }

  toggleUIVisibility() {
    if (this.ui) {
      this.rootHtml.parentElement.removeChild(this.ui);
      this.ui = null;
    } else {
      this.ui = this.createUI();
      this.rootHtml.parentElement.appendChild(this.ui);
    }
  }

  createUI() {
    const result = document.createElement('div');
    result.classList.add('ui');

    const toggleRenderedScene = document.createElement('div');
    toggleRenderedScene.classList.add('label_button');
    toggleRenderedScene.innerHTML = 'toggle rendered scene';
    result.appendChild(toggleRenderedScene);

    //callback
    const _this = this;
    toggleRenderedScene.onclick = function () {
      _this.setRenderingPlane(!_this.renderingPlane);
    };

    return result;
  }

  freeze(value) {
    this.freezed = value;
  }

  setRenderingPlane(value) {
    if (value) {
      this.transformCtrl.detach();
      this.transformCtrl.dispose();
      this.transformCtrl = null;

      this.orbitCtrl.dispose();
      this.orbitCtrl = null;
    } else {
      const orbitCtrl = new OrbitControls(
        this.model.cameraImages,
        this.rootHtml
      );
      this.orbitCtrl = orbitCtrl;

      this.transformCtrl = new TransformControls(
        this.model.cameraImages,
        this.rootHtml
      );
      this.transformCtrl.addEventListener('change', this.tick.bind(this));

      this.transformCtrl.addEventListener('dragging-changed', function (event) {
        orbitCtrl.enabled = !event.value;
      });

      this.model.sceneImages.add(this.transformCtrl);
    }

    this.renderingPlane = value;
  }

  onMouseDown(event) {
    if (this.renderingPlane || this.transformCtrl.object) return;

    //1. sets the mouse position with a coordinate system where the center
    //   of the screen is the origin
    const mouse = { x: 0, y: 0 };
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    //2. set the picking ray from the camera position and mouse coordinates
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, this.model.cameraImages);

    //3. compute intersections
    //TODO opti en enlevant la recursive et en selectionnant seulement les bon object3D

    const intersects = raycaster.intersectObject(this.model.imagesObject, true);

    if (intersects.length) {
      let minDist = Infinity;
      let p = null;

      intersects.forEach(function (i) {
        if (i.distance < minDist) {
          p = i.object;
          minDist = i.distance;
        }
      });

      this.transformCtrl.attach(p);
    }
  }

  init() {
    this.model.init();

    window.addEventListener('mousedown', this.onMouseDown.bind(this));

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
    this.imagesObject = null;

    this.screenPlane = null;

    this.cameraImages = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    this.cameraImages.position.set(0, 0, 10);
    this.cameraImages.lookAt(new THREE.Vector3());

    this.defaultcameraImages = this.cameraImages.clone();

    const width = 1;
    const height = 1;

    this.cameraPlane = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    );
    this.cameraPlane.position.set(0, 0, 10);
    this.cameraPlane.lookAt(new THREE.Vector3());

    this.bufferTexture = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
      {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.NearestFilter,
      }
    );
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
    this.scenePlane.scale.set(0.5, 0.5, 0.5);
    this.scenePlane.add(this.screenPlane);

    //scene images
    this.sceneImages.background = new THREE.Color(0xffffff);

    const dirLight = new THREE.DirectionalLight();
    dirLight.position.set(10, 10, 10);
    dirLight.lookAt(new THREE.Vector3());
    dirLight.updateWorldMatrix();
    this.sceneImages.add(dirLight);

    const directionalLightHelper = new THREE.DirectionalLightHelper(
      dirLight,
      50
    );
    // this.sceneImages.add(directionalLightHelper);

    const ambientLight = new THREE.AmbientLight('white', 0.5);
    this.sceneImages.add(ambientLight);

    const imagesObject = new THREE.Object3D();
    imagesObject.name = 'images_obj';
    this.imagesObject = imagesObject;
    this.sceneImages.add(imagesObject);

    //box

    const materialBox = new THREE.MeshPhongMaterial({
      color: 0xff0000, // red (can also use a CSS color string here)
    });
    const geometryBox = new THREE.BoxGeometry(1, 5, 1);
    const box = new THREE.Mesh(geometryBox, materialBox);
    imagesObject.add(box);
    box.rotateY(Math.PI / 4);
  }
}
