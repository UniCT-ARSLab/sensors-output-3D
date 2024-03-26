import {
    BoxGeometry,
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
    Object3DEventMap,
    PlaneGeometry,
    RepeatWrapping,
    SRGBColorSpace,
    Scene,
    TextureLoader,
    WebGLRenderer,
} from 'three';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { degToRad } from 'three/src/math/MathUtils';
import { COLOR, ROBOT, TOF } from '../models/model';
import { LINEWIDTH, MAP_SRC, MAP_X, MAP_Y, ToF_OBJECT } from '../settings';

export function resizeRendererToDisplaySize(renderer: WebGLRenderer): boolean {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
    }

    return needResize;
}

export function disposeMesh(mesh: Mesh): void {
    mesh.geometry.dispose();
    (mesh.material as Material).dispose();
}

export function initMap(scene: Scene): void {
    const loader = new TextureLoader();
    const texture = loader.load(MAP_SRC);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.magFilter = NearestFilter;

    const planeGeo = new PlaneGeometry(MAP_X, MAP_Y);

    const planeMat = new MeshPhongMaterial({
        map: texture,
        side: DoubleSide,
    });
    const mesh = new Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.x = MAP_X / 2;
    mesh.position.z = -MAP_Y / 2;
    scene.add(mesh);
}

export function addLight(scene: Scene): void {
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

export async function initRobot(
    scene: Scene,
    type: ROBOT = ROBOT.GRANDE
): Promise<Group<Object3DEventMap>> {
    return new Promise<Group<Object3DEventMap>>((resolve) => {
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

                resolve(obj);
            });
        });
    });
}

export function getLineMesh(length: number, color: ColorRepresentation): Mesh {
    const material = new MeshStandardMaterial({ color });
    const geometry = new BoxGeometry(LINEWIDTH, LINEWIDTH, length);
    const mesh = new Mesh(geometry, material);
    return mesh;
}

export function getToF(scene: Scene, tofType: TOF, tofValue: number, color: COLOR): Mesh {
    if (ToF_OBJECT[tofType]?.mesh) {
        const mesh = ToF_OBJECT[tofType]?.mesh as Mesh;
        scene.remove(mesh);
        disposeMesh(mesh);
    }
    const mesh = getLineMesh(tofValue, color);
    const { x, y, z } = ToF_OBJECT[tofType];
    mesh.position.set(x, y, z(tofValue));

    return mesh;
}

export function moveRobot(robotGrp: Group, X: number, Y: number): void {
    if (robotGrp) {
        const { x, z } = robotGrp.position;
        if (x && x !== X) {
            robotGrp.position.x = X;
        }

        if (z && z !== -Y) {
            robotGrp.position.z = -Y;
        }
    }
}

export function rotateRobot(robotGrp: Group, angle: number): void {
    if (robotGrp && angle && robotGrp.rotation.y !== degToRad(angle)) {
        robotGrp.rotation.y = degToRad(angle);
    }
}
