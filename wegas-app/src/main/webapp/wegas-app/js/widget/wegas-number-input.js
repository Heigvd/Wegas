/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n, YUI */

/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add("wegas-number-input", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox",
        AbstractNumberInput,
        NumberInput,
        BoxesNumberInput,
        Wegas = Y.Wegas;

    AbstractNumberInput = Y.Base.create(
        "wegas-abstract-number-input",
        Y.Widget,
        [Y.WidgetChild, Wegas.Widget, Wegas.Editable],
        {
            initializer: function() {
                this.handlers = [];
                this._initialValue = undefined;
                this._previousValue = undefined;
                this.publish("save", {
                    emitFacade: true
                });
                this.publish("saved", {
                    emitFacade: true
                });
                this.publish("revert", {
                    emitFacade: true
                });
            },
            bindUI: function() {
                this.on("save", this._save);
            },
            destructor: function() {
                Y.Array.each(this.handlers, function(h) {
                    h.detach();
                });
            },
            _getValue: function() {
                return this.get("variable.evaluated")
                    .getInstance()
                    .get("value");
            },

            _setStatus: function(level, msg) {
                if (msg && level) {
                    this.showMessage(level, msg);
                }
            },
            /**
             * Try to save value.
             * The value must, indeed, be a number and must validate against
             * the descriptor bounds (if provided...).
             * An error message is displayed whether the value could not been saved
             *
             * @param {type} value the new numeric value to save
             * @returns {Boolean} true is the value has been saved, false otherwise
             */
            updateValue: function(raw_value) {
                var desc = this.get("variable.evaluated"),
                    inst = desc.getInstance(),
                    min = desc.get("minValue"),
                    max = desc.get("maxValue"),
                    value = I18n.parseNumber(raw_value, "chf"),
                    cb = this.get("contentBox");
                if (raw_value !== this._previousValue) {
                    this._previousValue = raw_value;
                    if (Y.Lang.isNumber(value)) {
                        if (Y.Lang.isNumber(min)) {
                            if (Y.Lang.isNumber(max)) {
                                if (value < min || value > max) {
                                    // Out of bound
                                    this._setStatus("error",
                                        Y.Wegas.I18n.t("errors.outOfBounds", {
                                            value: I18n.formatNumber(value),
                                            min: I18n.formatNumber(min),
                                            max: I18n.formatNumber(max)
                                        }));
                                    cb.addClass("invalid");
                                    return false;
                                }
                            } else {
                                if (value < min) {
                                    this._setStatus("error",
                                        Y.Wegas.I18n.t("errors.lessThan", {
                                            value: I18n.formatNumber(value),
                                            min: I18n.formatNumber(min)
                                        }));
                                    cb.addClass("invalid");
                                    return false;
                                }
                            }
                        } else if (Y.Lang.isNumber(max)) {
                            this._setStatus("error",
                                Y.Wegas.I18n.t("errors.greaterThan", {
                                    value: I18n.formatNumber(value),
                                    max: I18n.formatNumber(max)
                                }));
                            cb.addClass("invalid");
                            return false;
                        }

                        this._setStatus("ok", "");
                        cb.removeClass("invalid");
                        if (inst.get("value") !== value) {
                            if (this.get("selfSaving")) {
                                cb.addClass("loading");
                            }
                            this.fire("save", {
                                descriptor: desc,
                                value: value
                            });
                        } else {
                            this.fire("revert", {
                                descriptor: desc,
                                value: value
                            });
                        }
                        return true;
                    } else {
                        cb.addClass("invalid");
                        this._setStatus("error",
                            Y.Wegas.I18n.t("errors.nan", {value: raw_value}
                            ));
                        return false;
                    }
                } else {
                    this.fire("revert", {
                        descriptor: desc,
                        value: value
                    });
                }
            },
            _saved: function(value) {
                var desc = this.get("variable.evaluated");
                this.fire("saved", {
                    descriptor: desc,
                    value: value
                });

                if (this.waitForValue === value) {
                    this.waitForValue = null;
                    if (this.queuedValue) {
                        this.processSave(
                            this.queuedValue.value,
                            this.queuedValue.descriptor
                            );
                    }
                }
            },
            _save: function(e) {
                var value = e.value;
                if (this.get("selfSaving")) {
                    if (!this.waitForValue) {
                        this.processSave(value, e.descriptor);
                    } else {
                        this.queuedValue = {
                            value: value,
                            descriptor: e.descriptor
                        };
                    }
                } else {
                    this._initialValue = value;
                    e.descriptor.getInstance().set("value", value);
                    this._saved(value);
                    this.syncUI();
                }
            },
            processSave: function(value, descriptor) {
                var cb = this.get("contentBox"),
                    theVar = descriptor.getInstance();

                this.waitForValue = value;
                this._initialValue = value;
                theVar.set("value", value);

                Wegas.Facade.Variable.script.remoteEval(
                    "Variable.find(gameModel, \"" +
                    descriptor.get("name") +
                    "\").setValue(self, " +
                    value +
                    ");",
                    {
                        on: {
                            success: Y.bind(function() {
                                cb.removeClass("loading");
                                this._saved(value);
                            }, this),
                            failure: Y.bind(function() {
                                cb.removeClass("loading");
                                this._saved(value);
                            }, this)
                        }
                    }
                );
            }
        },
        {
            /** @lends Y.Wegas.AbstractNumberInput */
            EDITORNAME: "AbstractNumberInput",
            ATTRS: {
                label: {
                    type: "string",
                    optional: true,
                    index: 0,
                    view: {
                        label: "Label"
                    }
                },
                /**
                 * The target variable, returned either based on the name attribute,
                 * and if absent by evaluating the expr attribute.
                 */
                variable: {
                    type: "object",
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    index: 1,
                    view: {
                        type: "variableselect",
                        label: "Variable",
                        classFilter: ["NumberDescriptor"]
                    }
                },
                readonly: {
                    getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    type: "object",
                    index: 100,
                    value: {
                        "@class": "Script",
                        "content": "false;"
                    },
                    optional: true,
                    view: {
                        type: "scriptcondition",
                        label: "Read Only"
                    }
                },
                selfSaving: {
                    type: "boolean",
                    value: true,
                    optional: true,
                    index: 109,
                    view: {
                        label: "Self saving"
                    }
                }
            }
        }
    );
    Wegas.AbstractNumberInput = AbstractNumberInput;

    /**
     * Simple Number input
     *  -> input
     *  -> slider if number has lower and upper bounds
     */
    NumberInput = Y.Base.create(
        "wegas-number-input",
        Y.Wegas.AbstractNumberInput,
        [],
        {
            CONTENT_TEMPLATE: "<div>" +
                "  <div class=\"wegas-input-label\"></div>" +
                "  <div class=\"wegas-input-body\">" +
                "    <div class=\"wegas-input-slider\"></div>" +
                "    <div class=\"wegas-input-container\">" +
                "      <input class=\"wegas-input\" />" +
                "    </div>" +
                "    <div class=\"wegas-input-status\"></div>" +
                "  </div>" +
                "</div>",
            initializer: function() {
                this.xSlider = null;
                this.publish("editing", {
                    emitFacade: true
                });
            },
            _setStatus: function(level, msg) {
                var statusDiv = this.get("contentBox").one(".wegas-input-status");
                statusDiv.setHTML("<span class='status-" + level + "'>" + msg + "</span>");

            },
            renderUI: function() {
                var desc = this.get("variable.evaluated"),
                    inst = desc.getInstance(),
                    CB = this.get("contentBox"),
                    value, fmtValue,
                    min, max;
                this._descriptor = desc;

                if (this.get('label')) {
                    CB.one('.wegas-input-label').setContent(this.get('label'));
                }

                value = +inst.get("value");
                fmtValue = I18n.formatNumber(value);
                if (!this.get("readonly.evaluated")) {
                    min = desc.get("minValue");
                    max = desc.get("maxValue");
                    if (Y.Lang.isNumber(min) && Y.Lang.isNumber(max)) {
                        this.xSlider = new Y.Slider({
                            min: min,
                            max: max,
                            value: value
                        }).render(CB.one(".wegas-input-slider"));

                        this.xSlider.get("contentBox").one(".yui3-slider-rail").setAttribute("data-value", fmtValue);
                        this.get(CONTENTBOX)
                            .one(".wegas-input-slider .yui3-slider-rail-cap-left")
                            .setAttribute("data-value", I18n.formatNumber(min));
                        this.get(CONTENTBOX)
                            .one(".wegas-input-slider .yui3-slider-rail-cap-right")
                            .setAttribute("data-value", I18n.formatNumber(max));

                        this.get(CONTENTBOX).addClass("hide-input");
                        this.get(CONTENTBOX)
                            .one(".wegas-input")
                            .set("disabled", true);
                    }
                } else {
                    this.get(CONTENTBOX)
                        .one(".wegas-input-container")
                        .setContent("<p>" + fmtValue + "</p>");
                }
            },
            syncUI: function() {
                var desc = this.get("variable.evaluated"),
                    inst = desc.getInstance(),
                    CB = this.get("contentBox"),
                    value = inst.get("value"),
                    fmtValue = I18n.formatNumber(value);

                if (!this.get("readonly.evaluated")) {
                    if (this._initialValue !== value) {
                        // Skip this syncUI if the user has continued typing during the save:
                        var snapshot = I18n.parseNumber(CB.one(".wegas-input").get("value"));
                        if (this._initialValue !== undefined && snapshot !== value &&
                            // But do the syncUI anyway if the variable was updated by another means than this input field:
                            this._initialValue != snapshot) {
                            //Y.log("*** Number input: different syncUI(" + value + ") vs. " + snapshot);
                            return;
                        }

                        this._initialValue = value;

                        CB.one(".wegas-input").set("value", fmtValue);
                        if (this.xSlider && this.xSlider.get("value") !== inst.get("value")) {
                            this.xSlider.get("contentBox").one(".yui3-slider-rail")
                                .setAttribute("data-value", fmtValue);
                            this.xSlider.set("value", inst.get("value"));
                        }
                    }
                } else {
                    this.get(CONTENTBOX)
                        .one(".wegas-input-container")
                        .setContent("<p>" + fmtValue + "</p>");
                }
            },
            bindUI: function() {
                var input = this.get(CONTENTBOX).one(".wegas-input");
                NumberInput.superclass.constructor.prototype.bindUI.call(this);
                this.handlers.push(
                    Y.Wegas.Facade.Variable.after("update", this.syncUI, this)
                    );
                if (this.xSlider) {
                    this.handlers.push(
                        this.xSlider.after(
                            "slideEnd",
                            this.updateFromSlider,
                            this
                            )
                        );
                    this.handlers.push(
                        this.xSlider.after(
                            "railMouseDown",
                            this.updateFromSlider,
                            this
                            )
                        );
                    this.handlers.push(
                        this.xSlider.after(
                            "valueChange",
                            this.updateInput,
                            this
                            )
                        );
                }
                if (input) {
                    //this.handlers.push(input.on("blur", this.updateFromInput, this));
                    this.handlers.push(
                        input.on("valuechange", this.onValueChange, this)
                        );
                }
            },
            destructor: function() {},
            updateInput: function() {
                var input = this.get(CONTENTBOX).one(".wegas-input"),
                    value = this.xSlider.get("value"),
                    fmtValue = I18n.formatNumber(value);

                this.xSlider.get("contentBox").one(".yui3-slider-rail").setAttribute("data-value", fmtValue);

                //this.updateValue(value);
                input.set("value", fmtValue);
            },
            updateFromSlider: function() {
                var value = this.xSlider.get("value");

                this.updateValue(value);
            },
            onValueChange: function() {
                var input = this.get(CONTENTBOX).one("input"),
                    value = input.get("value");
                this.fire("editing", {
                    descriptor: this._descriptor,
                    value: value
                });
                this.updateFromInput();
            },
            updateFromInput: function() {
                var input = this.get(CONTENTBOX).one(".wegas-input");

                if (this.wait) {
                    this.wait.cancel();
                }
                if (this.get("selfSaving")) {
                    this.wait = Y.later(750, this, function() {
                        this.wait = null;
                        this.updateValue(input.get("value")); // Make sure to grab the very latest state of user input
                    });
                } else {
                    this.updateValue(input.get("value"));
                }
            }
        },
        {
            /** @lends Y.Wegas.NumberInput */
            EDITORNAME: "NumberInput"
        }
    );
    Wegas.NumberInput = NumberInput;

    /**
     * Boxes Number input
     * Number must be bounded
     */
    BoxesNumberInput = Y.Base.create(
        "wegas-boxes-number-input",
        Y.Wegas.AbstractNumberInput,
        [],
        {
            CONTENT_TEMPLATE: "<div>" +
                "<div class=\"wegas-input-label\"></div>" +
                "<div class=\"wegas-input-body\">" +
                "  <div class=\"boxes\"></div>" +
                "  <div style=\"clear: both;\"></div>" +
                "</div>" +
                "</div>",
            initializer: function() {},
            renderUI: function() {
                var boxes = this.get(CONTENTBOX).one(".boxes"),
                    desc = this.get("variable.evaluated"),
                    min = desc.get("minValue"),
                    max = desc.get("maxValue"),
                    n = max - min + 1,
                    i;

                if (this.get("label")) {
                    this.get("contentBox")
                        .one(".wegas-input-label")
                        .setContent(this.get("label"));
                }

                if (n < 100) {
                    if (Y.Lang.isNumber(min) && Y.Lang.isNumber(max)) {
                        for (i = min; i <= max; i += 1) {
                            boxes.append(
                                "<div class=\"box\" data-value=\"" +
                                i +
                                "\" data-position=\"\"><div class=\"value\">" +
                                I18n.formatNumber(i) +
                                "</div></div>"
                                );
                        }
                    } else {
                        boxes.setContent("<p class=\"error\">Variable is not bounded !</p>");
                    }
                }
            },
            syncUI: function() {
                var boxes = this.get(CONTENTBOX).one(".boxes"),
                    desc = this.get("variable.evaluated"),
                    min = desc.get("minValue"),
                    max = desc.get("maxValue"),
                    value = desc.getInstance().get("value"),
                    i,
                    box,
                    pos;

                this._readonly = this.get("readonly.evaluated");

                /*
                 * Let set clickable class according to _readonly status:
                 * ro | hasCl | will Have class
                 *  0 | 0     | 1   (== !hasClass)
                 *  0 | 1     | 1   (== hasClass)
                 *  1 | 0     | 0   (== hasClass)
                 *  1 | 1     | 0   (== !hasClass)
                 *
                 *  if ro !== hasCl -> toogle
                 */
                if (boxes.hasClass("clickable") !== !this._readonly) {
                    boxes.toggleClass("clickable");
                }

                if (true || this._initialValue !== value) {
                    // @Hack since this._initialValue already has the new value
                    this._initialValue = value;

                    if (Y.Lang.isNumber(min) && Y.Lang.isNumber(max)) {
                        for (i = min; i <= max; i += 1) {
                            box = boxes.one("[data-value=\"" + i + "\"]");
                            if (box) {
                                if (i < value) {
                                    pos = "below";
                                } else if (i === value) {
                                    pos = "value";
                                } else {
                                    pos = "above";
                                }
                                box.setAttribute("data-position", pos);
                            }
                        }
                    }
                }
            },
            bindUI: function() {
                BoxesNumberInput.superclass.constructor.prototype.bindUI.call(
                    this
                    );
                this.handlers.push(
                    Y.Wegas.Facade.Variable.after("update", this.syncUI, this)
                    );
                this.handlers.push(
                    this.get(CONTENTBOX).delegate(
                    "click",
                    this.onBoxClick,
                    ".box",
                    this
                    )
                    );
            },
            destructor: function() {},
            onBoxClick: function(e) {
                var value;
                if (!this._readonly) {
                    value = e.currentTarget.getAttribute("data-value");
                    this.updateValue(value);
                }
            }
        },
        {
            /** @lends Y.Wegas.BoxesNumberInput */
            EDITORNAME: "BoxesNumberInput"
        }
    );
    Wegas.BoxesNumberInput = BoxesNumberInput;
});
