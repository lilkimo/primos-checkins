<script setup lang="ts">
import ChevronDownIcon from "./icons/IconChevronDown.vue";
</script>
<script lang="ts">
import { relativeTime } from "../resources/utils";

const url = "http://worldtimeapi.org/api/timezone/America/Santiago";
const date = new Date(await fetch(url).then(response => response.json()).then(data => data.datetime));
const dataProperties = {minimumIntegerDigits: 2, useGrouping: false};



export default {
    data() {
        return {
            time: {
                hours: date.getHours().toLocaleString('en-US', dataProperties),
                minutes: date.getMinutes().toLocaleString('en-US', dataProperties),
                dateTime: date,
            },
            timeLinePosition: 0,

            requestDateInterval: 0,
            moveTimeLineInterval: 0,
            timeLineOffset: 0,
            blockWidth: 0,
        };
    },
    methods: {
        setDateTime() {
            fetch(url).then(response => response.json()).then(data => {
                const date = new Date(data.datetime);
                this.time = {
                    hours: date.getHours().toLocaleString('en-US', dataProperties),
                    minutes: date.getMinutes().toLocaleString('en-US', dataProperties),
                    dateTime: date,
                };
            });
        },
        setTimeLinePosition() {
            this.timeLinePosition = this.timeLineOffset + (this.blockWidth * relativeTime(this.time.dateTime));
        },
    },
    created() {
        this.setDateTime();
        this.requestDateInterval = setInterval(this.setDateTime, 2000);
    },
    mounted() {
        // Ancho de la columna + el border de .gantt + un offset para que coincida con los borders
        this.timeLineOffset = parseFloat(window.getComputedStyle(this.$refs.days_column as Element).width) + 2 + 1;
        this.blockWidth = parseFloat(window.getComputedStyle(this.$refs.first_block_column as Element).width);
        
        this.setTimeLinePosition();
        this.moveTimeLineInterval = setInterval(this.setTimeLinePosition, 2000);
    },
    beforeUnmount() {
        clearInterval(this.requestDateInterval);
        clearInterval(this.moveTimeLineInterval);
    },
};
function getColumn(date: Date): number {
    return Math.round(relativeTime(date)*30);
}
</script>


<template>
    <div class="clock fade_in" :style="{ left: timeLinePosition + 'px' }">
        <span class="time">{{ time.hours }}:{{ time.minutes }}</span>
        <ChevronDownIcon class="icon"/>
        <div class="time_line" />
    </div>
    <div class="gantt">
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
        <div class="gantt__row">
            <div class="gantt__row-first">
                Lunes
            </div>
            <ul class="gantt__row-bars">
                <li style="grid-column: 1/span 60; background-color: #2ecaac;">Zarko&nbsp;&nbsp;&nbsp;</li>
                <li style="grid-column: 31/span 60; background-color: #2ecaac;">Joséxo&nbsp;&nbsp;&nbsp;</li>
            </ul>
        </div>
        <div class="gantt__row gantt__row--empty">
            <div class="gantt__row-first">
                Martes
            </div>
            <ul class="gantt__row-bars">
                <li style="grid-column: 164/span 55; background-color: #2ecaac;">Jeremy&nbsp;&nbsp;&nbsp;</li>
                <li style="grid-column: 159/span 100; background-color: #2ecaac;">Joséxo&nbsp;&nbsp;&nbsp;</li>
            </ul>
        </div>
        <div class="gantt__row">
            <div class="gantt__row-first">
                Miércoles
            </div>
            <ul class="gantt__row-bars">
                <li style="grid-column: 33/span 76; background-color: #2ecaac;">Zarko&nbsp;&nbsp;&nbsp;</li>
                <li style="grid-column: 79/span 67; background-color: #2ecaac;">Jeremy&nbsp;&nbsp;&nbsp;</li>
            </ul>
        </div>
        <div class="gantt__row">
            <div class="gantt__row-first">
                Jueves
            </div>
            <ul class="gantt__row-bars">
                <li style="grid-column: 53/span 20; background-color: #2ecaac;">Joséxo&nbsp;&nbsp;&nbsp;</li>
                <li style="grid-column: 42/span 40; background-color: #54c6f9;">Carlangas&nbsp;&nbsp;&nbsp;</li>
            </ul>
        </div>
        <div class="gantt__row">
            <div class="gantt__row-first">
                Viernes
            </div>
            <ul class="gantt__row-bars">
                <li style="grid-column: 188/span 50; background-color: #54c6f9;">Carlangas&nbsp;&nbsp;&nbsp;</li>
                <li style="grid-column: 200/span 40; background-color: #2ecaac;">Jeremy&nbsp;&nbsp;&nbsp;</li>
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
    border: 2px solid #f5f5f533;
    position: relative;
    overflow: hidden;
    box-sizing: border-box;
    min-width: 55em;
    margin: 2em 0 0 0;
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
    position: absolute;
    height:100%;
    width: 0;
    /*left: 400px;*/
    z-index: 1;
}
.time {
    font-size: 10px;
    background-color: rgb(25, 0, 255);
    vertical-align: middle;
    padding: 0 .5em;
    border-radius: 1.5em;
}
.icon {
    color: rgb(25, 0, 255);
}
.time_line {
    flex: 1;
    border-right: 2px dashed rgb(25, 0, 255);
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
