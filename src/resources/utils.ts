import bloques from "../resources/bloques.json";

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