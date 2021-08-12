/** @format */

import * as THREE from 'three';

import './projectedcss.css';

export class ProjectedView {
  constructor() {
    this.model = new SceneModel();

    this.renderer = new THREE.WebGLRenderer();

    const width = 10;
    const height = 10;

    this.orthoCamera = new THREE.OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      1,
      1000
    );

    this.rootHtml = this.renderer.domElement;
  }

  html() {
    return this.rootHtml;
  }

  tick() {
    this.renderer.render(this.model.scene, this.orthoCamera);

    requestAnimationFrame(this.tick.bind(this));
  }

  resize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.orthoCamera.updateProjectionMatrix();
  }

  keyup(event) {
    if (event.key == 't') {
    }
  }

  init() {
    this.model.init();

    this.orthoCamera.position.set(0, 0, -5);
    this.orthoCamera.lookAt(new THREE.Vector3());
    this.model.scene.add(this.orthoCamera);

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
    this.scene = new THREE.Scene();
  }

  init() {
    //add sphere centered
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);
  }
}
