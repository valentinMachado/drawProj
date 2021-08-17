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

    this.selectedCustomQuad = null;
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

        const left = renderer_width * 0.7;
        const top = 0;
        const width = renderer_width * 0.3;
        const height = renderer_height * 0.3;
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
      if (this.transformCtrl && this.transformCtrl.object) {
        this.transformCtrl.detach();
      }

      if (this.selectedCustomQuad) {
        this.selectedCustomQuad.setSelected(false);
      }
    }

    if (event.key == 'e') {
      if (this.selectedCustomQuad != this.model.screenPlane) {
        this.setSelectedCustomQuad(this.model.screenPlane);
      } else {
        this.setSelectedCustomQuad(null);
      }
    }

    if (event.key == 't') {
      if (this.transformCtrl) {
        if (this.transformCtrl.mode == 'translate') {
          this.transformCtrl.setMode('rotate');
        } else if (this.transformCtrl.mode == 'rotate') {
          this.transformCtrl.setMode('scale');
        } else if (this.transformCtrl.mode == 'scale') {
          this.transformCtrl.setMode('translate');
        }
      }
    }

    if (event.key == 'i') {
      this.model.addNewImage();
    }

    if (event.key == 's') {
      this.setRenderingPlane(!this.renderingPlane);
    }

    if (event.key == 'n') {
      if (this.selectedCustomQuad) {
        this.selectedCustomQuad.nextPoint();
      }
    }

    if (event.key == 'Delete') {
      if (
        this.selectedCustomQuad != this.model.screenPlane &&
        this.selectedCustomQuad instanceof CustomQuad
      ) {
        if (this.transformCtrl.object == this.selectedCustomQuad.rootObject)
          this.transformCtrl.detach();

        // debugger
        this.selectedCustomQuad.rootObject.removeFromParent();
      }
    }

    const step = 0.01;

    if (event.key == 'ArrowUp') {
      if (this.selectedCustomQuad) {
        this.selectedCustomQuad.currentPoint.x += step;
        this.selectedCustomQuad.buildObject3D();
      }
    }

    if (event.key == 'ArrowDown') {
      if (this.selectedCustomQuad) {
        this.selectedCustomQuad.currentPoint.x -= step;
        this.selectedCustomQuad.buildObject3D();
      }
    }

    if (event.key == 'ArrowRight') {
      if (this.selectedCustomQuad) {
        this.selectedCustomQuad.currentPoint.y += step;
        this.selectedCustomQuad.buildObject3D();
      }
    }

    if (event.key == 'ArrowLeft') {
      if (this.selectedCustomQuad) {
        this.selectedCustomQuad.currentPoint.y -= step;
        this.selectedCustomQuad.buildObject3D();
      }
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

    const editQuadScreen = document.createElement('div');
    editQuadScreen.classList.add('label_button');
    editQuadScreen.innerHTML = 'Edit quad screen';
    result.appendChild(editQuadScreen);

    //callback
    const _this = this;
    editQuadScreen.onclick = function () {
      const sP = _this.model.screenPlane;

      if (!sP.selected) {
        _this.setSelectedCustomQuad(sP);
      } else {
        _this.setSelectedCustomQuad(null);
      }
    };

    return result;
  }

  setSelectedCustomQuad(quad) {
    if (this.selectedCustomQuad) this.selectedCustomQuad.setSelected(false);

    this.selectedCustomQuad = quad;
    if (quad) quad.setSelected(true);
  }

  freeze(value) {
    this.freezed = value;
  }

  setRenderingPlane(value) {
    if (value) {
      // if (this.selectedCustomQuad) this.selectedCustomQuad.setSelected(false);

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

      while (p.parent && !p.userData.customQuad) {
        p = p.parent;
      }

      this.transformCtrl.attach(p);
      this.setSelectedCustomQuad(p.userData.customQuad);
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

    const width = 2;
    const height = 2;

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
    this.initScenePlane();
    this.initSceneImages();
  }

  initScenePlane() {
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
        'gl_FragColor = texture2D( tDiffuse, vUv);' +
        // 'gl_FragColor = vec4(vUv ,0.0,1.0);' +
        // 'gl_FragColor = vec4(1,0,0,1);' +
        '}',
      vertexShader: vertexString,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.screenPlane = new CustomQuad(new THREE.Object3D(), materialScreen);

    this.scenePlane.add(this.screenPlane.rootObject);
  }

  addNewImage() {
    const url = window.prompt('url ?');

    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'Anonymous';
    const myTexture = textureLoader.load(url);

    const mat = new THREE.MeshBasicMaterial({
      map: myTexture,
    });
    const imageQuad = new CustomQuad(new THREE.Object3D(), mat);
    this.imagesObject.add(imageQuad.rootObject);
  }

  initSceneImages() {
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
  }
}

