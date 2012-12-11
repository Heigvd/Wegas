/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add("wegas-inputex-variableselect", function (Y) {
    "use strict";

    var inputEx = Y.inputEx;

    /**
     * @class inputEx.Variableselect
     * @extends inputEx.StringGroup
     **/
    Y.namespace("inputEx.Wegas").Variableselect = function (options) {
        inputEx.Wegas.Variableselect.superclass.constructor.call(this, options);
    };
    Y.extend(inputEx.Wegas.Variableselect, inputEx.Group,  {
        setOptions: function (options) {
            inputEx.Wegas.Variableselect.superclass.setOptions.call(this, options);
            this.options.mode = options.mode || "wysiwyg";
            this.options.label = options.label;
            this.options.fields = [{
                type: 'variabledescriptorgetter',
                name: 'id'
            }, {
                type: 'text',
                name: 'expr',
                required: true
            }];
        },
        setValue: function (val, fireUpdatedEvent) {
            var findVal;
            inputEx.Wegas.Variableselect.superclass.setValue.call(this, val, fireUpdatedEvent);
            if (val.name) {
                findVal = Y.Wegas.VariableDescriptorFacade.rest.find('name', val.name);
            } else if (val.expr) {
                this.setMode("text");
                this.inputs[1].el.value =  val.expr;
                return;
            } else if (val.id) {
                findVal = Y.Wegas.VariableDescriptorFacade.rest.find('id', val.id);
            }
            this.inputs[0].setValue(findVal.get("id"));                         // @fixme
        },
        renderFields: function () {
            inputEx.Wegas.Variableselect.superclass.renderFields.apply(this, arguments);
            this.options.mode = "text";
            this.viewSrc = new Y.Wegas.Button({                                 // Add the "view src" button
                label: "<span class=\"wegas-icon wegas-icon-viewsrc\"></span>"
            });
            this.options.mode = "text";
            this.setMode((this.options.mode === "wysiwyg") ? "text" : "wysiwyg");
            this.viewSrc.after("click", function () {
                if (!this.viewSrc.get("disabled")) {
                    if (this.options.mode === "wysiwyg") {                      // If current mode is wysiwyg
                        this.updateTextarea();                                  // update textatea content
                    } else {
                        this.updateExpressionList();
                    }
                    this.setMode((this.options.mode === "wysiwyg") ? "text" : "wysiwyg");
                }
            }, this);
            this.viewSrc.render(this.fieldset);

            var container = new Y.Node(this.fieldset);                          // Render a div where the wysiwyg list will be rendered
            container.prepend(this.viewSrc.get("boundingBox"));
        },
        setMode: function (mode) {
            var wysiwygmode = (mode === "wysiwyg");

            this.options.mode = mode;
            this.viewSrc.set("selected", wysiwygmode ? 0 : 1);

            if (wysiwygmode) {
                this.inputs[0].show();
                this.inputs[1].hide();
            } else {
                this.inputs[0].hide();
                this.inputs[1].show();
            }

        },
        updateTextarea: function () {
            if (this.options.mode === "wysiwyg") {                              // If current mode is wysiwyg
                this.inputs[1].el.value =  this.getValue().id;                  // update textatea content
            }
        },
        updateExpressionList: function () {
            var tree, newVal = null, valObj = {};

            try {
                tree = window.esprima.parse(this.inputs[1].el.value, {                    // Generate the syntaxic tree using esprima
                    raw: true
                });
                if (tree.body[0].expression.callee && tree.body[0].expression.arguments) {
                    if (tree.body[0].expression.callee.object.name === "VariableDescriptorFacade"  &&
                        tree.body[0].expression.callee.property.name === "find" &&
                        tree.body[0].expression.arguments[0].value !== null) {
                        newVal = Y.Wegas.VariableDescriptorFacade.rest.find('id', tree.body[0].expression.arguments[0].value);
                    }
                }
                if (newVal !== null) {
                    valObj.id = newVal.get("id");
                    this.setValue(valObj);
                    this.setMode("text");
                } else {
                    this.setMode("wysiwyg");
                }

            } catch (e) {
                this.fire("exception", e.response.results);
            }
        },
        destroy: function () {
            inputEx.Wegas.Variableselect.superclass.destroy.call(this);
            this.viewSrc.destroy();
        }

    });

    inputEx.registerType("variableselect", inputEx.Wegas.Variableselect);             // Register this class as "wegasurl" type
});
