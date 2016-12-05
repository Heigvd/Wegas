import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import RForm from 'jsoninput';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './defaultViews';
import { register } from './Script/index';
import { getY } from './index';

injectTapEventPlugin();
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
            if (value && schema) {
                const boundFire = (val) => {
                    this.fire('updated', val);
                };
                render((
                    <MuiThemeProvider
                        muiTheme={getMuiTheme()}
                    >
                        <RForm
                            ref={form => this.set(FORM, form)}
                            schema={schema}
                            value={value}
                            onChange={boundFire}
                        />
                    </MuiThemeProvider>
                ), this.get('contentBox').getDOMNode());
            }
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
                value: {},
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
                    fields: {
                        type: 'array',
                        items: {
                            type: 'object',
                            required: true,
                            value: {},
                            properties: {
                                type: {
                                    type: 'string',
                                    required: true
                                },
                                name: {
                                    type: 'string',
                                    required: true
                                },
                                label: {
                                    type: 'string'
                                }
                            }
                        }
                    }
                },
                setter(cfg) {
                    this.renderForm(this.get('values'), cfg);
                    // this.setCfg(val);
                    return cfg;
                },
                index: 8,
                view: {
                    label: 'Fields',
                    fields: inputEx.Group.groupOptions
                }
            },
            buttons: {
                type: 'array',
                valueFn: () => [{
                    type: 'Button',
                    action: 'submit',
                    label: '<span class="wegas-icon wegas-icon-save" ></span>Save'
                }]
            },
            view: {
                type: 'hidden'
            }
        }
    });
Form.register = register;

/* Add relevant plugin*/
// Wegas.Form.ATTRS.plugins = Y.clone(Wegas.Widget.ATTRS.plugins);
// Wegas.Form.ATTRS.plugins._inputex.items.push({ // eslint-disable-line
//     type: 'Button',
//     label: 'Save to',
//     data: 'SaveObjectAction'
// });

Wegas.RForm = Form;
