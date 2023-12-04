import {
    BoxGeometry,
    Color,
    DirectionalLight,
    DoubleSide,
    Group,
    HemisphereLight,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
    NearestFilter,
    PerspectiveCamera,
    PlaneGeometry,
    RepeatWrapping,
    SRGBColorSpace,
    Scene,
    TextureLoader,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { degToRad } from 'three/src/math/MathUtils';
import { SCANDATA_MOCK } from './data.model';

const enum ROBOT {
    PICCOLO = 'piccolo',
    GRANDE = 'grande',
}

// ROBOT dimensions 300x300x350 mediamente (h x w x l)
const ROBOT_HEIGHT = 300;
const ROBOT_WIDTH = 300;
const ROBOT_LENGTH = 350;

const LINEWIDTH = 0.05;
let angle = 180; // start from 180 to be in the front of the robot

function initMap(scene: Scene): void {
    const loader = new TextureLoader();
    const texture = loader.load('assets/2024.png');
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;

    // 30 units = 3000 mm, 20 units = 2000 mm
    const planeGeo = new PlaneGeometry(30, 20);

    const planeMat = new MeshPhongMaterial({
        map: texture,
        side: DoubleSide,
    });
    const mesh = new Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    scene.add(mesh);
}

function addLight(scene: Scene): void {
    {
        const skyColor = 0xb1e1ff; // light blue
        const groundColor = 0xb97a20; // brownish orange
        const intensity = 3;
        const light = new HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);
    }

    {
        const color = 0xffffff;
        const intensity = 3;
        const light = new DirectionalLight(color, intensity);
        light.position.set(5, 10, 2);
        scene.add(light);
        scene.add(light.target);
    }
}

function initRobot(scene: Scene, type: ROBOT = ROBOT.GRANDE): void {
    const mtlLoader = new MTLLoader();
    mtlLoader.load(`assets/robot-${type}.mtl`, (mtl) => {
        mtl.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(mtl);
        objLoader.load(`assets/robot-${type}.obj`, (obj) => {
            // from the origin dimensions set them /100
            // obj.scale.set(0.01, 0.01, 0.01);
            obj.scale.setScalar(0.01);

            if (type == ROBOT.GRANDE) {
                obj.rotateX(degToRad(90));
                obj.position.y = 3.3;
            }
            scene.add(obj);
        });
    });
}

function drawLineLidar(scene: Scene, length: number, anglePoint: number): void {
    const material = new MeshStandardMaterial({ color: 0xffff00 });

    const geometry = new BoxGeometry(LINEWIDTH, LINEWIDTH, length);
    const mesh = new Mesh(geometry, material);

    // hack to rotate properly the object
    const group = new Group();
    group.add(mesh);
    mesh.position.set(0, 0, 0);
    group.rotation.y = degToRad(angle);

    mesh.position.set(0, 5, 0 + length / 2);

    scene.add(group);

    angle += anglePoint;
}

function drawBackToF(scene: Scene, tof1: number, tof2: number): void {
    const material = new MeshStandardMaterial({ color: 0xff0000 });
    const mesh_tof1 = new Mesh(new BoxGeometry(LINEWIDTH, LINEWIDTH, tof1), material);
    mesh_tof1.position.set(0.75, 0, 1.7 + tof1 / 2);
    scene.add(mesh_tof1);

    const mesh_tof2 = new Mesh(new BoxGeometry(LINEWIDTH, LINEWIDTH, tof2), material);
    mesh_tof2.position.set(-1.1, 0, 1.7 + tof2 / 2);
    scene.add(mesh_tof2);
}

function drawFrontToF(scene: Scene, tof1: number, tof2: number): void {
    const material = new MeshStandardMaterial({ color: 0x00ff00 });
    const mesh_tof1 = new Mesh(new BoxGeometry(LINEWIDTH, LINEWIDTH, tof1), material);
    mesh_tof1.position.set(0.75, 0, -1 - tof1 / 2);
    scene.add(mesh_tof1);

    const mesh_tof2 = new Mesh(new BoxGeometry(LINEWIDTH, LINEWIDTH, tof2), material);
    mesh_tof2.position.set(-1.1, 0, -1 - tof2 / 2);
    scene.add(mesh_tof2);
}

function drawLidarData(scene: Scene, scandata: number[]): void {
    const POINT_ANGLE = 360 / scandata.length;
    for (let i = 0; i < scandata.length; i++) {
        drawLineLidar(scene, scandata[i] / 1000, POINT_ANGLE);
    }
    angle = 180;
}

function main(): void {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(1500, 1000);
    const canvas = document.body.appendChild(renderer.domElement);

    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new Scene();
    scene.background = new Color('black');

    // const axesHelper = new AxesHelper(30);
    // scene.add(axesHelper);

    initMap(scene);
    addLight(scene);
    initRobot(scene, ROBOT.GRANDE);

    drawBackToF(scene, 7, 5);
    drawFrontToF(scene, 4, 3);

    drawLidarData(scene, SCANDATA_MOCK);

    function resizeRendererToDisplaySize(renderer: WebGLRenderer): boolean {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }

        return needResize;
    }

    function render(): void {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

main();
