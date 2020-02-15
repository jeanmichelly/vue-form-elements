<template>
    <div
        v-if="errors !== undefined"
        class="invalid-feedback d-block"
    >
        <span
            v-for="(error, key) of errors"
            :key="key"
        >
            {{ error }}
        </span>
    </div>
</template>

<script>
    export default {
        name: 'BaseErrors',
        props: {
            errors: {type: [Array, Object], default: null}
        }
    }
</script>

<style scoped>
    .invalid-feedback {
        margin-top: .25rem;
        font-size: 80%;
        color: #dc3545;
    }
</style>
