import { createApp } from 'vue';
import App from './App.vue';

import mitt, { Emitter } from 'mitt';
import { msalPlugin } from "./plugins/msalPlugin";
import { msalInstance, loginRequest } from "./authConfig";
import { AuthenticationResult, EventType } from "@azure/msal-browser";

const app = createApp(App);

const emitter = mitt();
app.config.globalProperties.$emitter = emitter;

// Activar la cuenta si hay alguna ya registrada cuando se inicia la página
const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
    if (accounts.length > 1)
        console.warn(`Hay ${accounts.length} cuentas logeadas`)
    if (msalInstance.getActiveAccount() == null) {
        console.log(`Ninguna cuenta activa, iniciando sesión con ${accounts[0]}`)
        msalInstance.setActiveAccount(accounts[0]);
    }
}

msalInstance.addEventCallback((event) => {
    // Activar la cuenta cuando se logee
    if (event.eventType === EventType.LOGIN_SUCCESS && event.payload) {
        const payload = event.payload as AuthenticationResult;
        const account = payload.account;
        msalInstance.setActiveAccount(account);
    }
    // Solicitar logeo cuando cierras la cuenta
    else if (event.eventType === EventType.HANDLE_REDIRECT_END && msalInstance.getActiveAccount() == null)
        msalInstance.loginRedirect(loginRequest);
});

app.use(msalPlugin, msalInstance);
app.mount('#app');
