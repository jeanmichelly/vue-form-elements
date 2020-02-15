<template>
    <div
        class="form-group"
        :class="{'default': defaultStyle}"
    >
        <div>
            <input
                :id="id"
                class="form-control"
                :class="{'is-valid': isValid, 'is-invalid': isInvalid}"
                :value="value"
                :max="max"
                :min="min"
                :type="type"
                :maxlength="maxlength"
                :placeholder="placehoder"
                :disabled="disabled"
                :required="required"
                @input="$emit('input', $event.target.value)"
            >

            <label
                v-if="$slots.default"
                :for="id"
                :class="{ active: value || value === 0 || type === 'date' }"
            >
                {{ label }}
            </label>

            <i
                v-if="euros"
                class="fa fa-euro-sign select-arrow"
            />

            <i
                v-else-if="percents"
                class="fa fa-percent select-arrow"
            />
        </div>

        <BaseErrors :errors="errors[name]" />
    </div>
</template>

<script>
    import FormElement from '../mixins/FormElement'
    import BaseErrors from './BaseErrors'

    export default {
        name: 'FormInput',
        components: {BaseErrors},
        mixins: [FormElement],
        props: {
            placehoder: {type: String, default: ''},
            disabled: Boolean,
            type: {type: String, default: 'text'},
            min: {type: [String, Number], default: null},
            max: {type: [String, Number], default: null},
            maxlength: {type: Number, default: null},
            euros: Boolean,
            percents: Boolean,
        },
    }
</script>

<style scoped lang="scss">
    @import '../../sass/style';

    .default {
        input {
            width: 100%;
            height: 36px;
            border: 1px solid #d3d8de !important;
            padding-left: 12px;

            &[type=date] {
                padding-top: 5px;
            }
        }
    }
</style>
