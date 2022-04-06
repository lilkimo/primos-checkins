<script setup lang="ts">
import Week from './components/Week.vue'
import Pad from './components/Pad.vue'
</script>

<template>
    <Pad />
    <Week />
</template>

<style>
@import './assets/base.css';

@import url("https://fonts.googleapis.com/css?family=Roboto:100,400,700");
* {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-family: "Roboto", sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: #fcf6f5;
}

:root {
    --white: #fffaf0;
    --green: #2bae66;
}

#app {
    width: 60%;
    margin: 0 auto;
    font-weight: normal;
}

body {
    display: flex;
    place-items: center;
}

header {
    line-height: 1.5;
}
</style>
