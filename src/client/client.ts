import { Color, Group, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
    add_align_button,
    add_option_3d,
    enableCANPacketViewer,
    fix_deploy_url,
    initChart,
    resetPidGraphs,
    showPidGraphs,
} from './helper/dom';
import {
    RenderRobot,
    addLight,
    getToF,
    initMap,
    renderRobot,
    resizeRendererToDisplaySize,
} from './helper/helper';
import { drawLidarBorder, drawLidarData } from './helper/lidar_functions';
import { LIDAR_SCANDATA_MOCK, ROBOT_LENGTH } from './models/data';
import { COLOR, LidarLine, TOF } from './models/model';
import { PLATFORM_HEIGHT, PLATFORM_WIDTH } from './settings';
import { init_socketio_client } from './socketio/socketio-client';

const lidarLines: LidarLine[] = [];
const robotGroup = new Group();
const scene = new Scene();
const renderer = new WebGLRenderer({ antialias: true });

fix_deploy_url();
add_option_3d(enable3D, robotGroup, renderer, scene);
showPidGraphs();
enableCANPacketViewer();

const chart = initChart();
const socket = init_socketio_client(robotGroup, lidarLines, chart);
resetPidGraphs(chart);

add_align_button(socket);
function enable3D(): void {
    renderer.setSize(PLATFORM_WIDTH, PLATFORM_HEIGHT);

    const canvas = (
        document.querySelector<HTMLDivElement>('#container-3d') as HTMLDivElement
    ).appendChild(renderer.domElement);

    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 10, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    scene.background = new Color('black');

    initMap(scene);
    addLight(scene);

    const isToF =
        (document.querySelector<HTMLInputElement>('#btn-option-tof') as HTMLInputElement)
            ?.checked || false;
    const isLidar =
        (document.querySelector<HTMLInputElement>('#btn-option-lidar') as HTMLInputElement)
            ?.checked || false;

    renderRobot(scene, isLidar, isToF).then(({ robot, isLidar, isToF }: RenderRobot) => {
        if (isToF) {
            const ToFs = [];

            ToFs.push(getToF(scene, TOF.back_1, 7, COLOR.RED));
            ToFs.push(getToF(scene, TOF.back_2, 5, COLOR.RED));
            ToFs.push(getToF(scene, TOF.back_3, 7, COLOR.RED));
            ToFs.push(getToF(scene, TOF.back_4, 5, COLOR.RED));

            ToFs.push(getToF(scene, TOF.front_1, 4, COLOR.GREEN));
            ToFs.push(getToF(scene, TOF.front_2, 3, COLOR.GREEN));
            ToFs.push(getToF(scene, TOF.front_3, 3, COLOR.GREEN));
            ToFs.push(getToF(scene, TOF.front_4, 3, COLOR.GREEN));

            robotGroup.add(...ToFs);
        }

        if (isLidar) {
            drawLidarBorder(lidarLines, robotGroup);
            drawLidarData(lidarLines, robotGroup, LIDAR_SCANDATA_MOCK);
        }

        robotGroup.add(robot);

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
// enable3D();
