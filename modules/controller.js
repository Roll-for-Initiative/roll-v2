import * as THREE from "three";
import { RenderAction } from "./lib/renderable.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { DitherPassGen } from "./shaders/dither-pass.js";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { ModelLoader } from "./lib/model-loader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Brazier } from "./actors/brazier.js";
import { LightningEffect } from "./effects/lightning-effect.js";
import { RainEffect } from "./effects/rain-effect.js";
import { Wall } from "./actors/wall.js";
import { TextLoader } from "./lib/text-loader.js";
import { TextureLoader } from "./lib/texture-loader.js";
import { Raycaster } from "./lib/raycaster.js";
import { OutlinePass } from "three/addons/postprocessing/OutlinePass.js";
import { CardManager } from "./managers/card-manager.js";
import { Physics } from "./lib/physics.js";
import { CameraController } from "./lib/camera-controller.js";

export class Controller {
  constructor() {
    this._init();
    this.debug=true

    this._addEffects();
    this._createExampleWorld();
    this._addLights();
    this._addPostProcessing();
    this._startAnimationLoop();
    this.outlinePass.selectedObjects = [];

  }

  registerRenderAction(name, order, callback) {
    const renderAction = new RenderAction(name, order, callback);
    this.renderActions.push(renderAction);
    this.renderActions.sort((a, b) => {
      return a.order - b.order;
    });
  }

  async loadModel(path) {
    const model = await this.modelLoader.loadModel(path);
    return model;
  }

  async loadText(text) {
    return this.textLoader.createText(
      "./modules/RuneScape_UF_Regular.json",
      "0xffffff",
      text
    );
  }

  async loadTexture(text) {
    return this.textureLoader.load(text);
  }

  _init() {
    this.scene = new THREE.Scene();

 


    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.renderer.shadowMap.enabled = true;


    //here pass renderer
    this.cameraController = new CameraController(this, this.renderer.domElement)


    this.modelLoader = new ModelLoader();
    this.textLoader = new TextLoader(this);
    this.textureLoader = new TextureLoader(this);
    this.raycaster = new Raycaster(this);
    this.renderActions = [];
    this.interactions = [];
    this.selectedObjects = [];
    this.physics = new Physics(this)

    this.cardManager =  new CardManager(this)
    document.body.appendChild(this.renderer.domElement);
  }

  _onWindowResize() {
    this.cameraController.camera.aspect = window.innerWidth / window.innerHeight;
    this.cameraController.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  setRollView(){
    
      this.cameraController.setTargetPosition(new THREE.Vector3(0,20,-7),new THREE.Vector3(0,0,-7))
  }

  setCardView(){
    this.cameraController.setTargetPosition(new THREE.Vector3(-1, 4, -12),new THREE.Vector3(0, 6, 0))
    
  }

  _startAnimationLoop() {
    this.clock = new THREE.Clock();
    this.delta = 0;
    this.interval = 1 / 60;

    this.renderer.setAnimationLoop(this._update.bind(this));
  }

  _update() {
    this.delta += this.clock.getDelta();
    if (this.delta > this.interval) {
      this.renderActions.forEach((action) => action.render("add timestmap"));
      this.outlinePass.selectedObjects = this.selectedObjects;

      this.cameraController.controls.update();
      this.raycaster.update();
  
      if (this.debug) {
        this.renderer.render(this.scene, this.cameraController.camera);
      } else {
        this.composer.render();
      }
      this.delta = this.delta % this.interval;

    }
    this.cameraController.update()
    this.physics.update(this.delta)
  }
  _addLights() {
    const light = new THREE.AmbientLight(0xffffff);
    light.intensity = 2;

    const dl = new THREE.DirectionalLight(0xffffff, 0.5);
    dl.position.set(0, 1, 0); //default; light shining from top
    dl.castShadow = true; // default false

    this.scene.add(light);
    this.scene.add(dl);
  }

  _addEffects() {
    const lightning = new LightningEffect(this.scene, 2, 0);
    const rain = new RainEffect(this.scene, 2000);
    this.registerRenderAction("lightning", 9, () => lightning.update());
    this.registerRenderAction("rain", 10, () => rain.update());
  }

  async _createExampleWorld() {
    // const brazier1 = new Brazier(
    //   this,
    //   "brazierLeft",
    //   1,
    //   new THREE.Vector3(-7.5, 0, 0),
    //   new THREE.Vector3(1.5, 1.5, 1.5)
    // );

    // const brazier2 = new Brazier(
    //   this,
    //   "brazierLeft",
    //   1,
    //   new THREE.Vector3(7.5, 0, 0),
    //   new THREE.Vector3(1.5, 1.5, 1.5)
    // );

    const wall = new Wall(
      this,
      "wall",
      1,
      new THREE.Vector3(0, 0, 4),
      new THREE.Vector3(3, 3, 3)
    );
  
  }

  _addPostProcessing() {
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.cameraController.camera);
    this.composer.addPass(renderPass);

    const DitherPassInit = DitherPassGen({ THREE, Pass, FullScreenQuad });
    const ditherPass = new DitherPassInit({
      resolution: new THREE.Vector2(window.innerWidth, window.innerHeight),
      bias: 0.35,
    });

    this.outlinePass = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      this.scene,
      this.cameraController.camera
    );

    // -- parameter config
    this.outlinePass.edgeStrength = 2;
    this.outlinePass.edgeGlow = 1;
    this.outlinePass.edgeThickness = 1;
    this.outlinePass.pulsePeriod = 0;
    this.outlinePass.usePatternTexture = false; // patter texture for an object mesh
    this.outlinePass.visibleEdgeColor.set("#ffff00"); // set basic edge color
    this.outlinePass.hiddenEdgeColor.set("#ffff00"); // set edge color when it hidden by other objects
    this.composer.addPass(this.outlinePass);

    this.composer.addPass(ditherPass);
  }

  setSelectedObjects(obj) {
    this.selectedObjects = obj;
  }
}
