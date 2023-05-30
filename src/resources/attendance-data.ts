import { dayName, mod, url } from "./utils";

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

    const resume = await fetch(url + "shifts?" + new URLSearchParams(params)).then(r => r.json())
    resume.inSchedule.sort( (a: any, b: any) => {
        if (a.checkin > b.checkin)
            return 1
        if (a.checkin < b.checkin)
            return -1;
        return 0;
    })

    let currDay = new Date(resume.start)
    // Obtengo el horario relativo, donde <relativeSchedule.weekday> es
    // cuántos días de la semana deben avanzar desde el día anterior para
    // llegar a ese día (de forma cíclica). Notar que está desfasado y el
    // primer día se encuentra en el último lugar.
    let relativeSchedule = Array(resume.schedule.length)
    for (let shift, i = 1; i <= resume.schedule.length; i++) {
        shift = resume.schedule[mod(i, resume.schedule.length)]
        relativeSchedule[i - 1] = {
            weekday: mod(shift.weekday - resume.schedule[i - 1].weekday, 7),
            block: shift.block,
            time: shift.time
        }
    }

    const relativeFirstShift = mod(resume.schedule[0].weekday - (currDay.getDay() - 1), 7)
    // Voy al primer día que tengo turno
    currDay.setDate(currDay.getDate() + relativeFirstShift)
    let shifts: number[] = Array(resume.ideal)
    let labels: string[] = Array(resume.ideal)
    for (let time: Date, shift = relativeSchedule[relativeSchedule.length - 1], j = 0, i = 0; i < resume.ideal; i++) {
        labels[i] = dayName()[currDay.getDay()] + " " + shift.block
        if (
               j < resume.inSchedule.length
            && currDay.toDateString() == new Date(resume.inSchedule[j].checkin).toDateString()
            && shift.block == resume.inSchedule[j].block
        ) {
            time = new Date(resume.inSchedule[j++].checkin)
            shifts[i] = shift.time - (60*time.getHours() + time.getMinutes())
        }
        else
            shifts[i] = NaN

        shift = relativeSchedule[mod(i, relativeSchedule.length)]
        currDay.setDate(currDay.getDate() + shift.weekday)
    }
    return {
        ideal: resume.ideal,
        inSchedule: resume.inSchedule.length,
        suspicious: resume.suspicious.length,
        labels: labels,
        datapoints: shifts,
    }
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
