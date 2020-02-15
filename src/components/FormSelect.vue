<template>
    <div
        v-if="options.length > 0"
        ref="container"
        class="form-group form-group-select"
        :class="{'default': defaultStyle}"
        @keyup.esc="close"
        @keydown.enter.stop.prevent="selectCurrent"
        @keydown.tab="pressTab"
        @keydown.backspace="removeLastElem"
        @keyup.down="incrementPointer"
        @keyup.up="decrementPointer"
    >
        <div class="position-relative">
            <fieldset
                :id="id"
                class="form-control base-select"
                :class="{searching: searching, 'is-valid': isValid && displayIconError, 'is-invalid': isInvalid && displayIconError}"
                :disabled="disabled"
                @click="clickIn"
            >
                <div
                    class="w-100"
                    style="overflow: hidden"
                >
                    <template v-if="multiple">
                        <transition-group name="fade">
                            <span
                                v-for="(selectedValue, key) of selected"
                                :key="key"
                                class="badge badge-primary"
                            >
                                <slot name="icon" />

                                {{ findLabel(selectedValue) }}
                                <i
                                    class="fa fa-times"
                                    @click="removeSelected(key)"
                                />
                            </span>
                        </transition-group>
                    </template>

                    <input
                        ref="searchInput"
                        v-model="display"
                        type="text"
                        :style="{width: inputWidth}"
                        :readonly="!useSearch"
                        @focus="open"
                        @click="clickIn"
                        @input="input($event.target.value)"
                    >
                </div>
            </fieldset>

            <label
                :for="id"
                :class="{active: searching || (!multiple && display) || selected.length, searching: searching}"
                @click="clickIn"
            >
                <slot />
            </label>

            <transition name="fade">
                <i
                    v-if="searching && useSearch && !filtering"
                    key="down"
                    class="select-arrow fa fa-search"
                />

                <i
                    v-else-if="searching && useSearch && filtering"
                    key="down"
                    class="select-arrow fa fa-circle-notch fa-spin"
                />

                <i
                    v-else-if="!displayIconError"
                    key="search"
                    class="select-arrow fa fa-chevron-down"
                />
            </transition>
        </div>

        <div
            v-if="searching"
            class="select-dropdown"
        >
            <div
                v-for="(option, key) in filteredOptions"
                :key="key"
                class="dropdown-item"
                :class="{active: key === pointer}"
                @mouseover="pointer = key"
                @mouseout="pointer = pointer === key ? null : pointer"
            >
                <img
                    v-if="option.img"
                    :src="option.img"
                >
                <span
                    class="label"
                    :class="{active: key === pointer, disabled: isDisabled(option)}"
                    @click="select(option)"
                >
                    {{ option.label }}
                </span>

                <span
                    v-if="$slots.action && isDisabled(option)"
                    style="float:right"
                    @click="$emit('action-option', option)"
                >
                    <slot name="action" />
                </span>
            </div>
        </div>

        <FormErrors :errors="errors[name]" />
    </div>

    <BaseLoader v-else-if="loading" />

    <div
        v-else
        class="note note-info-no-results"
    >
        You do not have {{ realName }}.
    </div>
</template>

