/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add("wegas-number-input", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", NumberInput, Wegas = Y.Wegas;


    NumberInput = Y.Base.create("wegas-number-input", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        CONTENT_TEMPLATE: "<div>" +
            "<div class=\"wegas-input-slider\"></div>" +
            "<div class=\"wegas-input-container\">" +
            "<input class=\"wegas-input\" />" +
            "</div>" +
            "</div>",
        initializer: function() {
            this.handlers = [];
            this.xSlider = null;
        },
        renderUI: function() {
        },
        syncUI: function() {
            var desc = this.get("variable.evaluated"),
                inst = desc.getInstance(),
                CB = this.get("contentBox");

            if (!this.get("readonly.evaluated")) {
                CB.one(".wegas-input").set("value", inst.get("value"));
                if (Y.Lang.isNumber(desc.get("minValue")) && Y.Lang.isNumber(desc.get("maxValue"))) {
                    if (!this.xSlider) {
                        this.xSlider = new Y.Slider({
                            min: desc.get("minValue"),
                            max: desc.get("maxValue"),
                            value: +inst.get("value")
                        }).render(CB.one(".wegas-input-slider"));
                    }
                }
            } else {
                this.get(CONTENTBOX).one(".wegas-input-container").setContent('<p>' +
                    inst.get("value") + '</p>');
            }

        },
        bindUI: function() {
            var input = this.get(CONTENTBOX).one(".wegas-input");
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
            if (this.xSlider) {
                this.handlers.push(this.xSlider.after("valueChange", this.updateInput, this));
            }
            if (input) {
                this.handlers.push(input.on("blur", this.updateSlider, this));
            }
        },
        destructor: function() {
            Y.Array.each(this.handlers, function(h) {
                h.detach();
            });
        },
        updateValue: function(value) {
            var desc = this.get("variable.evaluated"),
                inst = desc.getInstance();


            if ((Y.Lang.isNumber(desc.get("minValue")) && value < desc.get("minValue")) ||
                (Y.Lang.isNumber(desc.get("maxValue")) && value > desc.get("maxValue"))) {
                this.showMessage("error", "Number is out of bound");
                return false;
            }
            inst.set("value", value);
            /*if (this.wait) {
                this.wait.cancel();
            }*/
            /*this.wait = Y.later(750, this, function() {
                this.wait = null;*/
                Y.Wegas.Facade.Variable.cache.put(inst.toObject());
            //});
            return true;
        },
        updateInput: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-input"),
                value = this.xSlider.get("value");

            if (this.updateValue(value)) {
                input.set("value", value);
            }
        },
        updateSlider: function(e) {
            var input = this.get(CONTENTBOX).one(".wegas-input"),
                data = input.getData(),
                value = +input.get("value");

            if (data.wait) {
                data.wait.cancel();
            }
            data.wait = Y.later(200, this, function() {
                data.wait = null;
                if (this.updateValue(value)) {
                    if (this.xSlider) {
                        this.xSlider.set("value", value);
                    }
                }
            });
        }
    }, {
        /** @lends Y.Wegas.NumberInput */
        EDITORNAME: "NumberInput",
        ATTRS: {
            /**
             * The target variable, returned either based on the name attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    label: "variable",
                    classFilter: ["NumberDescriptor"]
                }
            },
            readonly: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                type: "boolean",
                value: false,
                optional: true,
                _inputex: {
                    _type: "script",
                    expects: "condition"
                }
            }
        }
    });

    Wegas.NumberInput = NumberInput;
});
