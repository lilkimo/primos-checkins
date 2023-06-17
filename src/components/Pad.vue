<script setup lang="ts">
import LogoutIcon from "./icons/IconLogout.vue";
import { url } from "@/resources/utils";

import {
    isWithinInterval,
    isSameDay,
    formatDistanceStrict,
    differenceInMinutes,
    formatDuration,
    intervalToDuration,
formatDistance,
} from 'date-fns'
import { es } from 'date-fns/locale'

// @ts-expect-error
import { $vfm, VueFinalModal, ModalsContainer } from 'vue-final-modal'
import { useMsal } from '../composition-api/useMsal';

const { instance } = useMsal();

const logout = () => {
    instance.logoutRedirect({ account: instance.getActiveAccount() });
}
</script>

<script lang="ts">
const nowInfo = await fetch(url + "now").then(response => response.json());

export default {
    components: { VueFinalModal, ModalsContainer },
    props: {
        primoInfo: Object
    },
    data() {
        return {
            showModal: false,

            now: new Date(nowInfo.datetime),
            primo: Object.assign({},
                this.primoInfo,
                { 
                    onshift: nowInfo.upcoming.isactive && nowInfo.pair.some( (p: any) => p.mail == this.primoInfo?.mail )
                }
            ),

            rshift: this.primoInfo?.running,
            nshift: this.primoInfo?.next,
            ushift: {
                block: nowInfo.upcoming.block,
                checkin: nowInfo.upcoming.checkin,
                checkout: nowInfo.upcoming.checkout,
                pair: nowInfo.pair,
            },

            requestNowInterval: 0
        };
    },
    methods: {
        requestNow() {
            fetch(url + "now").then(response => response.json()).then(data => {
                this.now = new Date(data.datetime);
                this.primo.onshift = data.upcoming.isactive && data.pair.some( (p: any) => p.mail == this.primo.mail )
                
                // Cada vez que cambia el bloque solicitamos de nuevo la
                // info del primo, para ver cual es su siguiente turno
                if (data.upcoming.block != this.ushift.block)
                    this.requestPrimo()
                
                this.ushift = {
                    block: data.upcoming.block,
                    checkin: data.upcoming.checkin,
                    checkout: data.upcoming.checkout,
                    pair: data.pair,
                }
            });
        },
        async requestPrimo() {
            return fetch(url + "primos/" + this.primo.mail).then(response => response.json()).then(primo => {
                this.primo = Object.assign(this.primo, primo)
                this.rshift = primo.running
                this.nshift = primo.next
            })
        },
        
        setAttendanceButtonAvailability(state: boolean) {
            let buttons = document.getElementsByClassName('attendance_button')
            for (let i = 0; i < buttons.length; i++)
                (buttons[i] as HTMLButtonElement).disabled = !state;
        },
        pushShift() {
            this.setAttendanceButtonAvailability(false);

            const requestOptions = {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mail: this.primo.mail
                })
            };

            fetch(url + "shifts", requestOptions).then( response => {
                this.setAttendanceButtonAvailability(true)
                if (response.ok)
                    return this.requestPrimo()
            }).then( () => this.$emitter.emit("update-week") )
        },
        async updateShift() {
            this.setAttendanceButtonAvailability(false)

            const requestOptions = {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: this.rshift.id
                })
            };
            return fetch(url + "shifts", requestOptions)
                .then( response => {
                    this.setAttendanceButtonAvailability(true)
                    if (response.ok)
                        return this.requestPrimo()
                }).then( () => this.$emitter.emit("update-week") )
        },
        updateShiftSafety() {
            if (isWithinInterval(
                this.now, {
                    start: new Date(this.ushift.checkin),
                    end: new Date(this.ushift.checkout),
            }))
                this.showModal = true
            else
                this.updateShift()
        },
        renewShift() {
            this.setAttendanceButtonAvailability(false)

            return this.updateShift().then( () => this.pushShift() );
        },
    },
    created() {
        this.requestNow();
        this.requestNowInterval = window.setInterval(this.requestNow, 1000);
    },
    beforeUnmount() {
        clearInterval(this.requestNowInterval);
    }
};
</script>

