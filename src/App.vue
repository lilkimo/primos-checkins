<script setup lang="ts">
import { useIsAuthenticated } from './composition-api/useIsAuthenticated';
import { useMsal } from "./composition-api/useMsal";
import { InteractionRequiredAuthError, InteractionStatus } from "@azure/msal-browser";
import { reactive, onMounted, watch } from 'vue'
import { loginRequest } from "./authConfig";
import { callMsGraph } from "./utils/MsGraphApiCall";

import Week from './components/Week.vue'
import Pad from './components/Pad.vue'

const isAuthenticated = useIsAuthenticated();

const { instance, inProgress } = useMsal();
const state = reactive({
	resolved: false,
	data: {}
});

async function getGraphData() {
    const response = await instance.acquireTokenSilent({
        ...loginRequest
    }).catch(async (e) => {
        if (e instanceof InteractionRequiredAuthError) {
            await instance.acquireTokenRedirect(loginRequest);
        }
        throw e;
    });
	if (inProgress.value === InteractionStatus.None) {
		const graphData = await callMsGraph(response.accessToken);
        state.data = await fetch("http://127.0.0.1:8000/api/primos/" + graphData.mail).then(response => response.json())
		state.resolved = true;
		stopWatcher();
	}
}

onMounted(() => {
	getGraphData();
});

const stopWatcher = watch(inProgress, () => {
    if (!state.resolved) {
		getGraphData();
	}
});
</script>

<template>
    <div
        v-if="isAuthenticated && state.resolved"
    >
        <Pad v-bind:primoInfo="state.data" />
        <Week />
    </div>
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
    --red: #ff645b;
    --yellow: #fbc50d;
    --blue: #0075ff;
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
