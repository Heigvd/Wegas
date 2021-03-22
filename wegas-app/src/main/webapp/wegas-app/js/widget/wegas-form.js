/*
 * Wegas
 *
 * http://wegas.albasim.ch
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-form', function(Y) {
    'use strict';
    var FORM = 'form', inputEx = Y.inputEx, Wegas = Y.Wegas, Form;

    /**
     * @name Y.Wegas.Form
     * @class  Class to submit a form, add a toolbar with buttons "submit" and
     * "cancel" to mangae forms.
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @constructor
     */
    Form = Y.Base.create(
        'wegas-form',
        Y.Widget,
        [Y.WidgetChild, Wegas.Widget, Wegas.Editable],
        {
            /**
         * @lends Y.Wegas.Form#
         */

            // ** Lifecycle Methods ** //
            /**
         * @function
         * @private
         * @description plug a toolbar and publich "submit" event.
         */
            initializer: function() {
                this.plug(Y.Plugin.WidgetToolbar);
                this.publish('submit', {
                    emitFacade: true
                });
                this.publish('updated', {
                    emitFacade: false
                });
            },
            /**
         * @function
         * @private
         * @description
         */
            renderUI: function() {
                Y.Array.each(this.get('buttons'), this.addButton, this);
                this.get('contentBox').on(
                    'key',
                    this.save,
                    'down:83+ctrl',
                    this
                ); // ctrl-s shortcut
            },
            /**
         * @function
         * @private
         * @description call function "renderToolbar".
         */
            syncUI: function() {
                this.set('cfg', this.get('cfg'));
            },
            /**
         * @function
         * @private
         * @returns {undefined}
         */
            destructor: function() {
                this.set(FORM, null);
            },
            addButton: function(b) {
                switch (b.action) {
                    case 'submit':
                        b.on = {
                            click: Y.bind(this.save, this)
                        };
                        break;
                    default:
                        b.on = {
                            click: Y.bind(
                                function(action) {
                                    this.fire(action);
                                },
                                this,
                                b.action
                            )
                        };
                        break;
                }
                this.toolbar.add(new Wegas.Button(b));
            },
            /**
         * @function
         * @private
         * @description set the given form to null
         */
            destroyForm: function() {
                this.set(FORM, null);
            },
            setCfg: function(val) {
                var cfg = Y.clone(val); // Duplicate so val will be untouched while serializing
                Y.mix(cfg, {
                    parentEl: this.get('contentBox'),
                    type: 'group'
                }); // Set up the form parentEl attribute, so it knows where to render

                inputEx.use(
                    val,
                    Y.bind(
                        function(cfg) {
                            // Load form dependencies
                            if (this.get('destroyed')) {
                                return;
                            }
                            var form = inputEx(cfg); // Initialize and render form
                            form.setValue(this.get('values'), false); // Sync form with "values" ATTR
                            form.removeClassFromState(); // Remove required state
                            this.set(FORM, form);
                            this.fire('formUpdate');
                            form.on(
                                'updated',
                                function(e) {
                                    this.fire('updated', e);
                                },
                                this
                            );
                        },
                        this,
                        cfg
                    )
                );
            },
            save: function(e) {
                e.halt(true);

                var form = this.get(FORM), val = form.getValue();

                if (!form.validate()) {
                    this.showMessage('error', 'Some fields are not valid.');
                    return;
                }
                if (val.valueselector) {
                    val = val.valueselector;
                }
                this.fire('submit', {
                    value: val
                });
            },
            validate: function() {
                return this.get('form').validate();
            }
        },
        {
            /** @lends Y.Wegas.Form */
            EDITORNAME: 'Form',
            /**
             * <p><strong>Attributes</strong></p>
             * <ul>
             *    <li>values: values of fields of the form</li>
             *    <li>form: the form to manage (see YUI Form)</li>
             *    <li>cfg: configuation of the form (see YUI Form)</li>
             * </ul>
             *
             * @field
             * @static
             */
            ATTRS: {
                /**
                 * Values of fields of the form
                 */
                values: {
                    transient: true,
                    value: {},
                    setter: function(val) {
                        if (this.get(FORM)) {
                            this.get(FORM).setValue(val, false);
                        }
                        return val;
                    }
                },
                /**
                 * The form to manage
                 */
                form: {
                    transient: true,
                    setter: function(val) {
                        if (this.get(FORM)) {
                            // If there is alread a form instantiated, destroy it
                            this.get(FORM).destroy();
                        }
                        return val;
                    }
                },
                /**
                 * Configuation of the form
                 */
                cfg: {
                    validator: Y.Lang.isObject,
                    type: 'object',
                    properties: {
                        fields: {
                            type: 'array',
                            view: {
                                label: 'Fields',
                                highlight: true
                            },
                            items: {
                                type: 'object',
                                value: {},
                                properties: {
                                    type: {
                                        index: -5,
                                        type: 'string',
                                        required: true,
                                        view: {
                                            type: 'select',
                                            label: 'Type',
                                            choices: [
                                                'number',
                                                'string',
                                                'integer',
                                                'now',
                                                'select',
                                                'text'
                                            ]
                                        }
                                    },
                                    required: {
                                        type: 'boolean',
                                        index: -4,
                                        value: false,
                                        view: { label: 'Required' }
                                    },
                                    value:{ view:{  type: "hidden" } },
                                    choices: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                value: {
                                                    type: 'string',
                                                    view: { label: 'Value', layout: 'shortInline' }
                                                },
                                                label: {
                                                    type: 'string',
                                                    view: { label: 'Label', layout: 'shortInline' }
                                                }
                                            }
                                        },
                                        visible: function(val, formVal, path) {
                                            var curr = formVal;
                                            for (
                                                var i = 0;
                                                i < path.length - 1;
                                                i++
                                            ) {
                                                curr = curr[path[i]];
                                            }
                                            return curr.type === 'select';
                                        },
                                        view: {
                                            label: 'Choices',
                                            highlight: true
                                        }
                                    },
                                    name: {
                                        type: 'string',
                                        index: -2,
                                        required: true,
                                        view: { label: 'Name' }
                                    },
                                    label: {
                                        type: 'string',
                                        index: -1,
                                        view: { label: 'Label' }
                                    }
                                }
                            }
                        }
                    },
                    setter: function(val) {
                        this.setCfg(val);
                        return val;
                    },
                    index: 8,
                    view: {
                        label: 'Fields'
                    }
                },
                buttons: {
                    type: 'array',
                    valueFn: function() {
                        return [
                            {
                                type: 'Button',
                                action: 'submit',
                                label: '<span class="wegas-icon wegas-icon-save" ></span>Save'
                            }
                        ];
                    },
                    view: {
                        type: 'hidden'
                    }
                }
            }
        }
    );
    Wegas.Form = Form;

    /* Add relevant plugin*/
    Wegas.Form.ATTRS.plugins = Y.clone(Wegas.Widget.ATTRS.plugins);
    Wegas.Form.ATTRS.plugins.view.choices.push({
        label: 'Save to',
        value: { fn: 'SaveObjectAction' }
    });
});
