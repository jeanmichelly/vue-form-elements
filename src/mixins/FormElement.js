export default {
    name: 'FormElement',

    props: {
        value: [String, Number, Boolean, File],
        errors: [Array, Object],
        persistAction: String,
        name: String,
        required: Boolean,
        defaultStyle: Boolean,
    },

    data: function () {
        return {
            id: _.uniqueId(),
            saving: false,
            saved: false,
        }
    },

    computed: {
        label: function () {
            return this.required ? this.$slots.default[0].text.trim() + '*' : this.$slots.default[0].text.trim()
        },

        isValid: function () {
            return Object.keys(this.errors).length > 0 && !this.errors[this.name]
        },

        isInvalid: function () {
            return this.errors[this.name]
        },
    },
}
