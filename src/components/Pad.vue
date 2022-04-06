<template>
    <div class="pad">
        <div class="box attendance">
                <div class="primo_onshift">
                    <span class="nickname">Marlos Cundaca</span>
                    <span>Pareja: Josexo Montacochinas</span>
                </div>
                <div>
                    <span>Próximo turno en:</span>
                    <div class="upcoming_shift">
                        <span>
                            <span class="time">0</span><span>d</span>
                        </span>
                        <span>
                            <span class="time">0</span><span>h</span>
                        </span>
                        <span>
                            <span class="time">02</span><span>m</span>
                        </span>
                    </div>
                </div>
            <div>
                <button class="button">
                    INICIAR TURNO
                </button>
            </div>
        </div>
        <div class="box aligns">
            <button class="button">
                REGISTROS
            </button>
            <button class="button">
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
    display: grid;
    gap: 1em;
    grid-template-rows: auto auto;
}
.text_container {
    flex: 1;
    display: flex;
}
.primo_onshift {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1em;
}
.nickname {
    font-size: 28px;
}
.upcoming_shift {
    display: grid;
    grid-template-columns: auto auto auto;
    grid-column-gap: .5em;
}
.time {
    font-size: 28px;
}
.button {
    background-color: var(--green);
    cursor: pointer;
    
    padding: 0 2.5em;
    border: 0;
    border-radius: 1em;
    height: 100%;
}
</style>