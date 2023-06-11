<script setup lang="ts">
import { useIsAuthenticated } from './composition-api/useIsAuthenticated';
import { useMsal } from "./composition-api/useMsal";
import { InteractionRequiredAuthError, InteractionStatus } from "@azure/msal-browser";
import { reactive, onMounted, watch } from 'vue'
import { loginRequest } from "./authConfig";
import { callMsGraph } from "./resources/MsGraphApiCall";

import Week from './components/Week.vue'
import Pad from './components/Pad.vue'
import ThickChevronDownIcon from "./components/icons/IconThickChevronDown.vue";
import ThickChevronDownUp from "./components/icons/IconThickChevronUp.vue";
import Attendance from './components/Attendance.vue';
import { url } from './resources/utils';

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
        state.data = await fetch(url + "primos/" + graphData.mail).then( (r: any) => {
            if (!r.ok)
                instance.logoutRedirect({ account: instance.getActiveAccount() })
            else
                return r.json()
        })
		state.resolved = true;
		stopWatcher();
	}
}

onMounted(() => {
	getGraphData();

    function preventDefault(e: any) {
        e.preventDefault();
    }

    function preventDefaultForScrollKeys(e: any) {
        let keys = {37: 1, 38: 1, 39: 1, 40: 1};
        // @ts-expect-error
        if (keys[e.keyCode]) {
            preventDefault(e);
            return false;
        }
    }

    let wheelOpt = { passive: false };
    let wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';
    window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
    window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
    window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
    window.addEventListener('keydown', preventDefaultForScrollKeys, false);
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
        class="content"
    >
        <div
            id="top"
            style="
                display: flex;
                place-items: center;
                height: 100%;
            "
        >
            <div style="width: 100%;">
                <Pad v-bind:primoInfo="state.data" />
                <Week />
            </div>
        </div>
        <a href="#bottom">
            <ThickChevronDownIcon class="icon" />
        </a>
        <a href="#top">
            <ThickChevronDownUp class="icon" />
        </a>
        <Attendance
            id="bottom"
            v-bind:primoInfo="state.data"
            style="height: 100%"
        />
    </div>
    <div v-else>:( Algo salió mal con el logeo de la cuenta</div>
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
    color: var(--white);
}

:root {
    --white: #fffaf0;
    --gray: #f5f5f533;
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
    -ms-overflow-style: none;
    scrollbar-width: none;
}

body::-webkit-scrollbar {
    display: none;
}

html {
    scroll-behavior: smooth;
}

header {
    line-height: 1.5;
}

</style>
<style scoped>
a {
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
}

.content {
    display: inline-grid;
    width: 100%;
    grid-template-rows: 90vh 10vh 10vh 90vh;
    align-items: center;
}

.icon {
    width: 100%;
    height: 60%;
}
</style>
