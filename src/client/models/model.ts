import { Group, Mesh, Object3DEventMap } from 'three';

export const enum SocketMessageType {
    NEW_CAN_PACKET = 'NEW_CAN_PACKET',
    ROBOT_DATA = 'ROBOT_DATA',
    LIDAR_DATA = 'LIDAR_DATA',
    SEND_ALIGN = 'SEND_ALIGN',
}

export const enum CAN_IDS {
    ROBOT_POSITION = 0x3e3,
    ROBOT_SPEED = 0x3e4,
    OTHER_ROBOT_POSITION = 0x3e5,
    ROBOT_STATUS = 0x402,
    DISTANCE_SENSOR = 0x670,
    MOTION_CMD = 0x7f0,
    OBST_MAP = 0x70f,
    STRATEGY_COMMAND = 0x710,
    ROBOT_WHEELS_VELOCITY = 0x3e7,
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

export interface RobotWheelsVelocity {
    wheel: number;
    current_speed: number;
    target_speed: number;
    pwm: number;
}

export interface RobotData extends Position, RobotStatus, DistanceSensor, RobotWheelsVelocity {
    last_packet_id: number;
    linear_speed: number;
}
