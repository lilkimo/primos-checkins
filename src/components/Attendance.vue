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

import { dayName, url } from "../resources/utils";
import { getDatapoints, getGradient, options } from '../resources/attendance-data'
import { ref } from 'vue';
import IconOk from './icons/IconOk.vue';
import IconHelp from './icons/IconHelp.vue';
import IconCancel from './icons/IconCancel.vue';
import IconClock from './icons/IconClock.vue';

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

const date = ref()
const selected = ref()

const primos = await fetch(url + "primos").then(response => response.json());

export default defineComponent({
    components: { Line, Datepicker, IconOk, IconHelp, IconCancel, IconClock },
    props: {
        primoInfo: Object
    },
    data() {
        return {
            shifts: {
                ideal: NaN,
                inSchedule: NaN,
                suspicious: NaN,
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
                this.shifts.ideal = r.ideal
                this.shifts.inSchedule = r.inSchedule.length
                this.shifts.suspicious = r.suspicious.length
                this.data.labels = r.labels
                this.data.datasets[0].data = r.datapoints.map( (p: number) => p === null? NaN: p)
            })
        }
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
        const format = (dates: Date[]) => dates.filter( d => d !== null ).map( date => {
            const day = date.getDate()
            const month = date.getMonth() + 1
            const year = date.getFullYear()

            return `${day}/${month}/${year}`
        }).join(" - ")
        return {
            dayName,
            date,
            selected,
            format,
            options,
            primos,
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
                    :format="format"
                    :dayNames="(_: string, weekStart: number) => dayName(weekStart)"
                    :clearable=false
                    :enableTimePicker=false
                />
            </div>
            <div class="side">
                <div class="line">
                    <IconClock class="icon" /> {{ shifts.ideal }}
                </div>
                <div class="line">
                    <IconOk class="icon" /> {{ shifts.inSchedule }}
                </div>
                <div class="line">
                    <IconCancel class="icon" /> {{ shifts.ideal - shifts.inSchedule }}
                </div>
                <div class="line">
                    <IconHelp class="icon" /> {{ shifts.suspicious }}
                </div>
            </div>
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
}

.line {
    height: 100%;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.icon {
    height: 75%;
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
