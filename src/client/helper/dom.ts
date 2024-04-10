import { Socket } from 'socket.io-client';
import { Group, Scene, WebGLRenderer } from 'three';
import { SocketMessageType } from '../models/model';

export function add_align_button(socket: Socket): void {
    const alignBtn = document.querySelector<HTMLButtonElement>('#btn-align') as HTMLButtonElement;
    alignBtn.innerHTML = 'Send align';
    alignBtn.id = 'btn-align';

    alignBtn.onclick = function () {
        socket.emit(SocketMessageType.SEND_ALIGN, []);
        const btn = document.querySelector<HTMLButtonElement>('#btn-align') as HTMLButtonElement;
        btn.disabled = true;
        btn.innerHTML = 'Sent!';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = 'Send align';
        }, 3_000);
    };
}

export function add_option_3d(
    enable3D: Function,
    robotGroup: Group,
    renderer: WebGLRenderer,
    scene: Scene
): void {
    const input3d = document.querySelector<HTMLInputElement>('#btn-option3d') as HTMLInputElement;
    input3d.onchange = function (event: any) {
        const enabled = event.target.checked;
        if (enabled) {
            robotGroup.clear();
            renderer.clear();
            scene.clear();
            enable3D();
        } else {
            robotGroup.clear();
            scene.clear();
            renderer.clear();
            document.querySelector('canvas')?.remove();
        }
    };
}
