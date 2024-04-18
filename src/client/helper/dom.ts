import Chart from 'chart.js/auto';
import DataTable from 'datatables.net-dt';
import { Socket } from 'socket.io-client';
import { Group, Scene, WebGLRenderer } from 'three';
import { SocketMessageType } from '../models/model';

export function fix_deploy_url(): void {
    const links = document.querySelectorAll<HTMLLinkElement>('.menu a');
    for (const link of links) {
        const param = link.getAttribute('data-params');
        link.href = `${location.protocol}//${location.host}${location.pathname}${param}`;
    }
}

export function add_align_button(socket: Socket): void {
    const alignBtn = document.querySelector<HTMLButtonElement>('#btn-align') as HTMLButtonElement;
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
    input3d.onchange = function (event: any): void {
        const container3D = document.querySelector<HTMLDivElement>(
            '#container-3d'
        ) as HTMLDivElement;
        const enabled = event?.target?.checked;
        if (enabled) {
            robotGroup.clear();
            renderer.clear();
            scene.clear();
            enable3D();
            container3D.style.display = 'block';
        } else {
            container3D.style.display = 'none';
            robotGroup.clear();
            scene.clear();
            renderer.clear();
            document.querySelector('#container-3d canvas')?.remove();
        }
    };
}

export function showPidGraphs(): void {
    (
        document.querySelector<HTMLCanvasElement>(
            '#line-chart-container canvas'
        ) as HTMLCanvasElement
    ).style.display = 'none';

    const inputGraph = document.querySelector<HTMLInputElement>(
        '#btn-option-pid-graphs'
    ) as HTMLInputElement;
    inputGraph.onchange = function (event: any): void {
        const canvasGraph = document.querySelector<HTMLCanvasElement>(
            '#line-chart-container canvas'
        ) as HTMLCanvasElement;
        const enabled = event?.target?.checked;
        if (enabled) {
            canvasGraph.style.height = '600px';
            canvasGraph.style.width = '800px';
            canvasGraph.style.display = 'block';
        } else {
            canvasGraph.style.display = 'none';
        }
    };
}

export function enableCANPacketViewer(): void {
    const divContainer = document.querySelector<HTMLDivElement>(
        '#can-packet-viewer'
    ) as HTMLDivElement;
    const inputCanPacket = document.querySelector<HTMLInputElement>(
        '#btn-option-can-packet'
    ) as HTMLInputElement;
    const table = new DataTable('#can-packet-table');
    inputCanPacket.onchange = function (event: any): void {
        const enabled = event.target.checked;
        divContainer.style.display = enabled ? 'block' : 'none';
    };
}

export function resetPidGraphs(chart: Chart): void {
    const resetBtn = document.querySelector<HTMLButtonElement>(
        '#btn-reset-pid-graphs'
    ) as HTMLButtonElement;
    resetBtn.onclick = function (): void {
        const len = chart?.data?.labels?.length as any;
        for (let i = 0; i < len; i++) {
            chart.data.labels?.pop();
            for (const dataset of chart.data.datasets) {
                dataset.data.pop();
            }
        }
        chart.update();
    };
}

export function initChart(): Chart {
    const ctx: any = document.querySelector<HTMLElement>('#line-chart') as HTMLElement;

    const sharedProperties = { fill: false, lineTension: 0, radius: 5 };
    const datasets = [
        {
            label: 'wheel',
            data: [10, 50, 25, 70, 40],
            backgroundColor: 'blue',
            borderColor: 'lightblue',
            ...sharedProperties,
        },
        {
            label: 'current_speed',
            data: [20, 35, 40, 60, 50],
            backgroundColor: 'green',
            borderColor: 'lightgreen',
            ...sharedProperties,
        },
        {
            label: 'target_speed',
            data: [1, 2, 3, 4, 5],
            backgroundColor: 'orange',
            borderColor: 'orange',
            ...sharedProperties,
        },
        {
            label: 'pwm',
            data: [6, 7, 8, 9, 10],
            backgroundColor: 'red',
            borderColor: 'red',
            ...sharedProperties,
        },
    ];

    const data = {
        labels: [1, 2, 3, 4, 5],
        datasets,
    };

    //options
    const options = {
        responsive: true,
        title: {
            display: true,
            position: 'top',
            text: 'Line Graph',
            fontSize: 18,
            fontColor: '#111',
        },
        legend: {
            display: true,
            position: 'bottom',
            labels: {
                fontColor: '#333',
                fontSize: 16,
            },
        },
    };

    return new Chart(ctx, {
        type: 'line',
        data,
        options,
    });
}
