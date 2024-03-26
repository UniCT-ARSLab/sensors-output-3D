import { Color, Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { add_align_button } from './helper/dom';
import { addLight, getToF, initMap, initRobot, resizeRendererToDisplaySize } from './helper/helper';
import { drawLidarBorder, drawLidarData } from './helper/lidar_functions';
import { LIDAR_SCANDATA_MOCK, ROBOT_LENGTH } from './models/data';
import { COLOR, LidarLine, ROBOT, TOF } from './models/model';
import { PLATFORM_HEIGHT, PLATFORM_WIDTH } from './settings';
import { init_socketio_client } from './socketio/socketio-client';

const lidarLines: LidarLine[] = [];
const robotGroup = new Group();

const socket = init_socketio_client(robotGroup, lidarLines);

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

        drawLidarBorder(lidarLines, robotGroup);
        drawLidarData(lidarLines, robotGroup, LIDAR_SCANDATA_MOCK);

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

add_align_button(socket);

main();
