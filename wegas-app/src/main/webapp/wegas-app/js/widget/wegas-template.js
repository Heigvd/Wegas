/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-template", function(Y) {
    "use strict";

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
    AbstractTemplate = Y.Base.create("wegas-template", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /*@lends Y.Wegas.AbstractTemplate#*/
        syncUI: function() {
            Y.log("syncUI()", "log", "Wegas.AbstractTemplate");
            var template = this.getTemplate(),
                data = this.computeData();
            try {
                this.get("contentBox").setHTML(template(data));
            } catch (e) {
                Y.log("Error rendering template: " + template, "error", "Wegas.AbstractTemplate");
            }
        },
        bindUI: function() {
            this.after(["dataChange", "variableChange"], this.syncUI);
            if (this.get("custom")) {
                this.vdUpdateHandler = Wegas.Facade.Instance.after("update", this.syncUI, this);
            } else {
                this.vdUpdateHandler = Wegas.Facade.Instance.after("updatedInstance", this.syncTemplate, this);
            }
        },
        syncTemplate: function(payload) {
            var template = this.get("variable.evaluated");
            /*
             ** Call syncUI() anyway if this is a custom template, i.e. a script with potentially undetectable
             ** dependencies on the variable being updated.
             ** Otherwise simply call syncUI() if the IDs of the variables match.
             */
            if (template && template.getInstance().get("id") === payload.entity.get("id")) {
                this.syncUI();
            }
        },
        getTemplate: function() {
            return this.TEMPLATE;
        },
        computeData: function() {
            var data = {}, initialData = Y.merge(this.get("data")), desc = this.get("variable.evaluated");

            if (desc) {
                if (desc instanceof Y.Wegas.persistence.VariableInstance) {
                    data.value = this.undefinedToEmpty(desc.get("value"));
                    desc = Y.Wegas.Facade.Variable.cache.findById(desc.get("descriptorId"));
                } else {
                    data.value = undefined;
                }

                if (desc instanceof Wegas.persistence.ListDescriptor && desc.get("currentItem")) {       // If the widget is a list,
                    desc = desc.get("currentItem"); // display it with the current list and the current element
                }

                //  data.label = this.undefinedToEmpty(desc.getLabel());
                if (initialData.label) {
                    initialData.label = Y.Template.Micro.compile(initialData.label || "")();
                }
                if (data.value === undefined) {
                    data.value = this.undefinedToEmpty(desc.getInstance().get("value"));
                }
                data.maxValue = this.undefinedToEmpty(desc.get("maxValue"));
                data.minValue = this.undefinedToEmpty(desc.get("minValue"));
                data.defaultValue = this.undefinedToEmpty(desc.get("defaultValue"));
                data.variable = desc;
            }

            return Y.mix(initialData, data, false, null, 0, true);
        },
        getEditorLabel: function() {
            var variable;
            if (this.get("data.label")) {
                return this.get("data.label");
            }
            variable = this.get("variable.evaluated");
            if (variable) {
                return variable.getEditorLabel();
            }
            return null;
        },
        destructor: function() {
            this.vdUpdateHandler.detach();
        },
        undefinedToEmpty: function(value) {
            return Y.Lang.isUndefined(value) ? "" : "" + value;
        }
    }, {
        /*@lends Y.Wegas.AbstractTemplate*/
        EDITORNAME: "Variable template",
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable"
                        //classFilter: ["NumberDescriptor"]
                }
            },
            data: {
                value: {},
                _inputex: {
                    label: "Options",
                    wrapperClassName: 'inputEx-fieldWrapper',
                    _type: "group",
                    fields: [{
                            name: "label",
                            label: "label"
                        }],
                    required: false
                }
            }
        }
    });
    Wegas.Template = Y.Base.create("wegas-template", AbstractTemplate, [], {
        /*@lends Y.Wegas.Template#*/
        TEMPLATES: {},
        getTemplate: function() {
            var template = this.get("custom"),
                hashCode = "" + Wegas.Helper.hashCode(template);
            if (Y.Lang.isUndefined(this.TEMPLATES[hashCode])) {
                this.TEMPLATES[hashCode] = Micro.compile(template || "");
            }
            return this.TEMPLATES[hashCode];
        }
    }, {
        /*@lends Y.Wegas.Template*/
        EDITORNAME: "Custom template",
        ATTRS: {
            custom: {
                type: "text",
                value: "<%= this.variable.getValue() || 'Undefined' %>",
                _inputex: {
                    label: "Template"
                }
            }
        }
    });
    Wegas.ValueboxTemplate = Y.Base.create("wegas-template", AbstractTemplate, [], {
        TEMPLATE: Micro.compile("<div class='wegas-template-valuebox'><% if(this.label){ %><label><%= this.label %></label><% } %><div class='wegas-template-valuebox-units'><% for(var i=+this.minValue; i < +this.maxValue + 1; i+=1){%>" +
            "<div class='wegas-template-valuebox-unit <%= +i < +this.value ? ' wegas-template-valuebox-previous' : '' %><%= +i === 0 ? ' wegas-template-valuebox-zero' : '' %><%= +i === +this.value ? ' wegas-template-valuebox-selected' : '' %>'><%= ''+i %></div><% } %></span>" +
            "</div></div>")
    });
    Wegas.BoxTemplate = Y.Base.create("wegas-template", AbstractTemplate, [], {
        TEMPLATE: Micro.compile("<div class='wegas-template-box'><% if(this.label){ %><label><%= this.label %></label><br/><% } %>"
            + "<div class='wegas-template-box-units'><% for(var i=0; i < this.value; i+=1){%>" +
            "<div class='wegas-template-box-unit <%= 1+i == +this.value ? ' wegas-template-box-selected' : (2+i == +this.value ? ' wegas-template-box-pred' : '') %>' value='<%= 1+i %>'></div><% } %></div>" +
            "<span class='wegas-template-box-value'>"
            + "(<%= this.value || '{value}' %>"
            //+ "<% if(this.defaultValue != ''){ %><%= '/' + (this.defaultValue || '{defaultValue}') %><% } %>"
            + ")</span></div>")
    });
    Wegas.NumberTemplate = Y.Base.create("wegas-template", AbstractTemplate, [], {
        TEMPLATE: Micro.compile("<div class='wegas-template-text'><% if(this.label){ %><span><%= this.label %></span><br/><% } %><span><%= this.value || '{value}' %></span></div>")
    });
    Wegas.TitleTemplate = Y.Base.create("wegas-template", AbstractTemplate, [], {
        TEMPLATE: Micro.compile("<div class='wegas-template-title'><%= this.label || '{label}'%></div>")
    });
    Wegas.FractionTemplate = Y.Base.create("wegas-template", AbstractTemplate, [], {
        TEMPLATE: Micro.compile("<div class='wegas-template-fraction'>"
            + "<% if(this.label){ %><label><%= this.label %> </label><% } %>"
            //+ "<%= (this.minValue || '{minValue}')%> /"
            + "<%= (this.value || '{label}') + '/' + (this.maxValue || '{maxValue}') %></div>")
    });
    Wegas.TextTemplate = Y.Base.create("wegas-template", AbstractTemplate, [], {
        TEMPLATE: Micro.compile("<div><%== this.value %></div>")
    }, {
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: ["TextDescriptor", "StringDescriptor"]
                }
            }
        }
    });
});
