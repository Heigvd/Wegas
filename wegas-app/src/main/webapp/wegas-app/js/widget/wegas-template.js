/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-template', function(Y) {
    'use strict';
    var Micro = Y.Template.Micro, Wegas = Y.Wegas, AbstractTemplate;

    /**
     * @name Y.Wegas.AbstractTemplate
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class
     * @constructor
     * @description  Display  Wegas variables instance (or/and descriptor) under
     * specific templates : text, title, box, fraction and valuebox.
     * It is also possible to create a custom template.
     */
    AbstractTemplate = Y.Base.create(
        'wegas-template',
        Y.Widget,
        [Y.WidgetChild, Wegas.Widget, Wegas.Editable],
        {
            /*@lends Y.Wegas.AbstractTemplate#*/
            syncUI: function() {
                Y.log('syncUI()', 'log', 'Wegas.AbstractTemplate');
                var template = this.getTemplate(), data = this.computeData();
                try {
                    this.get('contentBox').setHTML(template(data));
                } catch (e) {
                    Y.log(
                        'Error rendering template: ' + template,
                        'error',
                        'Wegas.AbstractTemplate'
                        );
                }
            },
            bindUI: function() {
                this.after(['dataChange', 'variableChange'], this.syncUI);
                if (this.get('custom')) {
                    this.vdUpdateHandler = Wegas.Facade.Instance.after(
                        'update',
                        this.syncUI,
                        this
                        );
                } else {
                    var instance = this.get("variable.evaluated").getInstance();
                    if (instance) {
                        this.vdUpdateHandler = Wegas.Facade.Instance.after(
                            //'*:updatedInstance',
                            instance.get("id") + ':updatedInstance',
                            this.syncUI,
                            this
                            );
                    }
                }
            },
            syncTemplate: function(payload) {
                var template = this.get('variable.evaluated');
                /*
                 ** Call syncUI() anyway if this is a custom template, i.e. a script with potentially undetectable
                 ** dependencies on the variable being updated.
                 ** Otherwise simply call syncUI() if the IDs of the variables match.
                 */
                if (
                    template &&
                    template.getInstance().get('id') ===
                    payload.entity.get('id')
                    ) {
                    this.syncUI();
                }
            },
            getTemplate: function() {
                return this.TEMPLATE;
            },
            computeData: function() {
                var data = {},
                    initialData = Y.merge(this.get('data')),
                    desc = this.get('variable.evaluated');

                if (desc) {
                    if (desc instanceof Y.Wegas.persistence.VariableInstance) {
                        if (desc.get("trValue")) {
                            data.value = this.undefinedToEmpty(I18n.t(desc.get('trValue')));
                        } else {
                            data.value = this.undefinedToEmpty(desc.get('value'));
                        }

                        desc = Y.Wegas.Facade.Variable.cache.findById(desc.get('parentId'));
                    } else {
                        data.value = undefined;
                    }

                    /*This behaviour is not even possible since years...
                     * if (desc instanceof Wegas.persistence.ListDescriptor && desc.get("currentItem")) {       // If the widget is a list,
                     desc = desc.get("currentItem"); // display it with the current list and the current element
                     }*/

                    //  data.label = this.undefinedToEmpty(desc.getLabel());
                    if (initialData.label) {
                        initialData.label = Y.Template.Micro.compile(
                            initialData.label || ''
                            )();
                    }
                    if (data.value === undefined) {
                        if (desc.getInstance().get("trValue")) {
                            data.value = this.undefinedToEmpty(I18n.t(desc.getInstance().get('trValue')));
                        } else {
                            data.value = this.undefinedToEmpty(
                                desc.getInstance().get('value')
                                );
                        }
                    }
                    data.maxValue = this.undefinedToEmpty(desc.get('maxValue'));
                    data.minValue = this.undefinedToEmpty(desc.get('minValue'));
                    data.variable = desc;
                }

                return Y.mix(initialData, data, false, null, 0, true);
            },
            getEditorLabel: function() {
                var variable;
                if (this.get('data.label')) {
                    return this.get('data.label');
                }
                variable = this.get('variable.evaluated');
                if (variable) {
                    return variable.getEditorLabel();
                }
                return null;
            },
            destructor: function() {
                Y.log("DestroyTemplate");
                this.vdUpdateHandler && this.vdUpdateHandler.detach();
            },
            undefinedToEmpty: function(value) {
                return Y.Lang.isUndefined(value) ? '' : '' + value;
            }
        },
        {
            /*@lends Y.Wegas.AbstractTemplate*/
            EDITORNAME: 'Variable template',
            ATTRS: {
                /**
                 * The target variable, returned either based on the variableName attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                variable: {
                    type: "object",
                    getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: 'Variable'
                            //classFilter: ["NumberDescriptor"]
                    }
                },
                data: {
                    type: 'object',
                    properties: {
                        label: {type: "string"}
                    },
                    additionalProperties: {
                        type: 'string'
                    },
                    view: {
                        type: 'hashlist',
                        label: 'Options',
                        required: false,
                        keyLabel: 'Property'
                    }
                }
            }
        }
    );
    Wegas.Template = Y.Base.create(
        'wegas-template',
        AbstractTemplate,
        [],
        {
            /*@lends Y.Wegas.Template#*/
            TEMPLATES: {},
            getTemplate: function() {
                var template = this.get('custom'),
                    hashCode = '' + Wegas.Helper.hashCode(template);
                if (Y.Lang.isUndefined(this.TEMPLATES[hashCode])) {
                    this.TEMPLATES[hashCode] = Micro.compile(template || '');
                }
                return this.TEMPLATES[hashCode];
            }
        },
        {
            /*@lends Y.Wegas.Template*/
            EDITORNAME: 'Custom template',
            ATTRS: {
                custom: {
                    type: 'string',
                    value: "<%= this.variable.getValue() || 'Undefined' %>",
                    view: {
                        label: 'Template',
                        rows: 3
                    }
                }
            }
        }
    );
    Wegas.ValueboxTemplate = Y.Base.create(
        'wegas-template',
        AbstractTemplate,
        [],
        {
            TEMPLATE: Micro.compile(
                "<div class='wegas-template-valuebox'>" +
                "  <% if(this.label){ %>" +
                "    <label><%= this.label %></label>" +
                "  <% } %>" +
                "  <div class='wegas-template-valuebox-units'>" +
                "    <% for(var i=+this.minValue; i < +this.maxValue + 1; i+=1){%>" +
                "      <div data-value=\"<%= i %>\" class='wegas-template-valuebox-unit <%= +i < +this.value ? ' wegas-template-valuebox-previous' : '' %><%= +i === 0 ? ' wegas-template-valuebox-zero' : '' %><%= +i === +this.value ? ' wegas-template-valuebox-selected' : '' %>'>" +
                "        <span><%= I18n.formatNumber(i) %></span>" +
                "      </div>" +
                "    <% } %>" +
                "  </div>" +
                "</div>"
                )
        },
        {
            EDITORNAME: "Serie",
            ATTRS: {
                variable: {
                    type: "object",
                    getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: 'Variable',
                        classFilter: ["NumberDescriptor"]
                    }
                },
                data: {
                    type: 'object',
                    properties: {
                        label: {type: "string", view: {label: "Label"}},
                        minValue: {
                            type: "number",
                            view: {
                                label: "Minimum value",
                                description: "Override number's minimum value",
                                layout: "shortInline"
                            }
                        },
                        maxValue: {
                            type: "number",
                            view: {
                                label: "Maximum value",
                                description: "Override number's maximum value",
                                layout: "shortInline"
                            }
                        }
                    },
                    view: {}
                }
            }
        }
    );
    Wegas.BoxTemplate = Y.Base.create('wegas-template', AbstractTemplate, [],
        {
            TEMPLATE: Micro.compile(
                "<div class='wegas-template-box'><% if(this.label){ %><label><%= this.label %></label><br/><% } %>" +
                "<div class='wegas-template-box-units'><% for(var i=0; i < this.value; i+=1){%>" +
                "<div class='wegas-template-box-unit <%= 1+i == +this.value ? ' wegas-template-box-selected' : (2+i == +this.value ? ' wegas-template-box-pred' : '') %>' value='<%= 1+i %>'></div><% } %></div>" +
                "<span class='wegas-template-box-value'>" +
                "(<%= I18n.formatNumber(this.value || '{value}') %>" +
                ')</span></div>'
                )
        },
        {
            EDITORNAME: "Boxes",
            ATTRS: {

                variable: {
                    type: "object",
                    getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: 'Variable',
                        classFilter: ["NumberDescriptor"]
                    }
                },
                data: {
                    type: 'object',
                    properties: {
                        label: {type: "string", view: {label: "Label"}},
                        maxValue: {
                            type: "number",
                            errored: function(val) {
                                var errors = [];
                                if (Y.Lang.isNumber(val) && val < 3) {
                                    errors.push("should be empty or greater than 2");
                                }
                                return errors.join(",");
                            },
                            view: {
                                label: "max number of boxes displayed",
                                description: "",
                                layout: "shortInline",
                                placeholder: "∞"
                            }
                        }
                    },
                    view: {}
                }
            }
        });
    Wegas.NumberTemplate = Y.Base.create(
        'wegas-template',
        AbstractTemplate,
        [],
        {
            TEMPLATE: Micro.compile(
                "<div class='wegas-template-text'><% if(this.label){ %><span><%= this.label %></span><br/><% } %><span><%= I18n.formatNumber(this.value || '{value}') %></span></div>"
                )
        },
        {
            EDITORNAME: "Number Template",
            ATTRS: {
                variable: {
                    type: "object",
                    getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: 'Variable',
                        classFilter: ["NumberDescriptor"]
                    }
                },
                data: {
                    type: 'object',
                    properties: {
                        label: {type: "string", view: {label: "Label"}}
                    },
                    view: {}
                }
            }
        }
    );
    Wegas.TitleTemplate = Y.Base.create(
        'wegas-template',
        AbstractTemplate,
        [],
        {
            TEMPLATE: Micro.compile(
                "<div class='wegas-template-title'><%= this.label || '{label}'%></div>"
                )
        },
        {
            EDITORNAME: "Title Teamplate",
            ATTRS: {
                data: {
                    type: 'object',
                    properties: {
                        label: {type: "string", view: {label: "Label"}}
                    },
                    view: {}
                }
            }
        }
    );
    Wegas.FractionTemplate = Y.Base.create(
        'wegas-template',
        AbstractTemplate,
        [],
        {
            TEMPLATE: Micro.compile(
                "<div class='wegas-template-fraction'>" +
                '<% if(this.label){ %><label><%= this.label %> </label><% } %>' +
                //+ "<%= (this.minValue || '{minValue}')%> /"
                "<%= I18n.formatNumber(this.value || '{label}') + '/' + I18n.formatNumber(this.maxValue || '{maxValue}') %></div>"
                )
        },
        {
            EDITORNAME: "Fraction",
            ATTRS: {
                variable: {
                    type: "object",
                    getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    view: {
                        type: 'variableselect',
                        label: 'Variable',
                        classFilter: ["NumberDescriptor"]
                    }
                },
                data: {
                    type: 'object',
                    properties: {
                        label: {type: "string", view: {label: "Label"}},
                        maxValue: {type: "number", view: {label: "Maximum value", description: "Override number's maximum value"}}
                    },
                    view: {}
                }
            }
        }
    );
    Wegas.TextTemplate = Y.Base.create('wegas-template', AbstractTemplate, [], {
        TEMPLATE: Micro.compile('<div><%== I18n.tVar(this.variable) %></div>')
    }, {
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                type: 'object',
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                view: {
                    type: 'variableselect',
                    label: 'Variable',
                    classFilter: ['TextDescriptor', 'StringDescriptor',
                        'ListDescriptor', 'StaticTextDescriptor']
                }
            },
            data: {
                type: 'object',
                properties: {},
                view: {}
            }
        }
    });
});
