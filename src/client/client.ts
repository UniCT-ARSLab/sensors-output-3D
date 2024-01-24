import { Color, Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { degToRad } from 'three/src/math/MathUtils';
import { Websocket, WebsocketBuilder, WebsocketEvent } from 'websocket-ts';
import { LIDAR_SCANDATA_MOCK } from './data';
import {
    addLight,
    disposeMesh,
    drawToF,
    getLineMesh,
    initMap,
    initRobot,
    resizeRendererToDisplaySize,
} from './helper';
import { COLOR, LidarLines, LidarPoint, ROBOT, SocketMessageType, TOF } from './model';

const ws = new WebsocketBuilder('ws://localhost:8765').build();

let angle = 0;
const lidarLines: LidarLines[] = [];

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

function emptyLidar(scene: Scene): void {
    for (const l of lidarLines) {
        scene.remove(l.group);
        disposeMesh(l.mesh);
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

    drawToF(scene, TOF.back_1, 7, COLOR.RED);
    drawToF(scene, TOF.back_2, 5, COLOR.RED);
    drawToF(scene, TOF.back_3, 7, COLOR.RED);
    drawToF(scene, TOF.back_4, 5, COLOR.RED);

    drawToF(scene, TOF.front_1, 4, COLOR.GREEN);
    drawToF(scene, TOF.front_2, 3, COLOR.GREEN);
    drawToF(scene, TOF.front_3, 3, COLOR.GREEN);
    drawToF(scene, TOF.front_4, 3, COLOR.GREEN);

    drawLidarData(scene, LIDAR_SCANDATA_MOCK);

    ws.addEventListener(WebsocketEvent.message, (_: Websocket, message: MessageEvent) => {
        handleMessage(message, scene);
    });

    // simulate dynamic data
    // setTimeout(() => {
    //     drawBackToF(scene, 2, 3);
    //     drawFrontToF(scene, 8, 7);
    // }, 5_000);

    // setTimeout(() => {
    //     drawLidarData(scene, LIDAR_SCANDATA_MOCK_2);
    // }, 5_000);

    // setTimeout(() => {
    //     drawLidarData(scene, LIDAR_SCANDATA_MOCK);
    // }, 10_000);

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
