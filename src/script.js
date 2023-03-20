import './style.css';
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';

gsap.registerPlugin(ScrollTrigger);

const container_load = document.getElementById('container_load');
const progressBar = document.getElementById(
  'loader-progress-progress'
);
const progresspercent = document.getElementById('progresspercent');
const INITIAL_MTL = new THREE.MeshBasicMaterial({
  color: 0xffff00,
  transparent: true,
  opacity: 0,
  visible: true,
});
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const color = new THREE.Color();
const colori = new THREE.Color().setHex(0xffffff);

let container;
let stats;
var maxDPR = 1.2;
var dpr = Math.min(maxDPR, window.devicePixelRatio);
let nEnd1 = 0,
  nEnd2 = 0,
  nEnd3 = 0,
  nMax1,
  nMax2,
  nMax3,
  nStep = 90;
let FOV;
let FAR;
let NEAR = 0.01;
var meshc, meshc2, meshc3;
if (window.innerWidth <= 768) {
  FOV = 100;
  FAR = 100;
  // 769px - 1080px screen width camera
} else if (window.innerWidth >= 769 && window.innerWidth <= 1080) {
  FOV = 75;
  FAR = 100;
  // > 1080px screen width res camera
} else {
  FOV = 75;
  FAR = 100;
}

let mixer,
  mixer2,
  clock,
  model1,
  model2,
  model3,
  model4,
  camera,
  scene,
  renderer;
let boxes;
let lastTime = 0;

const moveQ = new THREE.Quaternion(0.5, 0.5, 0.5, 0.0).normalize();
const tmpQ = new THREE.Quaternion();
const tmpM = new THREE.Matrix4();
const currentM = new THREE.Matrix4();

let mouseX = 0;
let mouseY = 0;

let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;

const main = new THREE.Group();
const mod1 = new THREE.Group();
const mod2 = new THREE.Group();
const mod3 = new THREE.Group();
const mod4 = new THREE.Group();
const mod5 = new THREE.Group();

const camtext = document.getElementById('camtext');
const iconscroll = document.getElementById('icon-scroll');

const manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
  // console.log( 'Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onLoad = function () {
  let tls = gsap.timeline({});
  container_load.style.opacity = 0;
  tls
    .to(mod1.position, { duration: 2, z: 0, ease: 'power3.out' })
    .to(
      mod1.rotation,
      { duration: 2, y: 0, ease: 'power3.Inout' },
      '-=1.5'
    );
  console.log('Loading complete!');
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
  progressBar.style.width = (itemsLoaded / itemsTotal) * 100 + '%';
  progresspercent.innerHTML =
    Math.floor((itemsLoaded / itemsTotal) * 100) + '%';
  progresspercent.style.left =
    (itemsLoaded / itemsTotal) * 100 - 1 + '%';
  //  console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
};

manager.onError = function (url) {
  console.log('There was an error loading ' + url);
};
init();
animate();

