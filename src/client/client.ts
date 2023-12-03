import {
    BoxGeometry,
    Color,
    ColorRepresentation,
    DirectionalLight,
    DoubleSide,
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

const enum ROBOT {
    PICCOLO = 'piccolo',
    GRANDE = 'grande',
}
// ROBOT dimensions 300x300x350 mediamente (h x w x l)
const ROBOT_HEIGHT = 300;
const ROBOT_WIDTH = 300;
const ROBOT_LENGTH = 350;

function mmToUnit(mm: number): number {
    return mm / 100;
}

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

function drawLine(
    scene: Scene,
    x: number,
    y: number,
    z: number,
    length: number,
    color: ColorRepresentation = 0xff0000
): void {
    const material = new MeshStandardMaterial({ color });
    const mesh = new Mesh(new BoxGeometry(0.25, length, 0.25), material);
    mesh.position.set(x, y, z);
    mesh.rotateX(degToRad(90));
    scene.add(mesh);
}

function main() {
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(1500, 1000);
    const canvas = document.body.appendChild(renderer.domElement);

    const fov = 45;
    const aspect = 2; // the canvas default
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

    drawLine(scene, 1.1, 0, -5, 10);
    drawLine(scene, -1.1, 0, -5, 8);

    drawLine(scene, 1.1, 0, 5, 7, 0x00ff00);
    drawLine(scene, -1.1, 0, 5, 6, 0x00ff00);

    drawLine(scene, -1.1, 5, -5, 8, 0xffff00);

    function resizeRendererToDisplaySize(renderer: WebGLRenderer) {
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
