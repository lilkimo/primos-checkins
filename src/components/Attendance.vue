<script lang="ts">
import { defineComponent } from 'vue'

import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    Plugin
} from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'

import Datepicker from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

// @ts-expect-error
import { $vfm, VueFinalModal, ModalsContainer } from 'vue-final-modal'

import { format, differenceInMinutes, differenceInMilliseconds } from 'date-fns'

import { dayName, url } from "../resources/utils";
import { getDatapoints, getGradient, options } from '../resources/attendance-data'
import { ref } from 'vue';
import IconOk from './icons/IconOk.vue';
import IconHelp from './icons/IconHelp.vue';
import IconCancel from './icons/IconCancel.vue';
import IconClock from './icons/IconClock.vue';
import IconClose from './icons/IconClose.vue';

ChartJS.defaults.font.size = 14
ChartJS.defaults.font.family = "Roboto"
ChartJS.defaults.font.weight = "600"
ChartJS.defaults.color = "#fffaf0"
ChartJS.register(
    Title,
    Tooltip,
    Legend,
    LineElement,
    LinearScale,
    PointElement,
    CategoryScale,
    annotationPlugin,
)

enum ShiftStatus {
    Stamped,
    Suspicious,
    Missed,
}

const parseDate = (s: {start: string, end: string, checkin: string | null, checkout: string | null}) => {
    const dates = {
        start: new Date(s.start),
        end: new Date(s.end),
    }
    if (s.checkin === null)
        Object.assign(dates, {
            checkin: dates.start,
            checkout: dates.end,
        })
    else
        Object.assign(dates, {
            checkin: new Date(s.checkin),
            checkout: s.checkout === null? null: new Date(s.checkout),
        })
    return Object.assign(s, dates)
}

const date = ref()
const selected = ref()

const primos = await fetch(url + "primos").then( r => r.json() );
primos.sort( (a: any, b: any) => {
    if (a.nick > b.nick)
        return 1
    if (a.nick < b.nick)
        return -1;
    return 0;
})

export default defineComponent({
    components: {
        IconOk, IconHelp, IconCancel, IconClock, IconClose,// Iconos
        Line, // chart.js
        Datepicker, //vue-chartjs
        // @ts-ignore
        VueFinalModal, ModalsContainer, // vue-final-modal
    },
    props: {
        primoInfo: {}
    },
    data() {
        return {
            showModal: false,
            modalHeight: 0,//calculeModalHeight(),
            attendance: {
                scheduled: [],
                stamped: [],
                suspicious: [],
                shifts: new Array<{status: ShiftStatus, block: string, start: Date, end: Date, checkin: Date, checkout: Date}>(),
            },
            data: {
                labels: [],
                datasets: [
                    {
                        data: [],
                        borderColor: '#2bae66',
                        backgroundColor: function(context: any) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                    
                            if (!chartArea) {
                                // This case happens on initial chart load
                                return;
                            }
                            return getGradient(ctx, chartArea);
                        },
                        fill: true,
                        cubicInterpolationMode: 'monotone',
                        tension: 0.4
                    }
                ]
            },
        }
    },
    methods: {
        updateDatapoints() {
            if (date.value.length === undefined)
                date.value = [date.value, date.value]
            getDatapoints(selected.value, date.value[0], date.value[1]).then( r => {
                this.data.labels = r.labels
                this.data.datasets[0].data = r.datapoints.map( (p: number) => p?? NaN)
                
                this.attendance.scheduled =
                    r.shifts
                        .map(parseDate)
                        .map( (s: Object) => Object.assign(s, {status: ShiftStatus.Missed}) )
                this.attendance.stamped =
                    this.attendance.scheduled
                        .filter( (s: {id: number}) => s.id !== null )
                        .map( (s: Object) => Object.assign(s, {status: ShiftStatus.Stamped}) )
                this.attendance.suspicious =
                    r.suspicious
                        .map(parseDate)
                        .map( (s: Object) => Object.assign(s, {status: ShiftStatus.Suspicious}) )
                
                this.attendance.shifts = [...this.attendance.scheduled, ...this.attendance.suspicious]
                this.attendance.shifts.sort( (s1: {checkin: Date}, s2: {checkin: Date}) => differenceInMilliseconds(s1.checkin, s2.checkin) )
            })
        },
    },
    mounted() {
        const startDate = new Date()
        const day = startDate.getDay()
        startDate.setDate(startDate.getDate() - day + (day == 0 ? -6:1))
        startDate.setHours(0)
        startDate.setMinutes(0)
        startDate.setSeconds(0)
        startDate.setMilliseconds(0)
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 7)
        endDate.setMilliseconds(-1)
        
        selected.value = this.primoInfo.mail
        date.value = [startDate, endDate]
        this.updateDatapoints()
    },
    setup() {
        const datePickerFormat = (dates: Date[]) => dates?.filter( d => d !== null ).map( date => {
            const day = date.getDate()
            const month = date.getMonth() + 1
            const year = date.getFullYear()

            return `${day}/${month}/${year}`
        }).join(" - ")
        return {
            dayName,
            date,
            selected,
            datePickerFormat,
            options,
            primos,

            ShiftStatus,
            format,
            differenceInMinutes,
        }
    },
})
</script>

