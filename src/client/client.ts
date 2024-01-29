import {
    BufferGeometry,
    Color,
    Group,
    Line,
    LineBasicMaterial,
    Path,
    PerspectiveCamera,
    Scene,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { degToRad } from 'three/src/math/MathUtils';
import { Websocket, WebsocketBuilder, WebsocketEvent } from 'websocket-ts';
import {
    LEFT_START_ANGLE,
    LIDAR_SCANDATA_MOCK,
    LIDAR_TOT_DEADZONE,
    POINT_ANGLE,
    ROBOT_LENGTH,
} from './data';
import {
    addLight,
    disposeMesh,
    getLineMesh,
    getToF,
    initMap,
    initRobot,
    resizeRendererToDisplaySize,
} from './helper';
import { COLOR, LidarLines, LidarPoint, ROBOT, SocketMessageType, TOF } from './model';
import { PLATFORM_HEIGHT, PLATFORM_WIDTH } from './settings';

const ws = new WebsocketBuilder('ws://localhost:8765').build();

const lidarLines: LidarLines[] = [];
const robotGroup = new Group();

function drawLineLidar(
    robotGrp: Group,
    lidarPoints: LidarPoint[],
    color = COLOR.YELLOW,
    saveLine = true
): void {
    for (const lidarPoint of lidarPoints) {
        const mesh = getLineMesh(lidarPoint.length, color);
        mesh.position.set(0, 5, 0 + lidarPoint.length / 2);

        // hack to rotate properly the object
        const group = new Group();
        group.add(mesh);
        group.rotation.y = degToRad(lidarPoint.angle);

        if (saveLine) {
            lidarLines.push({ group, mesh });
        }

        robotGrp.add(group);
    }
}

function emptyLidar(robotGrp: Group): void {
    for (const l of lidarLines) {
        robotGrp.remove(l.group);
        disposeMesh(l.mesh);
    }
    lidarLines.length = 0;
}

function drawLidarData(robotGrp: Group, scandata: number[]): void {
    emptyLidar(robotGrp);
    let angle = LEFT_START_ANGLE;
    const lidarPoints: LidarPoint[] = scandata.map((s) => {
        const length = s / 1000;
        angle -= POINT_ANGLE;
        return { length, angle };
    });
    angle = LEFT_START_ANGLE;
    drawLineLidar(robotGrp, lidarPoints);
}

function drawLidarBorder(robotGrp: Group): void {
    const geometry = new BufferGeometry().setFromPoints(
        new Path().absarc(0, 0, 5, 0, Math.PI * 2).getSpacedPoints(50)
    );
    const material = new LineBasicMaterial({ color: 'white' });
    const line = new Line(geometry, material);
    line.position.set(0, 5, 0);
    line.rotateX(degToRad(90));
    robotGrp.add(line);

    // draw dead zone borders
    const deadZonePoints = [
        { length: 5, angle: LEFT_START_ANGLE + POINT_ANGLE * 2 },
        { length: 5, angle: LEFT_START_ANGLE + POINT_ANGLE * LIDAR_TOT_DEADZONE - 1 },
    ];
    drawLineLidar(robotGrp, deadZonePoints, COLOR.RED, false);
}

export function handleMessage(message: MessageEvent, scene: Scene): void {
    const m = JSON.parse(message.data);
    switch (m.type) {
        case SocketMessageType.LIDAR:
            drawLidarData(robotGroup, m.data);
            break;
        default:
            break;
    }
}

function main(): void {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(PLATFORM_WIDTH, PLATFORM_HEIGHT);
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

    initRobot(scene, ROBOT.GRANDE).then((robot) => {
        const ToFs = [];

        ToFs.push(getToF(scene, TOF.back_1, 7, COLOR.RED));
        ToFs.push(getToF(scene, TOF.back_2, 5, COLOR.RED));
        ToFs.push(getToF(scene, TOF.back_3, 7, COLOR.RED));
        ToFs.push(getToF(scene, TOF.back_4, 5, COLOR.RED));

        ToFs.push(getToF(scene, TOF.front_1, 4, COLOR.GREEN));
        ToFs.push(getToF(scene, TOF.front_2, 3, COLOR.GREEN));
        ToFs.push(getToF(scene, TOF.front_3, 3, COLOR.GREEN));
        ToFs.push(getToF(scene, TOF.front_4, 3, COLOR.GREEN));

        drawLidarBorder(robotGroup);
        drawLidarData(robotGroup, LIDAR_SCANDATA_MOCK);

        robotGroup.add(robot);
        robotGroup.add(...ToFs);

        robotGroup.position.x += ROBOT_LENGTH / 2;
        robotGroup.position.z += -(ROBOT_LENGTH / 2);

        scene.add(robotGroup);
    });

    // setTimeout(() => {
    //     moveRobot(robotGroup, 6, 3);
    //     rotateRobot(robotGroup, -90);
    // }, 4_000);

    ws.addEventListener(WebsocketEvent.message, (_: Websocket, message: MessageEvent) => {
        handleMessage(message, scene);
    });

    // simulate dynamic data
    // setTimeout(() => {
    //     drawLidarData(robotGroup, LIDAR_SCANDATA_MOCK_FULL);
    // }, 5_000);
    // setTimeout(() => {
    //     drawLidarData(robotGroup, LIDAR_SCANDATA_MOCK_2);
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
