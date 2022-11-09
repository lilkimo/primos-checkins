import { url } from "./utils";

let width: number, height: number, gradient: any;
export function getGradient(ctx: any, chartArea: any) {
    const chartWidth = chartArea.right - chartArea.left;
    const chartHeight = chartArea.bottom - chartArea.top;
    if (!gradient || width !== chartWidth || height !== chartHeight) {
        // Create the gradient because this is either the first render
        // or the size of the chart has changed
        width = chartWidth;
        height = chartHeight;
        gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
        gradient.addColorStop(1, "#2bae66c0");
        gradient.addColorStop(0.9, "#2bae66c0");
        gradient.addColorStop(0.5, "transparent");
        gradient.addColorStop(0.1, "#ff645bff");
        gradient.addColorStop(0, "#ff645bff");
    }
    return gradient;
}

function average(ctx: any) {
    const values = ctx.chart.data.datasets[0].data.filter( (n: number) => !isNaN(n) )
    return values.reduce((a: number, b: number) => a + b, 0)/values.length;
}

export async function getDatapoints(mail: string, start: Date, end?: Date) {
    let params =  {
        mail: mail,
        start: new Date(start.getTime() - start.getTimezoneOffset()*60*1000).toISOString().slice(0, 10)
    }
    if (end !== null && end !== undefined)
        Object.assign(params, { end: new Date(end.getTime() - end.getTimezoneOffset()*60*1000).toISOString().slice(0, 10) } )

    return fetch(url + "shifts?" + new URLSearchParams(params)).then(r => r.json())
}

export const options = {
    plugins: {
        legend: {
            display: false,
        },
        autocolors: false,
        annotation: {
            annotations: {
                line1: {
                    type: 'line',
                    borderColor: '#0075ff',
                    borderDash: [6, 6],
                    borderWidth: 2,
                    scaleID: 'y',
                    value: (ctx: any) => average(ctx)
                }
            }
        }
    },
    scales: {
        x: {
            display: true,
            offset: true,
            title: {
                display: true,
                color: '#fffaf0',
                text: 'Turno'
            },
            grid: {
                color: '#f5f5f533',
                borderColor: '#f5f5f533',
                tickColor: '#f5f5f533'
            },
        },
        y: {
            display: true,
            title: {
                display: true,
                color: '#fffaf0',
                text: 'Hora de llegada (minutos)'
            },
            grid: {
                color: '#f5f5f533',
                borderColor: '#f5f5f533',
                tickColor: '#f5f5f533'
            },
            suggestedMin: -10,
            suggestedMax: 10
        },
    },
}
