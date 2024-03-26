import { BufferGeometry, Group, Line, LineBasicMaterial, Path } from 'three';
import { degToRad } from 'three/src/math/MathUtils';
import { LEFT_START_ANGLE, LIDAR_TOT_DEADZONE, POINT_ANGLE } from '../models/data';
import { COLOR, LidarLine, LidarPoint } from '../models/model';
import { disposeMesh, getLineMesh } from './helper';

export function drawLineLidar(
    lidarLines: LidarLine[],
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

export function emptyLidar(lidarLines: LidarLine[], robotGrp: Group): void {
    for (const l of lidarLines) {
        robotGrp.remove(l.group);
        disposeMesh(l.mesh);
    }
    lidarLines.length = 0;
}

export function drawLidarData(lidarLines: LidarLine[], robotGrp: Group, scandata: number[]): void {
    emptyLidar(lidarLines, robotGrp);
    let angle = LEFT_START_ANGLE;
    const lidarPoints: LidarPoint[] = scandata.map((s) => {
        const length = s / 1000;
        angle -= POINT_ANGLE;
        return { length, angle };
    });
    angle = LEFT_START_ANGLE;
    drawLineLidar(lidarLines, robotGrp, lidarPoints);
}

export function drawLidarBorder(lidarLines: LidarLine[], robotGrp: Group): void {
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
    drawLineLidar(lidarLines, robotGrp, deadZonePoints, COLOR.RED, false);
}
