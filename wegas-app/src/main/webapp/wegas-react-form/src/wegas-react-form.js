// polyfill injection point
import 'core-js';
// end polyfill injection point
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import RForm from 'jsoninput';
import './defaultViews';
import { register, IndependantVariableStatement, IndependantMultiVariableMethod, IndependantMultiVariableCondition } from './Script/index';
import { getY } from './index';

const Y = getY(); // Current YUI instance
const Wegas = Y.Wegas;
const inputEx = Y.inputEx;
const FORM = 'form';

const Form = Y.Base.create('wegas-react-form', Y.Widget,
    [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {

        initializer() {
            this.plug(Y.Plugin.WidgetToolbar);
            this.publish('submit', {
                emitFacade: true
            });
            this.publish('updated', {
                emitFacade: false
            });
        },
        renderUI() {
            Y.Array.each(this.get('buttons'), this.addButton, this);
            // ctrl-s shortcut
            this.get('contentBox').on('key', this.save, 'down:83+ctrl', this);
        },
        renderForm(value, schema) {
            if (schema) {
                const boundFire = (val) => {
                    this.fire('updated', val);
                };
                render((
                    <div style={{ postion: 'relative', width: '100%', paddingLeft: '1em', boxSizing: 'border-box' }}>
                        <RForm
                            ref={form => this.set(FORM, form)}
                            schema={schema}
                            value={value}
                            onChange={boundFire}
                        />
                    </div>
                ), this.get('contentBox').getDOMNode());
            }
        },
        getValue() {
            return this.get(FORM) && this.get(FORM).getValue();
        },
        syncUI() {
            this.set('cfg', this.get('cfg'));
        },
        destructor() {
            unmountComponentAtNode(this.get('contentBox').getDOMNode());
            this.set(FORM, null);
        },
        addButton(b) {
            const btn = b;
            switch (b.action) {
                case 'submit':
                    btn.on = {
                        click: Y.bind(this.save, this)
                    };
                    break;
                default:
                    btn.on = {
                        click: Y.bind(function click(action) {
                            this.fire(action);
                        }, this, b.action)
                    };
                    break;
            }
            this.toolbar.add(new Wegas.Button(btn));
        },
        destroyForm() {
            this.set(FORM, null);
        },
        save(e) {
            e.halt(true);

            const form = this.get(FORM);
            const val = form.getValue();

            if (form.validate().length) {
                console.log(form.validate());
                this.showMessage('error', 'Some fields are not valid.');
                return;
            }
            console.log(val);
            // if (val.valueselector) {
            //     val = val.valueselector;
            // }
            this.fire('submit', {
                value: val
            });
        },
        validate() {
            return this.get('form').validate();
        }
    }, {
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
                value: undefined,
                setter(val) {
                    this.renderForm(val, this.get('cfg'));
                    return val;
                }
            },
            /**
             * The form to manage
             */
            form: {
                transient: true
            },
            /**
             * Configuation of the form
             */
            cfg: {
                type: 'object',
                validator: Y.Lang.isObject,
                properties: {
                    type: {
                        type: 'string',
                        value: 'object',
                        view: { type: 'hidden' }
                    },
                    properties: {
                        type: 'object',
                        required: true,
                        value: {},
                        defaultProperties: {
                            type: 'object',
                            properties: {
                                type: {
                                    type: 'string',
                                    value: 'string',
                                    view: {
                                        label: 'Type',
                                        type: 'select',
                                        choices: [
                                            { value: 'string' },
                                            { value: 'number' },
                                            { value: 'boolean' }
                                        ]
                                    }
                                },
                                required: {
                                    type: 'boolean',
                                    view: { label: 'Required' }
                                },
                                view: {
                                    type: 'object',
                                    value: {},
                                    properties: {
                                        label: {
                                            errored: function requiredString(v) {
                                                if (v && v.trim()) {
                                                    return '';
                                                }
                                                return 'is required';
                                            },
                                            view: {
                                                label: 'Label'
                                            },
                                            type: 'string'
                                        }
                                    }
                                }
                            }
                        },
                        view: {
                            type: 'hashlist',
                            label: 'Fields',
                            keyLabel: 'Name'
                        }
                    }
                },
                setter(cfg) {
                    this.renderForm(this.get('values'), cfg);
                    // this.setCfg(val);
                    return cfg;
                },
                index: 8
            },
            buttons: {
                type: 'array',
                valueFn: () => [{
                    type: 'Button',
                    action: 'submit',
                    label: '<span class="wegas-icon wegas-icon-save" ></span>Save'
                }],
                view: { type: 'hidden' }
            }
        }
    });
Form.Script = {
    register, // Register Global script methods
    MultiVariableMethod: IndependantMultiVariableMethod,
    MultiVariableCondition: IndependantMultiVariableCondition,
    VariableStatement: IndependantVariableStatement
};

/* Add relevant plugin*/
// Wegas.Form.ATTRS.plugins = Y.clone(Wegas.Widget.ATTRS.plugins);
// Wegas.Form.ATTRS.plugins._inputex.items.push({ // eslint-disable-line
//     type: 'Button',
//     label: 'Save to',
//     data: 'SaveObjectAction'
// });

Wegas.RForm = Form;