function init() {
  clock = new THREE.Clock();
  container = document.getElementById('container');
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    FOV,
    window.innerWidth / window.innerHeight,
    NEAR,
    FAR
  );
  camera.position.set(0, 0, 1);
  camera.lookAt(scene.position);
  scene.add(camera);

  scene.fog = new THREE.Fog(0x030303, 1, 3);

  const dirlight = new THREE.DirectionalLight(0x404040, 2.5);
  dirlight.position.set(0.2, 0.5, 0.6);
  scene.add(dirlight);

  new RGBELoader(manager)
    .setPath('./')
    .load('studio_small.hdr', function (texture) {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      scene.environment = texture;
      render();
    });
  scene.background = new THREE.Color(0x030303);
  // model

  const loader = new GLTFLoader(manager).setPath('./');
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('draco/gltf/');
  dracoLoader.setDecoderConfig({ type: 'js' });
  loader.setDRACOLoader(dracoLoader);

  loader.load('clapper2.glb', function (gltf) {
    model1 = gltf.scene;
    model1.scale.set(0.05, 0.05, 0.05);
    model1.getObjectByName('clap').rotation.y = -0.3;
    mod1.rotation.set(0, -1.5, 0);
    mod1.position.set(0, -0.1, -3);
    mod1.add(model1);
    main.add(mod1);
    scene.add(main);
    render();

    gsap.to(model1.getObjectByName('clap').rotation, {
      scrollTrigger: {
        trigger: '#start',
        start: 'top top',
        end: '+=20%',
        pin: true,
        markers: false,
        toggleActions: 'play none none reverse',
        scrub: 0.2,
      },
      y: 0.01,
      ease: 'none',
    });
    gsap.to(iconscroll, {
      scrollTrigger: {
        trigger: '#start',
        start: 'top top',
        end: '+=20%',
        pin: true,
        markers: false,
        toggleActions: 'play none none reverse',
        scrub: 0.2,
      },
      opacity: 0,
      ease: 'none',
    });
  });

  loader.load('projector_compressed2.glb', function (gltf) {
    model2 = gltf.scene;
    model2.scale.set(1, 1, 1);
    model2.getObjectByName('cone1').material = INITIAL_MTL;
    model2.getObjectByName('cone1').renderOrder = 2;
    mixer = new THREE.AnimationMixer(model2);
    var action = mixer.clipAction(gltf.animations[0]);
    action.play();
    mod2.position.set(-0.5, -4, 0);
    mod2.rotation.set(0, 2, 0);
    mod2.add(model2);
    main.add(mod2);
    model2.getObjectByName('cone1').castShadow = false;
    model2.getObjectByName('cone1').receiveShadow = false;
    render();
  });

  loader.load('scroll.glb', function (gltf) {
    model3 = gltf.scene;
    model3.scale.set(0.25, 0.25, 0.25);
    mixer2 = new THREE.AnimationMixer(model3);
    const action2 = mixer2.clipAction(gltf.animations[0]);
    createAnimation(mixer2, action2, gltf.animations[0]);
    action2.play();
    mod3.position.set(0, -7, 0);
    mod3.rotation.set(1, -1.57, 0);
    mod3.add(model3);
    main.add(mod3);

    model3.traverse(function (object3) {
      if (object3.isMesh) {
        object3.material.envMapIntensity = 0;
      }
    });
    function createAnimation(mixer2, action2, clip) {
      let proxy = {
        get time() {
          return mixer2.time;
        },
        set time(value) {
          action2.paused = false;
          mixer2.setTime(value);
          action2.paused = true;
        },
      };
      let scrollingTL = gsap
        .timeline({
          scrollTrigger: {
            // markers: true,
            trigger: '#forth',
            start: 'center top',
            end: '+=120%',
            pin: true,
            scrub: 0.2,
            onUpdate: function () {},
          },
        })
        .to(proxy, {
          time: clip.duration,
        });
    }
    render();
  });

  const bumpmap = new THREE.TextureLoader(manager).load('bump.png');
  bumpmap.flipY = false;
  loader.load('earth.glb', function (gltf) {
    model4 = gltf.scene;
    const clouds = model4.getObjectByName('clouds');
    const earth = model4.getObjectByName('earth');
    clouds.renderOrder = 2;
    earth.material.envMapIntensity = 0.2;
    earth.material.bumpMap = bumpmap;
    (earth.material.roughness = 0.7),
      (earth.material.bumpScale = 0.05);
    mod4.position.set(0, -5, 0);
    mod4.rotation.set(0.1, 6, -0.3);
    mod4.scale.set(0.55, 0.55, 0.55);
    mod5.add(clouds);
    mod4.add(earth, mod5);
    main.add(mod4);
    render();
  });

  const color1 = new THREE.Color(0xff7d00);
  let mesh1 = new THREE.Mesh(
    new THREE.SphereBufferGeometry(0.015, 20.2),
    new THREE.MeshPhongMaterial({ color: color1 })
  );
  let mesh2 = mesh1.clone();
  let mesh3 = mesh1.clone();
  let mesh4 = mesh1.clone();

  function convertcoord(lat, lgn) {
    var radius = 0.998;
    var height = 0;
    var phi = (lat * Math.PI) / 180;
    var theta = ((lgn - 180) * Math.PI) / 180;

    let x = -(radius + height) * Math.cos(phi) * Math.cos(theta);
    let y = (radius + height) * Math.sin(phi);
    let z = (radius + height) * Math.cos(phi) * Math.sin(theta);
    return { x, y, z };
  }

  let city1 = {
    lgn: -73.561668,
    lat: 45.508888,
  };
  let city2 = {
    lgn: -99.133209,
    lat: 19.432608,
  };
  let city3 = {
    lgn: -118.243683,
    lat: 34.052235,
  };
  let city4 = {
    lgn: -87.55442,
    lat: 41.739685,
  };

  let pos1 = convertcoord(city1.lat, city1.lgn);
  let pos2 = convertcoord(city2.lat, city2.lgn);
  let pos3 = convertcoord(city3.lat, city3.lgn);
  let pos4 = convertcoord(city4.lat, city4.lgn);
  mesh1.position.set(pos1.x, pos1.y, pos1.z);
  mesh2.position.set(pos2.x, pos2.y, pos2.z);
  mesh3.position.set(pos3.x, pos3.y, pos3.z);
  mesh4.position.set(pos4.x, pos4.y, pos4.z);
  mod4.add(mesh1, mesh2, mesh3, mesh4);

  let v1 = new THREE.Vector3(pos1.x, pos1.y, pos1.z);
  let v2 = new THREE.Vector3(pos2.x, pos2.y, pos2.z);
  var points = [];
  for (let i = 0; i <= 20; i++) {
    let p = new THREE.Vector3().lerpVectors(v1, v2, i / 20);
    p.normalize();
    p.multiplyScalar(1 + 0.07 * Math.sin((Math.PI * i) / 20));
    points.push(p);
  }

  let v1a = new THREE.Vector3(pos1.x, pos1.y, pos1.z);
  let v2a = new THREE.Vector3(pos3.x, pos3.y, pos3.z);
  let pointsa = [];
  for (let i = 0; i <= 20; i++) {
    let pa = new THREE.Vector3().lerpVectors(v1a, v2a, i / 20);
    pa.normalize();
    pa.multiplyScalar(1 + 0.07 * Math.sin((Math.PI * i) / 20));
    pointsa.push(pa);
  }

  let v1b = new THREE.Vector3(pos1.x, pos1.y, pos1.z);
  let v2b = new THREE.Vector3(pos4.x, pos4.y, pos4.z);
  let pointsb = [];
  for (let i = 0; i <= 20; i++) {
    let pb = new THREE.Vector3().lerpVectors(v1b, v2b, i / 20);
    pb.normalize();
    pb.multiplyScalar(1 + 0.07 * Math.sin((Math.PI * i) / 20));
    pointsb.push(pb);
  }

  var path = new THREE.CatmullRomCurve3(points);
  let patha = new THREE.CatmullRomCurve3(pointsa);
  let pathb = new THREE.CatmullRomCurve3(pointsb);
  let material = new THREE.MeshLambertMaterial({
    color: 0x0000ff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
  });

  var geometry = new THREE.TubeBufferGeometry(
    path,
    512,
    0.0025,
    8,
    false
  );
  meshc = new THREE.Mesh(geometry, material);
  nMax1 = 50000;

  const geometrya = new THREE.TubeBufferGeometry(
    patha,
    512,
    0.0025,
    8,
    false
  );
  meshc2 = new THREE.Mesh(geometrya, material);
  nMax2 = 50000;

  const geometryb = new THREE.TubeBufferGeometry(
    pathb,
    512,
    0.0025,
    8,
    false
  );
  meshc3 = new THREE.Mesh(geometryb, material);
  mod4.add(meshc, meshc2, meshc3);
  nMax3 = 50000;

  // create the particle variables
  const matrix = new THREE.Matrix4();
  const material2 = new THREE.MeshStandardMaterial({
    color: colori,
    roughness: 0,
    metalness: 1,
    envMap: scene.environment,
    flatShading: true,
  });
  const offset = new THREE.Vector3();
  const orientation = new THREE.Quaternion();
  const scale = new THREE.Vector3(0.4, 0.4, 0.4);
  let x, y, z, w;

  const geometryBox = new THREE.TetrahedronBufferGeometry(0.04, 2);
  boxes = new THREE.InstancedMesh(geometryBox, material2, 10000);
  scene.add(boxes);

  for (let i = 0; i < boxes.count; i++) {
    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;

    offset.set(x, y, z).normalize();
    offset.multiplyScalar(0.8); // move out at least 5 units from center in current direction
    offset.set(x + offset.x, y + offset.y, z + offset.z);

    // orientations

    x = Math.random() * 2 - 1;
    y = Math.random() * 2 - 1;
    z = Math.random() * 2 - 1;
    w = Math.random() * 2 - 1;

    orientation.set(x, y, z, w).normalize();

    matrix.compose(offset, orientation, scale);

    boxes.setMatrixAt(i, matrix);
    boxes.setColorAt(i, color);
    i++;
  }
  scene.add(boxes);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(dpr);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.LinearToneMapping;
  renderer.setClearColor(0xffffff, 0);
  renderer.toneMappingExposure = 1;
  renderer.physicallyCorrectLights = false;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.powerPreference = 'high-performance';
  container.appendChild(renderer.domElement);

  stats = new Stats();
  container.appendChild(stats.dom);

  document.addEventListener('mousemove', onDocumentMouseMove);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('resize', onWindowResize);
} // init end

