import { Mesh } from 'three';
import { TOF } from './model';

// 30 units = 3000 mm, 20 units = 2000 mm
export const MAP_X = 30;
export const MAP_Y = 20;

export const PLATFORM_WIDTH = 1000;
export const PLATFORM_HEIGHT = 800;

export const LINEWIDTH = 0.05;

export const ToF_OBJECT: Record<
    string,
    { mesh?: Mesh; x: number; y: number; z: (val: number) => number }
> = {
    [TOF.back_1]: { x: 0.75, y: 0, z: (val: number) => 1.7 + val / 2 },
    [TOF.back_2]: { x: -1.1, y: 0, z: (val: number) => 1.7 + val / 2 },
    [TOF.back_3]: { x: 1, y: 2.5, z: (val: number) => 1 + val / 2 },
    [TOF.back_4]: { x: -1.4, y: 2.5, z: (val: number) => 0.95 + val / 2 },
    [TOF.front_1]: { x: 0.75, y: 0, z: (val: number) => -1 - val / 2 },
    [TOF.front_2]: { x: -1.1, y: 0, z: (val: number) => -1 - val / 2 },
    [TOF.front_3]: { x: 0.45, y: 2.85, z: (val: number) => -1.15 - val / 2 },
    [TOF.front_4]: { x: -0.75, y: 2.85, z: (val: number) => -1.15 - val / 2 },
};

export const MAP_SRC = 'assets/2024.png';
