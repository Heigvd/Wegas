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
YUI.add("wegas-flexitests-mcqdisplay", function(Y) {
    "use strict";
    var INITIALVALUE = "flexi_initial_value";

    Y.namespace('Wegas').FlexitestsMCQ = Y.Base.create("wegas-flexitests-mcqdisplay", Y.Widget,
            [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
                
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        initializer: function() {
            this.events = [];
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        renderUI: function() {
            var cb = this.get("contentBox");
            cb.append("<div class='" + this.getClassName("feedback") + "'></div>");
            cb.append("<div class='" + this.getClassName("input") + "'></div>");
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        syncUI: function() {
            if (this.get("variable.evaluated")) {
                this.generators[this.get("responseType")].apply(this);
            } else {
                // Display warning
            }
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        bindUI: function() {
            this.events.push(this.get("contentBox").delegate("click", function(e) {
                e.halt(true);
                this.fire("clientResponse", {value: e.currentTarget.getData("reference")});
            }, "." + this.getClassName("input") + " > span", this));
            this.events.push(this.get("contentBox").one("." + this.getClassName("input")).delegate("change", function(e) {
                e.halt(true);
                this.fire("clientResponse", {value: e.target.getDOMNode().value});
                e.target.getDOMNode().value = INITIALVALUE;
            }, "select", this));
            this.events.push(this.get("contentBox").one("." + this.getClassName("input")).delegate("change", function(e) {
                e.halt(true);
                if (e.target.getDOMNode().value) {
                    this.fire("clientResponse", {value: e.target.getDOMNode().value});
                    e.target.getDOMNode().checked = false;
                }
            }, "form", this));
            this.events.push(this.get("root").get("boundingBox").after("keypress", function(e) {
                this.keyPressed(String.fromCharCode(e.keyCode));
            }, this));
        },
        keyPressed: function(charCode) {
            var choice, counter = 0, i;
            if (this.get("responseType") !== "key") {
                return;
            }
            switch (charCode) {
                case "f":
                    choice = 0;
                    break;
                case "h":
                    choice = 1;
                    break;
                default:
                    return;
            }
            for (i in this.get("variable.evaluated").get("properties")) {
                if (counter === choice) {
                    this.fire("clientResponse", {value: i});
                    break;
                }
                counter+=1;
            }

        },
        success: function() {
            if (+this.get("feedback") > 0) {
                this.get("contentBox").one("." + this.getClassName("feedback")).setContent("<span class='flexitests-mcq-good'></span>");
                this.get("contentBox").one("." + this.getClassName("input")).hide();
                Y.later(+this.get("feedback"), this, this.clearFeedBack);
            }
        },
        error: function() {
            if (+this.get("feedback") > 0) {
                this.get("contentBox").one("." + this.getClassName("feedback")).setContent("<span class='flexitests-mcq-wrong'></span>");
                this.get("contentBox").one("." + this.getClassName("input")).hide();
                Y.later(+this.get("feedback"), this, this.clearFeedBack);
            }
        },
        clearFeedBack: function() {
            try {
                this.get("contentBox").one("." + this.getClassName("feedback")).empty();
                this.get("contentBox").one("." + this.getClassName("input")).show();
            } catch (e) {
                //page changed?
            }
        },
        save: function(el) {
            var id = el.index;
            delete el.index;
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify({
                        "@class": "Script",
                        "language": "JavaScript",
                        "content": "store(" + this.get("variable.evaluated").get("name") + ",'" + id + "','" + Y.JSON.stringify(el) + "');"
                    })
                },
                on: {
                    failure: Y.bind(function(e) {
                        Y.log("error", "Failed to store data", "Y.Wegas.FlexitestsMCQ");
                    }, this)
                }
            });
        },
        generators: {
            link: function() {
                var cb = this.get("contentBox"),
                        inputDiv = cb.one("." + this.getClassName("input")),
                        question = this.get("variable.evaluated");
                inputDiv.empty();
                for (var i in question.get("properties")) {
                    inputDiv.append("<span data-reference='" + i + "'>" + question.get("properties")[i] + "</span><br/>");
                }
            },
            selector: function() {
                var cb = this.get("contentBox"),
                        inputDiv = cb.one("." + this.getClassName("input")),
                        question = this.get("variable.evaluated"),
                        engine = new Y.Template(Y.Template.Micro),
                        render = engine.compile("<select><option value='" + INITIALVALUE + "'>Choose:</option>" +
                        "<% for(var i in this.get('properties')){ %>" +
                        "<option value='<%= i%>'><%= this.get('properties')[i] %></option>" +
                        "<% } %></select>");
                inputDiv.empty();
                inputDiv.append(render(question));
            },
            key: function() {
                this.get("contentBox").one("." + this.getClassName("input")).empty();
            },
            radio: function() {
                var cb = this.get("contentBox"),
                        inputDiv = cb.one("." + this.getClassName("input")),
                        question = this.get("variable.evaluated"),
                        engine = new Y.Template(Y.Template.Micro),
                        render = engine.compile("<form>" +
                        "<% for(var i in this.get('properties')){ %>" +
                        "<label><input type='radio' name='mcq-flexi-radio' value='<%= i %>'><span><%= this.get('properties')[i] %></span></label>" +
                        "<% } %>" +
                        "</form>");
                inputDiv.empty();
                inputDiv.append(render(question));
            }
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        destructor: function() {
            for (var i in this.events) {
                this.events[i].detach();
            }
        }
    }, {
        EDITORNAME: "Flexitests MCQ Display",
        ATTRS: {
            feedback: {
                value: 1000,
                type: "number",
                _inputex: {
                    label: "Feedback duration (ms)",
                    description: "0 or less to disable."
                }
            },
            responseType: {
                value: "link",
                type: "string",
                _inputex: {
                    label: "Response layout"
                },
                choices: [
                    {
                        value: "link",
                        label: "Link"
                    },
                    {
                        value: "selector",
                        label: "Selector"
                    },
                    {
                        value: "key",
                        label: "Keyboard F/H"
                    },
                    {
                        value: "radio",
                        label: "Horizontal scale"
                    }
                ]
            },
            variable: {
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    legend: "Store results",
                    classFilter: ["ObjectDescriptor"]
                }
            }
        }
    });
});