<script>
    import FormElement from '../mixins/FormElement'
    import BaseLoader from './BaseLoader'
    import FormErrors from './BaseErrors'

    export default {
        name: 'FormSelect',
        components: {BaseLoader, FormErrors},
        mixins: [FormElement],
        props: {
            value: {type: [String, Number, Array], default: null},
            options: {type: Array, default: () => []},
            src: {type: String, default: null},
            fetched: {type: Array, default: () => []},
            disabled: Boolean,
            multiple: Boolean,
            noSearch: Boolean,
            realName: {type: String, default: ''},
            loading: {type: Boolean, default: false},
        },

        data: function () {
            return {
                searching: false,
                display: null,
                filteredOptions: _.cloneDeep(this.options),
                fetchedOptions: _.cloneDeep(this.fetched),
                pointer: null,
                filtering: false,
                displayIconError: false,
            }
        },

        computed: {
            /**
             * Calculate the width dynamically in relation to the input
             * @return String
             */
            inputWidth: function () {
                return (this.display.length + 1) + 'em'
            },

            /**
             * Use the research
             */
            useSearch: function () {
                return (!this.noSearch && this.options.length >  5) || this.src !== null
            },

            /**
             * Get selected values for multiple
             */
            selected: function () {
                return this.multiple && this.value ? this.value : []
            },

            /**
             * Label to display
             * @return String
             */
            label: function () {
                let val = this.value !== null && this.value !== undefined ? this.value : ''
                return this.multiple ? '' : this.findLabel(val)
            },
        },

        watch: {
            /**
             * Changes made on the value
             */
            value: function () {
                if (!this.multiple) {
                    this.searching = false
                }
                this.display = this.label
            },

            /**
             * Update of options filtered during changing of options
             */
            options: function () {
                this.initOptions()
                this.display = this.label
            },

            errors: function () {
                if (!this.errors) {
                    this.displayIconError = true
                }
            },
        },

        created: function () {
            this.display = this.label
        },

        /**
         * Set up a listener on click out
         */
        mounted: function () {
            document.addEventListener('click', this.clickOut)
        },

        /**
         * Remove the listener before to destroy the object
         */
        beforeDestroy: function () {
            document.removeEventListener('click', this.clickOut)
        },

        methods: {
            /**
             * Find the label of an option from his value
             * @param value
             * @return String
             */
            findLabel: function (value) {
                let option = this.fetchedOptions.find(option => option.value === value)

                if (!option) {
                    option = this.options.find(option => option.value === value)
                }

                return option ? option.label : ''
            },

            /**
             * Open the research
             */
            open: function () {
                if (!this.searching) {
                    this.displayIconError = false
                    if (this.useSearch) {
                        this.display = ''
                    }

                    this.searching = true
                    this.$refs.searchInput.focus()
                    this.initOptions()
                }
            },

            /**
             * Click on the select
             */
            clickIn: function () {
                if (!this.searching) {
                    this.open()
                } else if (!this.useSearch && !this.multiple) {
                    this.close()
                } else {
                    this.$refs.searchInput.focus()
                }
            },

            /**
             * Close the research
             */
            close: function () {
                if (this.searching) {
                    this.$refs.searchInput.blur()
                    this.searching = false
                    this.display = this.label
                    this.pointer = null
                }
            },

            /**
             * Close when a click on the document
             */
            clickOut: function (event) {
                if (event.target !== null && event.target.closest('.form-group') !== this.$refs.container) {
                    this.close()
                }
            },

            /**
             * Triggered when input for search
             */
            input: function (value) {
                this.filtering = true
                this.filter(value)
            },

            /**
             * Filter the options according to the research
             * @param value
             */
            filter: _.debounce(async function (value) {
                let options = this.src ? await this.fetchFromSource(value) : []

                this.filteredOptions = _.cloneDeep(this.options)
                    .filter(option => option.label.toLowerCase().includes(value.toLowerCase()))
                    .concat(options)

                this.pointer = null
                this.filtering = false
            }, 500),

            /**
             * Initialize the options
             */
            initOptions: async function () {
                let options = this.src ? await this.fetchFromSource('') : []
                this.filteredOptions = _.cloneDeep(this.options).concat(options)
            },

            /**
             * Select an option
             */
            select: function (option) {
                if (option.fetched) {
                    this.fetchedOptions.push(option)
                }

                if (this.multiple) {
                    this.$refs.searchInput.focus()
                    let values = this.selected
                    values.push(option.value)
                    this.$emit('input', values)
                    this.initOptions()
                } else {
                    this.$emit('input', option.value)
                }
            },

            /**
             * Remove an option of multiselect
             */
            removeSelected: function (key) {
                let selected = this.selected
                selected.splice(key, 1)
                this.$emit('input', selected)
            },

            /**
             * Remove the last element selected
             */
            removeLastElem: function () {
                if (this.display === '' && this.selected.length) {
                    this.removeSelected(this.selected.length - 1)
                }
            },

            /**
             * Return true if the option is disabled
             */
            isDisabled: function (option) {
                if (this.multiple) {
                    return this.selected.includes(option.value)
                } else {
                    return option.value === this.value || this.value === ''
                        && (option.value === null || option.value === undefined)
                }
            },

            /**
             * Select the pointer
             */
            selectCurrent: function () {
                if (this.pointer !== null)  {
                    this.select(this.filteredOptions[this.pointer])
                    this.pointer = null
                }
            },

            /**
             * Action while a tabulation
             */
            pressTab: function () {
                this.selectCurrent()
                this.close()
            },

            /**
             * Increment the pointer
             */
            incrementPointer: function () {
                if (this.pointer < this.filteredOptions.length - 1) {
                    let i = this.pointer === null ? -1 : this.pointer

                    do {
                        i++
                    } while (i < this.filteredOptions.length && this.isDisabled(this.filteredOptions[i]))

                    if (i < this.filteredOptions.length) {
                        this.pointer = i
                    }
                }
            },

            /**
             * Decrement the pointer
             */
            decrementPointer: function () {
                if (this.pointer > 0) {
                    let i = this.pointer

                    do {
                        i--
                    } while (i >= 0 && this.isDisabled(this.filteredOptions[i]))

                    if (i >= 0) {
                        this.pointer = i
                    }
                }
            },

            /**
             * Get options from source
             */
            fetchFromSource: async function (search) {
                this.filtering = true
                try {

                    const response = await axios.get(this.src, {params: {search}})

                    let options = response.data.data

                    for (let option of options) {
                        option.fetched = true
                    }

                    return options
                } catch (e) {
                    return []
                } finally {
                    this.filtering = false
                }
            }
        }
    }
