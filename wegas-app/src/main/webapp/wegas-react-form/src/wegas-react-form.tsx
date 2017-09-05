// polyfill injection point
import 'core-js';
// end polyfill injection point
import RForm, { Schema } from 'jsoninput';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import './defaultViews';
import { getY } from './index';
import {
    IndependantMultiVariableCondition,
    IndependantMultiVariableMethod,
    IndependantVariableStatement,
    register
} from './Script/index';
import { css } from 'glamor';
import { debounce } from 'lodash-es';

const Y = getY(); // Current YUI instance
const Wegas: { [key: string]: any } = Y.Wegas;
// const inputEx = Y.inputEx;
const FORM = 'form';

const wegasSimpleButtonStyle = css({
    background: 'none !important',
    fontSize: '26px',
    padding: '2px 6px 1px'
});
const saveBtnStyle = css({
    background: 'none',
    transition: '1s'
});
const activeSaveBtnStyle = css(saveBtnStyle, {
    color: 'black',
    ':hover': {
        color: 'green'
    }
});
const inactiveSaveBtnStyle = css(saveBtnStyle, {
    color: 'gray'
});
const setSavingBtnStyle = css(saveBtnStyle, {
    color: '#4cb050'
});
const containerForm = css({
    position: 'relative',
    width: '100%',
    padding: '0 1em',
    boxSizing: 'border-box'
});

const Form = Y.Base.create(
    'wegas-react-form',
    Y.Widget,
    [Y.WidgetChild, Wegas.Widget, Wegas.Editable],
    {
        initializer() {
            this.plug(Y.Plugin.WidgetToolbar);
            this.publish('submit', {
                emitFacade: true
            });
            this.publish('updated', {
                emitFacade: false
            });
            // reduce number of calls when setting both 'schema' and 'value' at the same time
            this.renderForm = debounce(this.renderForm, 10);
        },
        renderUI() {
            Y.Array.each(this.get('buttons'), this.addButton, this);
            // ctrl-s shortcut
            this.get('contentBox').on('key', this.save, 'down:83+ctrl', this);
        },
        renderForm(value: {} | undefined, schema: Schema) {
            if (schema) {
                const boundFire = (val: {}) => {
                    this.fire('updated', val);
                };
                render(
                    <div className={containerForm.toString()}>
                        <RForm
                            ref={form => this.set(FORM, form)}
                            schema={schema}
                            value={value}
                            onChange={boundFire}
                        />
                    </div>,
                    this.get('contentBox').getDOMNode()
                );
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
        addButton(b: any) {
            const btn = b;
            switch (b.action) {
                case 'submit':
                    btn.on = {
                        click: Y.bind(this.save, this)
                    };
                    break;
                default:
                    btn.on = {
                        click: Y.bind(
                            function click(this: any, action: string) {
                                this.fire(action);
                            },
                            this,
                            b.action
                        )
                    };
                    break;
            }
            this.toolbar.add(new Wegas.Button(btn));
        },
        destroyForm() {
            this.set(FORM, null);
        },
        save(e: any) {
            e.halt(true);

            const form = this.get(FORM);
            const val = form.getValue();

            if (form.validate().length) {
                this.showMessage('error', 'Some fields are not valid.');
                return;
            }
            // if (val.valueselector) {
            //     val = val.valueselector;
            // }
            this.animateSaveBtn();
            this.fire('submit', {
                value: JSON.parse(JSON.stringify(val)) // Immutability ...
            });
        },
        validate() {
            return this.get('form').validate();
        },
        // Set visual feedback for when the "save" button should be clicked
        activateSaveBtn() {
            const btn = this.get('contentBox')
                .get('parentNode')
                .one('.wegas-save-form-button');
            btn
                .removeClass(setSavingBtnStyle.toLocaleString())
                .removeClass(inactiveSaveBtnStyle.toString())
                .addClass(activeSaveBtnStyle.toString());
            btn.setAttribute('title', 'Save your changes');
        },
        // Set normal visual appearance (i.e. when the "save" button does not need to be clicked)
        deactivateSaveBtn() {
            const btn = this.get('contentBox')
                .get('parentNode')
                .one('.wegas-save-form-button');
            btn
                .removeClass(setSavingBtnStyle.toLocaleString())
                .removeClass(activeSaveBtnStyle.toString())
                .addClass(inactiveSaveBtnStyle.toString());
            btn.setAttribute('title', 'Nothing to save');
        },
        // Set visual feedback for when the "save" button is clicked and switches between saving and not saving
        animateSaveBtn(setSaving: boolean = true, milliSeconds: number = 2000) {
            const btn = this.get('contentBox')
                .get('parentNode')
                .one('.wegas-save-form-button'),
                ctx = this;
            if (setSaving) {
                btn
                    .removeClass(inactiveSaveBtnStyle.toString())
                    .removeClass(activeSaveBtnStyle.toString())
                    .addClass(setSavingBtnStyle.toLocaleString());
                btn.setAttribute('title', 'Saving ...');
            }
            if (!setSaving || milliSeconds >= 0) {
                setTimeout(function() {
                    if (!btn) alert('no btn');
                    ctx.deactivateSaveBtn();
                }, milliSeconds);
            }
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
                value: undefined,
                setter(this: any, val: any) {
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
                        additionalProperties: {
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
                                            errored: function requiredString(
                                                v: string
                                            ) {
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
                setter(this: any, cfg: {}) {
                    this.renderForm(this.get('values'), cfg);
                    // this.setCfg(val);
                    return cfg;
                },
                index: 8
            },
            buttons: {
                type: 'array',
                valueFn: () => [
                    {
                        type: 'Button',
                        action: 'submit',
                        cssClass: wegasSimpleButtonStyle.toString(),
                        label:
                            '<span class="wegas-save-form-button fa fa-check-circle ' +
                            inactiveSaveBtnStyle.toString() +
                            '" title="No changes to save"></span>'
                    }
                ],
                view: { type: 'hidden' }
            }
        }
    }
);

(Form as any).Script = {
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
