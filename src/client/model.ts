import { Group, Mesh, Object3DEventMap } from 'three';

export const enum SocketMessageType {
    LIDAR = 'lidar',
}

export interface LidarPoint {
    length: number;
    angle: number;
}

export interface LidarLines {
    group: Group<Object3DEventMap>;
    mesh: Mesh;
}

export const enum ROBOT {
    PICCOLO = 'piccolo',
    GRANDE = 'grande',
}

export const enum COLOR {
    GREEN = 0x00ff00,
    RED = 0xff0000,
    YELLOW = 0xffff00,
}

export const enum TOF {
    front_1,
    front_2,
    front_3,
    front_4,
    back_1,
    back_2,
    back_3,
    back_4,
}
