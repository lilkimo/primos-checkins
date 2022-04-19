<script setup lang="ts">
import LogoutIcon from "./icons/IconLogout.vue";

import { useMsal } from '../composition-api/useMsal';
const { instance } = useMsal();

const logout = () => {
    instance.logoutRedirect({ account: instance.getActiveAccount() });
}
</script>

<script lang="ts">
const url = "http://127.0.0.1:8000/api/";
const nowInfo = await fetch(url + "now").then(response => response.json());

export default {
    props: {
        primoInfo: Object
    },
    data() {
        return {
            datetime: new Date(nowInfo.datetime),
            primo: Object.assign({},
                this.primoInfo,
                { 
                    onshift: nowInfo.ushift.isactive && nowInfo.pair.some( (p: any) => p.rol == this.primoInfo.rol )
                }
            ),

            rshift: this.primoInfo.running,
            ushift: {
                shift: nowInfo.ushift.shift,
                checkin: nowInfo.ushift.checkin,
                checkout: nowInfo.ushift.checkout,
                pair: nowInfo.pair,
            },

            requestNowInterval: 0
        };
    },
    methods: {
        requestNow() {
            return fetch(url + "now").then(response => response.json()).then(now => {
                this.datetime = new Date(now.datetime);
                this.primo.onshift = now.ushift.isactive && now.pair.some( (p: any) => p.rol == this.primo.rol )

                this.ushift = {
                    shift: now.ushift.shift,
                    checkin: now.ushift.checkin,
                    checkout: now.ushift.checkout,
                    pair: now.pair,
                }
            });
        },
        requestPrimo() {
            return fetch(url + "primos/" + this.mail).then(response => response.json()).then(primo => {
                this.primo = Object.assign(this.primo, primo)
                this.rshift = primo.running
            })
        },
        
        pushShift(event: Event) {
            event.target.disabled = true;

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rol: this.primo.rol
                })
            };

            return fetch(url + "shifts", requestOptions).then( response => {
                if (response.ok)
                    return this.requestPrimo().then( () => this.$emitter.emit("update-week") );
                event.target.disabled = false;
            });
        },
        updateShift(event: Event) {
            event.target.disabled = true;

            const requestOptions = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: this.rshift.id
                })
            };
            return fetch(url + "shifts", requestOptions).then( response => {
                if (response.ok)
                    return this.requestPrimo().then( () => this.$emitter.emit("update-week") );
                event.target.disabled = false;
            });
        },
        renewShift(event: Event) {
            event.target.disabled = true;

            return this.updateShift(event).then( () => this.pushShift(event) );
        },

        duringAShift(date: string, shift: any): boolean {
            const _date = new Date(date);
            return (new Date(shift.checkin) <= _date) && (_date <= new Date(shift.checkout));
        }
    },
    created() {
        //this.requestPrimo();
        this.requestNow();
        this.requestNowInterval = setInterval(this.requestNow, 2000);
    },
    beforeUnmount() {
        clearInterval(this.requestNowInterval);
    }
};

function sameDay(date1: Date, date2: Date): boolean {
    return date1.toDateString() == date2.toDateString();
}
</script>