function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  windowHalfX = width / 2;
  windowHalfY = height / 2;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

function onDocumentMouseMove(event) {
  mouseX = (event.clientX - windowHalfX) / 3000;
  mouseY = (event.clientY - windowHalfY) / 3000;
}
function onPointerMove(event) {
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

//

function animate() {
  requestAnimationFrame(animate);
  if (mixer) mixer.update(clock.getDelta());
  stats.update();
  INITIAL_MTL.opacity = Math.random() * 0.15;
  INITIAL_MTL.needsUpdate;
  mod5.rotation.y += 0.0001;

  render();
}

function render() {
  main.rotation.x += (mouseY - main.rotation.x) * 0.01;
  main.rotation.y += (mouseX - main.rotation.y) * 0.01;
  camera.updateMatrixWorld();

  raycaster.setFromCamera(pointer, camera);
  const intersection = raycaster.intersectObject(boxes);
  if (intersection.length > 0) {
    const instanceId = intersection[0].instanceId;

    boxes.getColorAt(instanceId, color);

    if (color.equals(colori)) {
      boxes.setColorAt(
        instanceId,
        color.setHex(Math.random() * 0xffffff)
      );

      boxes.instanceColor.needsUpdate = true;
    }
  }

  const frustum = new THREE.Frustum();
  const matrix = new THREE.Matrix4().multiplyMatrices(
    camera.projectionMatrix,
    camera.matrixWorldInverse
  );

  frustum.setFromProjectionMatrix(matrix);
  if (frustum.containsPoint(mod4.position)) {
    nEnd1 = (nEnd1 + nStep) % nMax1;
    meshc.geometry.setDrawRange(0, nEnd1);
    nEnd2 = (nEnd2 + nStep) % nMax2;
    meshc2.geometry.setDrawRange(0, nEnd2);
    nEnd3 = (nEnd3 + nStep) % nMax3;
    meshc3.geometry.setDrawRange(0, nEnd3);
  }

  const time = performance.now();
  boxes.rotation.y = time * 0.00005;
  const delta = (time - lastTime) / 5000;
  tmpQ
    .set(moveQ.x * delta, moveQ.y * delta, moveQ.z * delta, 1)
    .normalize();
  tmpM.makeRotationFromQuaternion(tmpQ);

  for (let i = 0, il = boxes.count; i < il; i++) {
    boxes.getMatrixAt(i, currentM);
    currentM.multiply(tmpM);
    boxes.setMatrixAt(i, currentM);
  }

  boxes.instanceMatrix.needsUpdate = true;

  lastTime = time;

  renderer.render(scene, camera);
}

let tl = gsap.timeline({
  scrollTrigger: {
    trigger: '#scroller',
    endTrigger: '#scroller',
    pin: false,
    start: 'top top',
    end: 'bottom top',
    scrub: 2,
    preventOverlaps: true,
    toggleActions: 'play none none reverse',
    //   markers: true,
    snap: {
      snapTo: 'labels',
      duration: { min: 1, max: 2 },
      directional: true,
      delay: 0.1,
      ease: 'power3.inOut',
    },
  },
});

tl.addLabel('1')
  .from(mod1.position, { y: -0.1, ease: 'power3.inOut' })
  .to(mod1.position, { y: 4, ease: 'power3.inOut' })
  .from(mod2.position, { y: -4, ease: 'power3.inOut' })
  .addLabel('2')
  .to(mod2.position, { y: -0.1, ease: 'power3.inOut' })
  .to(mod2.position, { y: 4, ease: 'power3.inOut' })
  .from(mod4.position, { y: -4, ease: 'power3.inOut' })
  .to(mod4.rotation, { y: -0.5, ease: 'power3.inOut' })
  .addLabel('3')
  .to(mod4.position, { y: 0, ease: 'power3.inOut' })
  .to(mod4.position, { y: 4, ease: 'power3.inOut' })
  .from(mod3.position, { y: -4, ease: 'power3.inOut' })
  .addLabel('4')
  .to(mod3.position, { y: -0.1, ease: 'power3.inOut' });

gsap.set(camtext, { x: -500, opacity: 0 });
gsap.to(camtext, {
  scrollTrigger: {
    trigger: '#second',
    start: 'top top',
    end: '+=20%',
    toggleActions: 'play none none reverse',
    scrub: 0.2,
  },
  duration: 3,
  x: 0,
  opacity: 1,
  ease: 'power3.inOut',
});
gsap.set(camtext, { x: 0, opacity: 1 });
gsap.to(camtext, {
  scrollTrigger: {
    trigger: '#third',
    start: 'top top',
    end: '+=20%',
    toggleActions: 'play none none reverse',
    scrub: 0.2,
  },
  duration: 3,
  x: -500,
  opacity: 0,
  ease: 'power3.inOut',
});
gsap.set(camtext, { x: -500, opacity: 0 });
