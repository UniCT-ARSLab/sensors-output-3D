import {
    BoxGeometry,
    Color,
    ColorRepresentation,
    DirectionalLight,
    DoubleSide,
    Group,
    HemisphereLight,
    Material,
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
import { Websocket, WebsocketBuilder, WebsocketEvent } from 'websocket-ts';
import { LidarLines, LidarPoint, SCANDATA_MOCK, SocketMessageType } from './data.model';

const ws = new WebsocketBuilder('ws://localhost:8765').build();

const enum ROBOT {
    PICCOLO = 'piccolo',
    GRANDE = 'grande',
}

const enum COLOR {
    GREEN = 0x00ff00,
    RED = 0xff0000,
    YELLOW = 0xffff00,
}

// ROBOT dimensions 300x300x350 mediamente (h x w x l)
const ROBOT_HEIGHT = 300;
const ROBOT_WIDTH = 300;
const ROBOT_LENGTH = 350;

const LINEWIDTH = 0.05;
let angle = 0;
const lidarLines: LidarLines[] = [];

let mesh_back_tof1: Mesh;
let mesh_back_tof2: Mesh;
let mesh_front_tof1: Mesh;
let mesh_front_tof2: Mesh;

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

function getLineMesh(length: number, color: ColorRepresentation): Mesh {
    const material = new MeshStandardMaterial({ color });
    const geometry = new BoxGeometry(LINEWIDTH, LINEWIDTH, length);
    const mesh = new Mesh(geometry, material);
    return mesh;
}

function drawLineLidar(scene: Scene, lidarPoints: LidarPoint[], color = COLOR.YELLOW): void {
    for (const lidarPoint of lidarPoints) {
        const mesh = getLineMesh(lidarPoint.length, color);
        mesh.position.set(0, 5, 0 + lidarPoint.length / 2);

        // hack to rotate properly the object
        const group = new Group();
        group.add(mesh);
        group.rotation.y = degToRad(lidarPoint.angle);

        lidarLines.push({ group, mesh });

        scene.add(group);
    }
}

function drawBackToF(scene: Scene, tof1: number, tof2: number): void {
    if (mesh_back_tof1) {
        scene.remove(mesh_back_tof1);
    }
    mesh_back_tof1 = getLineMesh(tof1, COLOR.RED);
    mesh_back_tof1.position.set(0.75, 0, 1.7 + tof1 / 2);
    scene.add(mesh_back_tof1);

    if (mesh_back_tof2) {
        scene.remove(mesh_back_tof2);
    }
    mesh_back_tof2 = getLineMesh(tof2, COLOR.RED);
    mesh_back_tof2.position.set(-1.1, 0, 1.7 + tof2 / 2);
    scene.add(mesh_back_tof2);
}

function drawFrontToF(scene: Scene, tof1: number, tof2: number): void {
    if (mesh_front_tof1) {
        scene.remove(mesh_front_tof1);
    }
    mesh_front_tof1 = getLineMesh(tof1, COLOR.GREEN);
    mesh_front_tof1.position.set(0.75, 0, -1 - tof1 / 2);
    scene.add(mesh_front_tof1);

    if (mesh_front_tof2) {
        scene.remove(mesh_front_tof2);
    }
    mesh_front_tof2 = getLineMesh(tof2, COLOR.GREEN);
    mesh_front_tof2.position.set(-1.1, 0, -1 - tof2 / 2);
    scene.add(mesh_front_tof2);
}

function emptyLidar(scene: Scene): void {
    for (const l of lidarLines) {
        scene.remove(l.group);
        l.mesh.geometry.dispose();
        (l.mesh.material as Material).dispose();
    }
    lidarLines.length = 0;
}

function drawLidarData(scene: Scene, scandata: number[]): void {
    emptyLidar(scene);

    const lidarPoints: LidarPoint[] = [];

    const TOT_DEADZONE = 1024 - 725 + 44;

    const POINT_ANGLE = 360 / 1024;
    const LEFT_START_ANGLE = -(TOT_DEADZONE / 2) * POINT_ANGLE;
    angle = LEFT_START_ANGLE;
    for (const i of scandata) {
        const length = i / 1000;

        lidarPoints.push({ length, angle });

        angle -= POINT_ANGLE;
    }
    angle = LEFT_START_ANGLE;

    drawLineLidar(scene, lidarPoints);

    // draw dead zone borders
    const deadZonePoints = [
        { length: 5, angle: angle + POINT_ANGLE * 2 },
        { length: 5, angle: angle + POINT_ANGLE * TOT_DEADZONE },
    ];
    drawLineLidar(scene, deadZonePoints, COLOR.RED);
}

export function handleMessage(message: MessageEvent, scene: Scene): void {
    const m = JSON.parse(message.data);
    switch (m.type) {
        case SocketMessageType.LIDAR:
            drawLidarData(scene, m.data);
            break;
        default:
            break;
    }
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

    initMap(scene);
    addLight(scene);
    initRobot(scene, ROBOT.GRANDE);

    drawBackToF(scene, 7, 5);
    drawFrontToF(scene, 4, 3);

    drawLidarData(scene, SCANDATA_MOCK);

    ws.addEventListener(WebsocketEvent.message, (_: Websocket, message: MessageEvent) => {
        handleMessage(message, scene);
    });

    // simulate dynamic data
    // setTimeout(() => {
    //     drawBackToF(scene, 2, 3);
    //     drawFrontToF(scene, 8, 7);
    // }, 5_000);

    // setTimeout(() => {
    //     drawLidarData(scene, SCANDATA_MOCK_2);
    // }, 5_000);

    // setTimeout(() => {
    //     drawLidarData(scene, SCANDATA_MOCK);
    // }, 10_000);

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
