import {
    BoxGeometry,
    ColorRepresentation,
    DirectionalLight,
    DoubleSide,
    HemisphereLight,
    Mesh,
    MeshPhongMaterial,
    MeshStandardMaterial,
    NearestFilter,
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
import { COLOR, ROBOT, TOF } from './model';
import { LINEWIDTH, ToF_OBJECT } from './settings';

import { Material } from 'three';
import { MAP_SRC } from './settings';

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

export function initRobot(scene: Scene, type: ROBOT = ROBOT.GRANDE): void {
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

export function getLineMesh(length: number, color: ColorRepresentation): Mesh {
    const material = new MeshStandardMaterial({ color });
    const geometry = new BoxGeometry(LINEWIDTH, LINEWIDTH, length);
    const mesh = new Mesh(geometry, material);
    return mesh;
}

export function drawToF(scene: Scene, tofType: TOF, tofValue: number, color: COLOR): void {
    if (ToF_OBJECT[tofType]?.mesh) {
        const mesh = ToF_OBJECT[tofType]?.mesh as Mesh;
        scene.remove(mesh);
        disposeMesh(mesh);
    }
    const mesh = getLineMesh(tofValue, color);
    const { x, y, z } = ToF_OBJECT[tofType];
    mesh.position.set(x, y, z(tofValue));
    scene.add(mesh);
}