<template>
    <div class="pad">
        <vue-final-modal v-model="showModal" classes="modal-container" content-class="modal-content">
            <span class="modal__title">¿Estás Seguro?</span>
            <div class="modal__content">
                Estás marcando salida <u>antes de lo previsto</u>. Recuerda que, una vez cerrado el turno, <u>no podrás iniciar otro en el mismo bloque</u>.
            </div>
            <div class="modal__action">
                <button class="button modal__button modal__button__confirm" @click="updateShift().then( _ => showModal = false )">CONFIRMAR</button>
                <button class="button modal__button modal__button__cancel" @click="showModal = false">CANCELAR</button>
            </div>
        </vue-final-modal>
        <div class="box attendance">
            <div class="primo_onshift">
                <div>
                    <span class="nickname" style="vertical-align: middle;">{{ primo.nick }}</span>
                    &nbsp;<LogoutIcon v-on:click="logout" class="icon"/>
                </div>
                <span v-if="ushift.pair.length > 1 && ushift.pair.some( (p: any) => p.mail == primo.mail)" >
                    Pareja: {{ ushift.pair.filter( (p: any) => p.mail != primo.mail ).map( (p: any) => p.nick ).join(", ") }}
                </span>
            </div>
            <!-- Si hay turnos corriendo y aún no termina el bloque -->
            <div v-if="rshift != null && now <= new Date(nshift.checkout)" class="timer">
                <span class="title">Tiempo restante de turno:</span>
                <span class="time">
                    {{ 
                        formatDistanceStrict(
                            new Date(nshift.checkout),
                            now, 
                            {
                                unit: differenceInMinutes(new Date(nshift.checkout), now) < 1 ? 'second' : 'minute',
                                roundingMethod: 'ceil',
                                locale: es,
                            }
                        )
                    }}
                </span>
            </div>
            <!-- Si hay turnos corriendo y ya terminó el bloque -->
            <div v-else-if="rshift != null" class="timer">
                <span class="title">El turno terminó hace:</span>
                <span class="time" style="color: var(--red)">
                    {{ formatDistance(new Date(nshift.checkout), now, {locale: es}) }}
                </span>
            </div>
            <!--Si no hay turnos corriendo y el siguiente turno ya empezó-->
            <div v-else-if="new Date(nshift.checkin) <= now" class="timer">
                <span class="title">El turno empezó hace:</span>
                <span class="time" style="color: var(--red)">
                    {{ formatDistance(new Date(nshift.checkin), now, {locale: es}) }}
                </span>
            </div>
            <!--Si no hay turnos corriendo y el siguiente aún no empieza y es hoy-->
            <div v-else-if="isSameDay(new Date(nshift.checkin), now)" class="timer">
                <span class="title">Próximo turno en:</span>
                <span class="time">
                    {{ 
                        differenceInMinutes(new Date(nshift.checkin), now, {roundingMethod: 'ceil'}) > 60?
                            formatDuration(
                                intervalToDuration({
                                    start: now,
                                    end: new Date(nshift.checkin)
                                }),
                                {
                                    format: ['hours', 'minutes'],
                                    delimiter: ' y ',
                                    locale: es,
                                }
                            ):
                            formatDistanceStrict(
                                new Date(nshift.checkin),
                                now, 
                                {
                                    unit: differenceInMinutes(new Date(nshift.checkin), now) > 1? 'minute': 'second',
                                    roundingMethod: 'ceil',
                                    locale: es,
                                }
                            )
                    }}
                </span>
            </div>
            <!--Si no hay turnos corriendo y el siguiente aún no empieza y no es hoy-->
            <div v-else class="timer">
                <span class="title">Próximo turno el:</span>
                <span class="time">
                    {{ new Date(nshift.checkin).toLocaleString('es-ES', {weekday: 'long'}) }} {{ nshift.block }}
                </span>
            </div>
            <div>
                <!--Si no hay turnos corriendo-->
                <button class="button attendance_button"
                    v-if="rshift == null"
                    :disabled="!primo.onshift" 
                    v-on:click=" () => { if (primo.onshift) pushShift() }"
                >
                    INICIAR<br>
                    TURNO
                </button>
                <!--Si hay algún turno corriendo y el siguiente no es inmediato-->
                <button class="button attendance_button" style="background-color: var(--red);"
                    v-else-if="!primo.onshift || (rshift.block == ushift.block)"
                    v-on:click="updateShiftSafety"
                >
                    MARCAR<br>
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
        <!--
        <div class="box aligns">
            <button class="button aligns_button">
                REGISTROS
            </button>
            <button class="button aligns_button">
                ESTADÍSTICAS
            </button>
        </div>
        -->
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
    border: 2px solid var(--gray);
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
.timer {
    display: flex;
    flex-direction: column;
}
.timer > .title {
    text-align: center;
}
.timer > .time {
    font-size: 28px;
    text-align: center;
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
    background-color: var(--gray);
    cursor: default;
}
.attendance_button {
    padding: 0 1.5em;
}
.aligns_button {
    padding: 0 .65em;
}
</style>

<style scoped>
:deep(.modal-container) {
    display: flex;
    justify-content: center;
    align-items: center;
}
:deep(.modal-content) {
    max-width: 31rem;
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: 90%;
    margin: 0 1rem;
    padding: 1rem;
    border: 2px solid var(--gray);
    border-radius: 1rem;
    background: var(--color-background);
    gap: 1rem;
}
.modal__title {
    margin: 0 2rem 0 0;
    font-size: 1.5rem;
    font-weight: 700;
}
.modal__action {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
}
.modal__button {
    padding: .5rem 1rem;
}
.modal__button__cancel {
    background-color: var(--green);
}
.modal__button__confirm {
    background-color: transparent;
    color: var(--green)
}
.modal__button__confirm:hover {
    text-decoration: underline;
}
</style>