</script>

<style scoped lang="scss">
    @import '../../sass/variables';

    .base-select {
        padding-right: 30px;
        padding-top: 0.5rem !important;
        height: auto;
        cursor: default;

        div {
            padding-top: 3px;
        }

        .badge {
            margin-right: 5px;
        }

        input {
            overflow: hidden;
            max-width: 100%;
            display: inline;
            -webkit-appearance: none;
            -moz-appearance: none;
            border: none;
            font-size: 14px;
            cursor: default;
            width: auto;
            outline: none;
        }

        &:focus + label, & + label.active {
            font-size: .8rem;
            transform: translateY(-150%);
            opacity: 1;
        }
    }

    .select-dropdown {
        max-height: 180px;
        overflow-y: auto;
        position: absolute;
        width: 100%;
        background-color: #fff;
        z-index: 9999;
        border: 1px solid $gray-border !important;
        border-bottom-right-radius: 0.25rem !important;
        border-bottom-left-radius: 0.25rem !important;

        .dropdown-item {
            min-height: 30px;
            cursor: default;

            img {
                width: 30px;
            }

            .label {
                display: inline-block;
                width: 90%;

                &.disabled {
                    color: #6c757d;
                    pointer-events: none;
                    background-color: transparent;
                }
            }

            &.active .fa-file-image{
                color: $white-text;
            }

            .fa-file-image {
                color: $primary;

                &:hover {
                    cursor: pointer;
                }
            }

            &:hover {
                background: none;
            }

            &.active {
                background-color: $primary;
                color: $white-text;
            }
        }
    }

    .select-arrow {
        position: absolute;
        right: 10px;
        bottom: 12px;
        color: $gray-text;
        pointer-events: none;
    }

    .fa-spin {
        font-size: 20px;
        right: 6px;
        bottom: 8.5px;
    }

    .fa-times {
        margin-left: 0.5rem !important;
        opacity: 0.8;

        &:hover {
            cursor: pointer;
            opacity: 1;
        }
    }

    .default {
        .position-relative {
            height: 27px;
        }

        .select-dropdown {
            margin-top: 8px;
        }

        .form-control {
            padding-top: 4px !important;
            border: 1px solid #d3d8de;
        }

        .select-arrow {
            bottom: 3px;
        }
    }
</style>
