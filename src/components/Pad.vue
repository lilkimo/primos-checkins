<template>
    <div class="box">
        <div class="text_container">
            <span class="nickname">Jeremy</span>
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
        <button class="button">
            Anachi
        </button>
    </div>
</template>

<style scoped>
.box {
    display: flex;
    justify-content: space-evenly;
    align-items: stretch;
    width: 100%;
    border-radius: 1em;
    border: 2px solid #f5f5f533;
}
.text_container {
    display: flex;
    flex-direction: column;
    align-items: center;
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
    background-color: #2ecaac;
    cursor: pointer;
    /*aspect-ratio: 1/1*/;
}
</style>