<template>
    <div class="pad">
        <div class="box attendance">
            <div class="primo_onshift">
                <div>
                    <span class="nickname" style="vertical-align: middle;">{{ primo.nick }}</span>
                    &nbsp;<LogoutIcon v-on:click="logout" class="icon"/>
                </div>
                <span
                    v-if="ushift.pair.some( (p: any) => p.rol == primo.rol) && ushift.pair.length > 1"
                >
                    Pareja: {{ ushift.pair.filter( (p: any) => p.rol != primo.rol ).map( (p: any) => p.nick ).join(", ") }}
                </span>
            </div>
            <!-- Si hay turnos pendientes -->
            <div
                v-if="rshift != null"
            >
                <span>Tiempo de turno:</span>
                <div class="upcoming_shift">
                    <span>
                        <span class="time">{{
                            Math.floor((new Date(datetime) - new Date(rshift.checkin))/(60 * 60 * 1000))
                        }}</span><span>h</span>
                    </span>
                    <span>
                        <span class="time">{{
                            Math.floor((new Date(datetime) - new Date(rshift.checkin))/(60 * 1000)) % 60
                        }}</span><span>m</span>
                    </span>
                </div>
            </div>
            <!--Si no hay turnos corriendo y el siguiente turno ya empezó-->
            <div
                v-else-if="new Date(ushift.checkin) <= datetime"
            >
                <span>El turno empezó hace:</span>
                <div class="upcoming_shift">
                    <span>
                        <span class="time">{{
                            Math.floor((new Date(datetime) - new Date(ushift.checkin))/(60 * 60 * 1000))
                        }}</span><span>h</span>
                    </span>
                    <span>
                        <span class="time">{{
                            Math.floor((new Date(datetime) - new Date(ushift.checkin))/(60 * 1000)) % 60
                        }}</span><span>m</span>
                    </span>
                </div>
            </div>
            <!--Si no hay turnos corriendo y el siguiente aún no empieza y es hoy-->
            <div
                v-else-if="sameDay(new Date(ushift.checkin), datetime)"
            >
                <span>Próximo turno en:</span>
                <div class="upcoming_shift">
                    <span>
                        <span class="time">{{
                            Math.floor((new Date(ushift.checkin) - new Date(datetime))/(60 * 60 * 1000))
                        }}</span><span>h</span>
                    </span>
                    <span>
                        <span class="time">{{
                            Math.floor((new Date(ushift.checkin) - new Date(datetime))/(60 * 1000)) % 60
                        }}</span><span>m</span>
                    </span>
                </div>
            </div>
            <!--Si no hay turnos corriendo y el siguiente aún no empieza y no es hoy-->
            <div
                v-else
            >
                <div style="display: grid;">
                    <span style="text-align: center;">Próximo turno:</span>
                    <span class="time">
                        {{ new Date(ushift.checkin).toLocaleString('es-ES', {weekday: 'long'}) }} {{ ushift.shift }}
                    </span>
                </div>
            </div>
            <div>
                <!--Si no hay turnos corriendo ni es tu turno-->
                <button disabled class="button attendance_button"
                    v-if="rshift == null && !primo.onshift"
                >
                    INICIAR<br>
                    TURNO
                </button>
                <!--Si no hay turnos corriendo y es tu turno-->
                <button class="button attendance_button"
                    v-on:click="pushShift"
                    v-else-if="rshift == null && primo.onshift"
                >
                    INICIAR<br>
                    TURNO
                </button>
                <!--Si hay algún turno corriendo y el siguiente no es inmediato-->
                <button class="button attendance_button" style="background-color: var(--red);"
                    v-on:click="updateShift"
                    v-else-if="!primo.onshift || duringAShift(rshift.checkin, ushift)"
                >
                    MARCAR&nbsp;<br>
                    SALIDA
                </button>
                <!--Si hay algún turno corriendo y el siguiente es inmediato-->
                <button class="button attendance_button" v-on:click="renewShift" style="background-color: var(--blue);"
                    v-else
                >
                    RENOVAR<br>
                    TURNO
                </button>
            </div>
        </div>
        <div class="box aligns">
            <button class="button aligns_button">
                REGISTROS
            </button>
            <button class="button aligns_button">
                ESTADÍSTICAS
            </button>
        </div>
    </div>
</template>

<style scoped>
.pad {
    display: flex;
    align-items: stretch;
    gap: 2em;
}
.box {
    padding: 1em;
    border-radius: 1em;
    border: 2px solid #f5f5f533;
}
.attendance {
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    width: 100%;
}
.aligns {
    display: flex;
    flex-direction: column;
    gap: 1em;
}
.text_container {
    flex: 1;
    display: flex;
}
.primo_onshift {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 0 1em;
}
.nickname {
    font-size: 28px;
}
.icon {
    vertical-align: middle;
    cursor: pointer;
}
.upcoming_shift {
    display: flex;
    justify-content: center;
    gap: .5em;
}
.time {
    font-size: 28px;
}
.button {
    background-color: var(--green);
    cursor: pointer;
    
    border: 0;
    border-radius: 1em;
    height: 100%;
}
.button:disabled,
.button[disabled] {
    background-color: #f5f5f533;
    cursor: default;
}
.attendance_button {
    padding: 0 1.5em;
}
.aligns_button {
    padding: 0 .65em;
}
</style>