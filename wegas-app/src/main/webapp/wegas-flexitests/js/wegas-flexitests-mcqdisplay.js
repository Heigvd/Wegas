/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-flexitests-mcqdisplay", function(Y) {
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
            this.choices = null;
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
            this.generators[this.get("responseType")].apply(this);
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        bindUI: function() {
            this.get("contentBox").delegate("click", function(e) {
                e.halt(true);
                this.fire("clientResponse", {value: e.currentTarget.getData("reference")});
            }, "." + this.getClassName("input") + " > span", this);
            this.get("contentBox").one("." + this.getClassName("input")).delegate("change", function(e) {
                e.halt(true);
                this.fire("clientResponse", {value: e.target.getDOMNode().value});
                e.target.getDOMNode().value = INITIALVALUE;
            }, "select", this);
            this.events.push(this.get("root").get("boundingBox").after("keypress", function(e) {
                this.keyPressed(String.fromCharCode(e.keyCode));
            }, this));
        },
        keyPressed: function(charCode) {
            var choice;
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
            this.fire("clientResponse", {value: this.choices[choice].get("label")});
        },
        success: function(time) {
            if (+this.get("feedback") > 0) {
                this.get("contentBox").one("." + this.getClassName("feedback")).setContent("<i style='color:lightgreen'>GOOD: " + time + " ms</i>");
                Y.later(+this.get("feedback"), this, this.clearFeedBack);
            }
        },
        error: function(time) {
            if (+this.get("feedback") > 0) {
                this.get("contentBox").one("." + this.getClassName("feedback")).setContent("<i style='color:red'>BAD: " + time + "ms</i>");
                Y.later(+this.get("feedback"), this, this.clearFeedBack);
            }
        },
        clearFeedBack: function() {
            this.get("contentBox").one("." + this.getClassName("feedback")).empty();
        },
        generators: {
            link: function() {
                var cb = this.get("contentBox"),
                        inputDiv = cb.one("." + this.getClassName("input")),
                        question = this.get("variable.evaluated");
                inputDiv.empty();
                for (var i in question.get("items")) {
                    inputDiv.append("<span data-reference='" + question.get("items")[i].get("label") + "'>" + question.get("items")[i].get("description") + "</span><br/>");
                }
            },
            selector: function() {
                var cb = this.get("contentBox"),
                        inputDiv = cb.one("." + this.getClassName("input")),
                        question = this.get("variable.evaluated");
                inputDiv.empty();
                inputDiv.append("<select><option value='" + INITIALVALUE + "'>Choose:</option></select>");
                inputDiv = inputDiv.get("firstChild");
                for (var i in question.get("items")) {
                    inputDiv.append("<option value='" + question.get("items")[i].get("label") + "'>" + question.get("items")[i].get("description") + "</option>");
                }
            },
            key: function() {
                this.choices = this.get("variable.evaluated").get("items");
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
        EDITORNAME: "MCQ Display",
        ATTRS: {
            feedback: {
                value: 1000,
                type: "number",
                _inputex: {
                    label: "Feedback time (ms).<br/> 0 or less to disable"
                }
            },
            responseType: {
                value: "link",
                type: "string",
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
                    _type: "variableselect"
                }
            }
        }
    });
});

