import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import RForm from 'jsoninput';
import injectTapEventPlugin from 'react-tap-event-plugin';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import './defaultViews';
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
        /**
         * @function
         * @private
         * @description
         */
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
        /**
         * @function
         * @private
         * @description call function 'renderToolbar'.
         */
        syncUI() {
            this.set('cfg', this.get('cfg'));
        },
        /**
         * @function
         * @private
         * @returns {undefined}
         */
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
        /**
         * @function
         * @private
         * @description set the given form to null
         */
        destroyForm() {
            this.set(FORM, null);
        },
        // setCfg(val) {
        //     var cfg = Y.clone(val); // Duplicate so val will be untouched while serializing
        //     // Y.mix(cfg, {
        //     //     parentEl: this.get('contentBox'),
        //     //     type: 'group'
        //     // }); // Set up the form parentEl attribute, so it knows where to render

        //     // inputEx.use(val, Y.bind(function(cfg) { // Load form dependencies
        //     //     if (this.get('destroyed')) {
        //     //         return;
        //     //     }
        //     //     var form = inputEx(cfg); // Initialize and render form
        //     //     form.setValue(this.get('values'), false); // Sync form with 'values' ATTR
        //     //     form.removeClassFromState(); // Remove required state
        //     //     this.set(FORM, form);
        //     //     this.fire('formUpdate');
        //     //     form.on('updated', function(e) {
        //     //         this.fire('updated', e);
        //     //     }, this);
        //     // }, this, cfg));
        // },
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
                    if (this.get(FORM)) {
                        this.get(FORM).setValue(val, false);
                    }
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
                validator: Y.Lang.isObject,
                setter(cfg) {
                    this.renderForm(this.get('values'), cfg);
                    // this.setCfg(val);
                    return cfg;
                },
                items: {
                    test: {
                        type: 'string'
                    }
                },
                _inputex: {
                    index: 8,
                    _type: 'group',
                    legend: 'Fields',
                    fields: inputEx.Group.groupOptions
                }
            },
            buttons: {
                value: [{
                    type: 'Button',
                    action: 'submit',
                    label: '<span class=\'wegas-icon wegas-icon-save\' ></span>Save'
                }
                ],
                _inputex: {
                    _type: 'hidden'
                }
            }
        }
    });

/* Add relevant plugin*/
// Wegas.Form.ATTRS.plugins = Y.clone(Wegas.Widget.ATTRS.plugins);
// Wegas.Form.ATTRS.plugins._inputex.items.push({ // eslint-disable-line
//     type: 'Button',
//     label: 'Save to',
//     data: 'SaveObjectAction'
// });

Wegas.RForm = Form;
