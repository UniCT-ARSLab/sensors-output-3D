import { Socket } from 'socket.io-client';
import { SocketMessageType } from '../models/model';

export function add_align_button(socket: Socket) {
    const alignBtn = document.createElement('button');
    alignBtn.innerHTML = 'Send align';
    alignBtn.id = 'btn-align';

    alignBtn.onclick = function () {
        socket.emit(SocketMessageType.SEND_ALIGN, []);
        const btn = document.querySelector<HTMLElement>('#btn-align');
        (btn as any).disabled = true;
        setTimeout(() => {
            (btn as any).disabled = false;
        }, 3_000);
    };

    document.body.appendChild(alignBtn);
}