<template>
    <div class="container">
        <div class="info">
            <div class="side">
                <select
                    style="height: 100%"
                    v-model="selected"
                    v-on:change="updateDatapoints()"
                >
                    <option v-for="primo in primos" :value="primo.mail">
                        {{ primo.nick }}
                    </option>
                </select>
                <Datepicker
                    class="datepicker"
                    dark
                    v-model="date"
                    v-on:update:modelValue="updateDatapoints()"
                    modelAuto
                    range
                    :format="datePickerFormat"
                    :dayNames="(_: string, weekStart: number) => dayName(weekStart)"
                    :clearable=false
                    :enableTimePicker=false
                />
            </div>
            <div
                class="side"
                v-on:click="showModal = true"
            >
                <div class="line">
                    <IconClock class="icon" /> {{ attendance.scheduled.length }}
                </div>
                <div class="line">
                    <IconOk class="icon" /> {{ attendance.stamped.length }}
                </div>
                <div class="line">
                    <IconCancel class="icon" /> {{ attendance.scheduled.length - attendance.stamped.length }}
                </div>
                <div class="line">
                    <IconHelp class="icon" /> {{ attendance.suspicious.length }}
                </div>
            </div>
            <vue-final-modal v-model="showModal" classes="modal-container" content-class="modal-content">
                <div class="modal__action">
                    <span
                        id="modal_title"
                        class="modal__title"
                    >
                        Turnos de {{ primos.find( (p: {mail: string}) => p.mail == selected )?.nick }} ({{ datePickerFormat(date) }})
                    </span>
                    <!-- <button class="button modal__button modal__button__cancel" @click="showModal = false">CANCELAR</button> -->
                    <IconClose class="icon" style="cursor: pointer;" v-on:click="showModal = false"/>
                </div>
                <div class="grid_container">
                    <span class="grid_item grid_header">
                        <span />
                        <span>Fecha</span>
                        <span>Turno</span>
                        <span>Entrada</span>
                        <span>Salida</span>
                    </span>
                    <span
                        class="grid_item"
                        v-for="shift in attendance.shifts"
                    >
                        <IconOk
                            v-if="shift.status == ShiftStatus.Stamped"
                            class="icon"
                        />
                        <IconHelp
                            v-else-if="shift.status == ShiftStatus.Suspicious"
                            class="icon"
                        />
                        <IconCancel
                            v-else-if="shift.status == ShiftStatus.Missed"
                            class="icon"
                        />
                        <span>{{ format(shift.start, "dd/MM") }}</span>
                        <span>{{ shift.start.toLocaleString("es-ES", {weekday: "short"}) }} {{shift.block}}</span>
                        <span v-if="shift.status == ShiftStatus.Missed">{{ format(shift.checkin, "H:mm") }}</span>
                        <span v-else>
                            {{ format(shift.checkin, "H:mm") }}
                            (<span
                                style="color: var(--green)"
                                v-if="differenceInMinutes(shift.start, shift.checkin) >= 0"
                            >+{{ differenceInMinutes(shift.start, shift.checkin) }}
                            </span>
                            <span
                                style="color: var(--red)"
                                v-else
                            >
                                {{ differenceInMinutes(shift.start, shift.checkin) }}
                            </span>)
                        </span>
                        <span v-if="shift.status == ShiftStatus.Missed">{{ format(shift.checkout, "H:mm") }}</span>
                        <span v-else-if="shift.checkout != null">
                            {{ format(shift.checkout, "H:mm") }}
                            (<span
                                style="color: var(--green)"
                                v-if="differenceInMinutes(shift.end, shift.checkout) >= 0"
                            >+{{ differenceInMinutes(shift.end, shift.checkout) }}
                            </span>
                            <span
                                style="color: var(--red)"
                                v-else
                            >
                                {{ differenceInMinutes(shift.end, shift.checkout) }}
                            </span>)
                        </span>
                        <span v-else />
                    </span>
                </div>
            </vue-final-modal>
        </div>
        <Line :height="200" :chartData="(data as any)" :chart-options="(options as any)"/>
    </div>
</template>

<style scoped>
.container {
    display: flex;
    flex-direction: column;
    justify-content: center;
}

.info {
    display: inline-flex;
    justify-content: space-between;
    padding: 0px 0px 0px 58px;
}

.side {
    display: inline-flex;
    align-items: center;
    gap: 20px;
    cursor: pointer;
}

.line {
    height: 100%;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.icon {
    height: 2em;
}

select {
    background-color: var(--color-background);
    border-radius: 4px;
    border-color: var(--gray);
    padding: 0px 3px 0px 12px;
    cursor: pointer;
    transition: all 0.1s ease-out;
}

select:hover {
    border-color: var(--white);
}

.datepicker {
    width: 205px;
}
</style>

<style>
.dp__theme_dark {
    --dp-background-color: var(--color-background);
    --dp-text-color: var(--white);
    --dp-hover-color: var(--gray);
    --dp-hover-text-color: var(--white);
    --dp-primary-color: var(--green);
    --dp-primary-text-color: var(--white);
    --dp-secondary-color: var(--gray);
    --dp-border-color: var(--gray);
    --dp-menu-border-color: var(--gray);
    --dp-border-color-hover: var(--white);
    --dp-success-color: var(--green);
}
</style>

<style scoped>
:deep(.modal-container) {
    display: flex;
    justify-content: center;
    align-items: center;
}
:deep(.modal-content) {
    position: relative;
    display: flex;
    flex-direction: column;
    max-height: 90%;
    width: 40%;
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
    justify-content: space-between;
    gap: 1rem;
}
.modal__button {
    padding: .5rem 1rem;
}
.modal__button__cancel {
    background-color: var(--green);
}

.grid_container {
    display: grid;
    overflow: auto;
}
.grid_item { 
    display: grid;
    grid-template-columns: 1fr 2fr 2fr 2fr 2fr;
    gap: 0px 0px;
    grid-auto-flow: row;

    align-items: center;
    padding: .5rem 0;
    border-bottom: 2px solid var(--gray);
}

.grid_header {
    position: sticky;
    top: 0;
    background-color: var(--color-background);
    z-index: 1;
}
</style>
