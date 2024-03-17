import { Websocket } from 'websocket-ts';

export function add_align_button(ws: Websocket) {
    const alignBtn = document.createElement('button');
    alignBtn.innerHTML = 'Send align';
    alignBtn.id = 'btn-align';

    alignBtn.onclick = function () {
        ws.send('ALIGN');
        const btn = document.querySelector<HTMLElement>('#btn-align');
        (btn as any).disabled = true;
        setTimeout(() => {
            (btn as any).disabled = false;
        }, 3_000);
    };

    document.body.appendChild(alignBtn);
}
