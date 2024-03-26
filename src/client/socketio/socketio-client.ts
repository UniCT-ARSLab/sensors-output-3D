import { Socket, io } from 'socket.io-client';
import { Group, Object3DEventMap } from 'three';
import { moveRobot, rotateRobot } from '../helper/helper';
import { drawLidarData } from '../helper/lidar_functions';
import { LidarLine, RobotData, SocketMessageType } from '../models/model';

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

    socket.on(SocketMessageType.ROBOT_DATA, (data) => {
        const { X, Y, Angle } = data as RobotData;
        moveRobot(robotGroup, X / 100, Y / 100);
        rotateRobot(robotGroup, Angle);
    });

    socket.on(SocketMessageType.LIDAR_DATA, (data) => {
        drawLidarData(lidarLines, robotGroup, data);
    });

    return socket;
}
