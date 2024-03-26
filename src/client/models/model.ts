import { Group, Mesh, Object3DEventMap } from 'three';

export const enum SocketMessageType {
    NEW_CAN_PACKET = 'NEW_CAN_PACKET',
    ROBOT_DATA = 'ROBOT_DATA',
    LIDAR_DATA = 'LIDAR_DATA',
    SEND_ALIGN = 'SEND_ALIGN',
}

export interface LidarPoint {
    length: number;
    angle: number;
}

export interface LidarLine {
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

export interface Position {
    X: number;
    Y: number;
    Angle: number;
    Flags: number;
    Bumpers: number;
}

interface RobotStatus {
    robot_selected: number;
    status_display: number;
}
interface DistanceSensor {
    sensor: number;
    distance: number;
    alarm: number;
}

export interface RobotData extends Position, RobotStatus, DistanceSensor {
    linear_speed: number;
}