class CustomQuad {
  constructor(
    rootObject,
    material,
    topLeft = new THREE.Vector2(-1, 1),
    topRight = new THREE.Vector2(1, 1),
    bottomRight = new THREE.Vector2(1, -1),
    bottomLeft = new THREE.Vector2(-1, -1)
  ) {
    this.rootObject = rootObject;
    this.rootObject.name = 'root_CustomQuad';
    this.rootObject.userData.customQuad = this;

    this.rootSelected = new THREE.Object3D();
    this.rootQuad = new THREE.Object3D();

    this.rootObject.add(this.rootQuad);
    this.rootObject.add(this.rootSelected);

    this.material = material;

    this.topLeft = topLeft;
    this.topRight = topRight;
    this.bottomRight = bottomRight;
    this.bottomLeft = bottomLeft;

    this.selected = false;
    this.currentPoint = null;
    this.spherePoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.05, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xffff00 })
    );

    this.buildObject3D();
  }

  createHtmlController() {
    const result = document.createElement('div');
    return result;
  }

  setSelected(value) {
    if (value == this.selected) return;

    this.selected = value;

    if (this.selected) {
      this.setCurrentPoint(this.topLeft);
    }

    this.buildObject3D();
  }

  setCurrentPoint(p) {
    this.currentPoint = p;
    this.spherePoint.position.set(p.x, p.y, 0);
  }

  nextPoint() {
    if (this.currentPoint == this.topLeft) {
      this.setCurrentPoint(this.topRight);
    } else if (this.currentPoint == this.topRight) {
      this.setCurrentPoint(this.bottomRight);
    } else if (this.currentPoint == this.bottomRight) {
      this.setCurrentPoint(this.bottomLeft);
    } else if (this.currentPoint == this.bottomLeft) {
      this.setCurrentPoint(this.topLeft);
    }
  }

  buildLine(start, end) {
    const dirCst = 10;
    const dir = end.clone().sub(start).normalize();

    //build line
    // geometry
    const geometry = new THREE.BufferGeometry();

    // attributes
    const positions = new Float32Array(2 * 3); // 3 vertices per point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    positions[0] = start.x - dirCst * dir.x;
    positions[1] = start.y - dirCst * dir.y;
    positions[2] = 0;

    positions[3] = end.x + dirCst * dir.x;
    positions[4] = end.y + dirCst * dir.y;
    positions[5] = 0;

    // material
    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });

    // line
    const line = new THREE.Line(geometry, material);

    return line;
  }

  buildObject3D() {
    //lines
    this.rootSelected.children.length = 0;
    if (this.selected) {
      this.rootSelected.add(this.buildLine(this.topLeft, this.topRight));
      this.rootSelected.add(this.buildLine(this.topRight, this.bottomRight));
      this.rootSelected.add(this.buildLine(this.bottomRight, this.bottomLeft));
      this.rootSelected.add(this.buildLine(this.bottomLeft, this.topLeft));

      //add sphere current point
      this.setCurrentPoint(this.currentPoint); //force sphere position
      this.rootSelected.add(this.spherePoint);
    }

    this.rootQuad.children.length = 0;

    const shape = new THREE.Shape([
      this.topLeft,
      this.topRight,
      this.bottomRight,
      this.bottomLeft,
    ]);

    const geometry = new THREE.ShapeGeometry(shape);

    //compute uv
    const uv = geometry.attributes.uv.array;
    uv[0] = 0;
    uv[1] = 1;
    uv[2] = 1;
    uv[3] = 1;
    uv[4] = 1;
    uv[5] = 0;
    uv[6] = 0;
    uv[7] = 0;

    const mesh = new THREE.Mesh(geometry, this.material);
    this.rootQuad.add(mesh);
  }
}
