import bloques from "../resources/bloques.json";
import { apiUrl } from '../../config.js'

export function relativeTime(now: Date): number {
    const minutes = (now.getHours()*60) + now.getMinutes();
    let time = 0;
    let start, end;
    for (const bloque of bloques) {
        start = (bloque.inicio[0]*60) + bloque.inicio[1];
        end = (bloque.final[0]*60) + bloque.final[1];
        if (minutes < start)
            break;
        else if (minutes < end)
            // Cantidad de bloques transcurridos + lo que se ha transcurrido del bloque actual
            return time + ((minutes - start)/(end - start));
        time++;
    }
    return time;
}

export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

const _dayName = ["dom", "lun", "mar", "mié", "jue", "vie", "sab"]
export const dayName = (weekStart: number = 0) => {
    weekStart = mod(weekStart, 7)
    return [..._dayName.slice(weekStart, _dayName.length), ..._dayName.slice(0, weekStart)]
}

// Me dió lata cambiar este valor en todo el proyecto xd, queda pendiente
export const url = apiUrl
