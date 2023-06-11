<script setup lang="ts">
import ChevronDownIcon from "./icons/IconChevronDown.vue";
</script>
<script lang="ts">
import { relativeTime, url } from "../resources/utils";
import { isSameDay, endOfDay } from 'date-fns'

const now = await fetch(url + "now").then(response => response.json());
const week = await fetch(url + "shifts/week").then(response => response.json())

export default {
    data() {
        return {
            time: now,
            week: week,
            
            timeLinePosition: 0,

            timeLineOffset: 0,
            blockWidth: 0,
            clockDisplayHeight: 0,
            ganttHeight: 0,

            requestDateInterval: 0,
            moveTimeLineInterval: 0,
        };
    },
    methods: {
        setDateTime() {
            fetch(url + "now").then(response => response.json()).then(now => {
                this.time = {
                    time: now.time,
                    datetime: now.datetime,
                };
            });
        },
        updateWeek() {
            fetch(url + "shifts/week").then(response => response.json()).then(w => this.week = w);
        },

        getExtension(checkin: string, checkout: string | null): number {
            let fixedCheckout: string | Date
            if (checkout != null)
                fixedCheckout = checkout
            else if (isSameDay(new Date(checkin), new Date(this.time.datetime)))
                fixedCheckout = this.time.datetime
            else
                fixedCheckout = endOfDay(new Date(checkin))
            return Math.max(1, getColumn(fixedCheckout) - getColumn(checkin))
        },
        
        setTimeLinePosition() {
            this.timeLinePosition = this.timeLineOffset + (this.blockWidth * relativeTime(new Date(this.time.datetime)));
        },
        calculeTimeLineArgs() {
            this.blockWidth = parseFloat(window.getComputedStyle(this.$refs.first_block_column as Element).width);
            this.clockDisplayHeight = parseFloat(window.getComputedStyle(this.$refs.clock_display as Element).height)
            
            const gantt = window.getComputedStyle(this.$refs.gantt as Element)
            this.ganttHeight = parseFloat(gantt.height)
            // Ancho de la columna + el border de .gantt + un offset para que coincida con los borders (.5 del borde)
            this.timeLineOffset = parseFloat(window.getComputedStyle(this.$refs.days_column as Element).width)
                                + (1.5 * parseFloat(gantt.borderWidth))
        }
    },
    created() {
        this.setDateTime();
        this.requestDateInterval = window.setInterval(this.setDateTime, 2000);
    },
    mounted() {        
        this.calculeTimeLineArgs();
        
        this.setTimeLinePosition();
        this.moveTimeLineInterval = window.setInterval(this.setTimeLinePosition, 2000);
        
        window.addEventListener("resize", this.calculeTimeLineArgs)
        window.addEventListener("resize", this.setTimeLinePosition)

        this.$emitter.on("update-week", () => this.updateWeek());
    },
    beforeUnmount() {
        clearInterval(this.requestDateInterval);
        clearInterval(this.moveTimeLineInterval);
        
        window.removeEventListener("resize", this.calculeTimeLineArgs)
        window.removeEventListener("resize", this.setTimeLinePosition)
    },
};

const getColumn = (checkin: string | Date) => Math.ceil(relativeTime(new Date(checkin))*30) + 1
</script>

<template>
    <div
        class="clock fade_in"
        style = "position: absolute;"
        :style="{ left: timeLinePosition + 'px', height: ganttHeight + clockDisplayHeight + 'px' }"
    >
        <div class="clock" ref="clock_display">
            <span class="time">{{ time.time }}</span>
            <ChevronDownIcon class="icon"/>
        </div>
        <div class="time_line" />
    </div>
    <div class="gantt" ref="gantt" :style="{ marginTop: clockDisplayHeight + 'px' }">
        <div class="gantt_columns">
            <div class="gantt__row-first" ref="days_column" />
            <span ref="first_block_column"></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>
        <div class="gantt__row gantt__row--months">
            <div class="gantt__row-first" />
            <span>1-2</span>
            <span>3-4</span>
            <span>5-6</span>
            <span>7-8</span>
            <span>9-10</span>
            <span>11-12</span>
            <span>13-14</span>
            <span>15-16</span>
        </div>
        <div class="gantt__row"
            v-for="(weekday, index) in ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']"
            :key="weekday"
        >
            <div class="gantt__row-first">
                {{ weekday }}
            </div>
            <ul class="gantt__row-bars">
                <li 
                    v-for="shift in week[index]"
                    :key="shift.id"
                    :style="{
                        'grid-column': getColumn(shift.checkin) + '/span ' + getExtension(shift.checkin, shift.checkout),
                        'background-color': 'var(--green)'
                    }"
                >
                    {{ shift.primo.nick }}&nbsp;&nbsp;&nbsp;
                </li>
            </ul>
        </div>
    </div>
</template>

<style scoped>
body, html {
    height: 100%;
}
.gantt {
    display: grid;
    border-radius: 1em;
    border: 2px solid var(--gray);
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    min-width: 55em;
    /*box-shadow: 0 75px 125px -57px #7e8f94;*/
}
.gantt__row {
    display: flex;
    /*background-color: #fff;*/
    padding: .5em 0;
}
.gantt__row:nth-child(odd) {
    background-color: #ffffff1a;
}
.gantt_columns {
    display: flex;
    position: absolute;
    height: 100%;
    width: 100%;
    background-color: transparent;
    /*grid-template-columns: 100px repeat(8, 1fr);*/
}
.gantt_columns span {
    flex: 1;
    display: block;
    border-left: 2px solid #ffffff1a;
    z-index: 1;
}
.gantt__row--months span {
    flex: 1;
    text-align: center;
    align-self: center;
    font-weight: bold;
}
.gantt__row-first {
    width: 7em;
    font-weight: bold;
    /*color: rgb(0, 0, 0);*/
    display: flex;
    justify-content: center;
    align-items: center;
}
.gantt__row-bars {
    flex: 1;
    /* vvv Esta estupidez es necesaria, no me pregunten por qué*/
    padding: 0;
    display: grid;
    grid-template-columns: repeat(240, 1fr);
    grid-gap: .25em 0;
    grid-auto-flow: column dense;
}
.gantt__row-bars li {
    text-align: right !important;
    padding: .25em 0;
    /*overflow: hidden;*/
    /*position: relative;*/
    /*scursor: pointer;*/
    border-radius: 1.5em;
    /*color: #fff;*/

    overflow: hidden;
    min-width: 0;
}
.clock {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 0;
    z-index: 1;
}
.time {
    font-size: 10px;
    background-color: var(--blue);
    vertical-align: middle;
    padding: 0 .5em;
    border-radius: 1.5em;
}
.icon {
    fill: var(--blue);
}
.time_line {
    flex: 1;
    border-right: 2px dashed var(--blue);
}

.fade_in {
    animation: fadeIn 1s;
    -webkit-animation: fadeIn 1s;
    -moz-animation: fadeIn 1s;
    -o-animation: fadeIn 1s;
    -ms-animation: fadeIn 1s;
}
@keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
}

@-moz-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
}

@-webkit-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
}

@-o-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
}

@-ms-keyframes fadeIn {
    0% {opacity:0;}
    100% {opacity:1;}
}
</style>
