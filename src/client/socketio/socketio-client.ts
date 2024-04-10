import { Socket, io } from 'socket.io-client';
import { Group, Object3DEventMap } from 'three';
import { moveRobot, rotateRobot } from '../helper/helper';
import { drawLidarData } from '../helper/lidar_functions';
import {
    CAN_IDS,
    LidarLine,
    RobotData,
    RobotWheelsVelocity,
    SocketMessageType,
} from '../models/model';

const cumulative_robot_wheels: RobotWheelsVelocity[] = [];

export function init_socketio_client(
    robotGroup: Group<Object3DEventMap>,
    lidarLines: LidarLine[]
): Socket {
    const socket = io('http://127.0.0.1:5000');

    setTimeout(() => {
        socket.emit('message', { data: 'Hello!' });
    }, 1_000);

    socket.on(SocketMessageType.NEW_CAN_PACKET, (data) => {
        console.log('CAN: ', data);
    });

    socket.on(SocketMessageType.ROBOT_DATA, (data: RobotData) => {
        const { X, Y, Angle } = data;
        moveRobot(robotGroup, X / 100, Y / 100);
        rotateRobot(robotGroup, Angle);

        switch (data.last_packet_id) {
            case CAN_IDS.DISTANCE_SENSOR:
            case CAN_IDS.MOTION_CMD:
            case CAN_IDS.OBST_MAP:
            case CAN_IDS.ROBOT_POSITION:
            case CAN_IDS.OTHER_ROBOT_POSITION:
            case CAN_IDS.ROBOT_SPEED:
            case CAN_IDS.ROBOT_STATUS:
            case CAN_IDS.STRATEGY_COMMAND:
                break;
            case CAN_IDS.ROBOT_WHEELS_VELOCITY:
                {
                    console.log('CAN PACKET ROBOT WHEELS', data);
                    const { wheel, current_speed, target_speed, pwm } = data;
                    cumulative_robot_wheels.push({ wheel, current_speed, target_speed, pwm });
                    console.log(cumulative_robot_wheels);
                }
                break;
            default:
                break;
        }
    });

    socket.on(SocketMessageType.LIDAR_DATA, (data) => {
        drawLidarData(lidarLines, robotGroup, data);
    });

    return socket;
}
