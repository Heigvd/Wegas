/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */

YUI.add("wegas-template", function(Y) {
    "use strict";
    var TEMPLATE = {
        TEXT: "<div class='wegas-template-text'><span><%= this.label || '{label}' %></span><br/><span><%= this.value || '{value}' %></span></div>",
        BOX: "<div class='wegas-template-box'><label><%= this.label || '{label}'%></label><br/><span><% for(var i=0; i < this.value; i+=1){%>" +
                "<div class='wegas-template-box-unit'></div><% } %></span><br/>" +
                "<span class='wegas-template-box-value'>(<%= this.value || '{value}' %><% if(this.defaultValue != ''){ %><%= '/' + (this.defaultValue || '{defaultValue}') %><% } %>)</span></div>",
        VALUEBOX: "<div class='wegas-template-valuebox'><label><%= this.label || '{label}'%></label</div><br/></label><div class='wegas-template-valuebox-units'><% for(var i=+this.minValue; i < +this.maxValue + 1; i+=1){%>" +
                "<div class='wegas-template-valuebox-unit <%= +i < +this.value ? ' wegas-template-valuebox-previous' : '' %><%= +i === +this.value ? ' wegas-template-valuebox-selected' : '' %>'><%= ''+i %></div><% } %></span>" +
                "</div></div>",
        TITLE: "<div class='wegas-template-title'><%= this.label || '{label}'%></div>",
        FRACTION: "<div class='wegas-template-fraction'><%= (this.minValue || '{minValue}') + '/' + (this.value || '{label}') + '/' + (this.maxValue || '{maxValue}') %></div>"
    },
    engine = new Y.Template(Y.Template.Micro),
            undefinedToEmpty = function(value) {
        return Y.Lang.isUndefined(value) ? "" : "" + value;
    };
    /**
     * @name Y.Wegas.Template
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
     * @class
     * @constructor
     * @description  Display  Wegas variables instance (or/and descriptor) under
     * specifique templates : text, title, box, fraction and valuebox.
     * It is also possible to create a custom template.
     */
    Y.namespace("Wegas").Template = Y.Base.create("wegas-template", Y.Widget,
            [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /*@lends Y.Wegas.Template#*/
        TEMPLATES: {
            text: engine.compile(TEMPLATE.TEXT),
            box: engine.compile(TEMPLATE.BOX),
            valuebox: engine.compile(TEMPLATE.VALUEBOX),
            title: engine.compile(TEMPLATE.TITLE),
            fraction: engine.compile(TEMPLATE.FRACTION)
        },
        renderUI: function() {
            this.set("variable", this.get("variable"));
        },
        syncUI: function() {
            var template = this.get("custom"), hashCode = "" + Y.Wegas.Helper.hashCode(template),
                    data = this.computeData();
            if (template === "" && this.TEMPLATES[this.get("template")]) {
                this.get("contentBox").setHTML(this.TEMPLATES[this.get("template")](data));
            } else {
                if (Y.Lang.isUndefined(this.TEMPLATES[hashCode])) {
                    this.TEMPLATES[hashCode] = engine.compile(template);
                }
                try {
                    this.get("contentBox").setHTML(this.TEMPLATES[hashCode](data));
                } catch (e) {
                    Y.log("Error rendering template: " + template, "error", "Wegas.Template");
                }
            }

        },
        bindUI: function() {
            this.after(["dataChange", "variableChange", "templateChange"], this.syncUI);
            this.vdUpdateHandler = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
        },
        computeData: function() {
            var data = {}, desc = this.get("variable.evaluated");

            if (desc) {

                if (desc instanceof Y.Wegas.persistence.ListDescriptor && desc.get("currentItem")) {       // If the widget is a list,
                    desc = desc.get("currentItem");                             // display it with the current list and the current element
                }

                data.label = undefinedToEmpty(desc.getPublicLabel());
                data.value = undefinedToEmpty(desc.getInstance().get("value"));
                data.maxValue = undefinedToEmpty(desc.get("maxValue"));
                data.minValue = undefinedToEmpty(desc.get("minValue"));
                data.defaultValue = undefinedToEmpty(desc.get("defaultValue"));
                data.variable = desc;
            }
            return Y.mix(Y.merge(this.get("data")), data, false, null, 0, true);
        },
        destructor: function() {
            this.vdUpdateHandler.detach();
        }

    }, {
        /*@lends Y.Wegas.Template*/
        EDITORNAME: "Variable template",
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable"
                }
            },
            template: {
                type: "string",
                value: "text",
                choices: [{
                        value: "text"
                    }, {
                        value: "title"
                    }, {
                        value: "box"
                    }, {
                        value: "valuebox"
                    }, {
                        value: "fraction"
                    }],
                _inputex: {
                    label: "Predefined template"
                }
            },
            custom: {
                type: "string",
                optional: true,
                value: "",
                _inputex: {
                    label: "Custom template",
                    description: "Takes precedence over predefined templates",
                    _type: "text"
                }
            },
            data: {
                value: {},
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                    _type: "object",
                    useButtons: true,
                    required: false
                }
            }
        }
    });
});
