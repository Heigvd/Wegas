/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-console-custom', function(Y) {
    'use strict';
    var Wegas = Y.Wegas,
        TEST = 'PMGHelper.sendMessage(${"type":"string", "label":"From"}, ${"type":"string", "label":"Subject"}, ${"type":"html", "label":"Body", "required":true}, []);',
        running = false,
        CONTENTBOX = "contentBox",
        inputEx = Y.inputEx,
        PARSER = {
            regExp: /\$(\{[^}]*})/g,
            genConfig: function(txt) {
                var ret = [], regexp = PARSER.regExp,
                    match = regexp.exec(txt);
                while (match !== null) {
                    ret.push(Y.JSON.parse(match[1]));
                    match = regexp.exec(txt);
                }
                return ret;

            },
            genResult: function(txt, val) {
                var i = 0, cfg = PARSER.genConfig(txt);
                return txt.replace(PARSER.regExp, function() {
                    i += 1;
                    if (cfg[i - 1].type === "string" || cfg[i - 1].type === "html") {
                        return Y.JSON.stringify(val[i - 1]);
                    }
                    return val[i - 1];
                });
            }
        },
        validateItem = function(item) {
            //0 a valid falsy value
            return item === 0 ? true : !!item;
        },
        Console = Y.Base.create("wegas-console-custom",
            Y.Widget,
            [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
                BOUNDING_TEMPLATE: '<div class="wegas-form"></div>',
                renderUI: function() {
                    var cb = this.get(CONTENTBOX), cfg = {
                        type: "group",
                        parentEl: cb,
                        fields: Y.Array.map(this.get("customImpacts"), function(item) {
                            return {
                                type: "group",
                                legend: item[0],
                                fields: PARSER.genConfig(item[1])
                            };
                        })
                    };
                    inputEx.use(cfg, Y.bind(function() {
                        this._form = new inputEx(cfg);
                    }, this));
                    this.srcField = new Y.inputEx.WysiwygScript({
                        parentEl: cb
                    });
                    cb.append('<div><div class="results wegas-advanced-feature"></div><div class="status"></div></div>');
                    Y.one(this.srcField.getEl()).all("div > button").remove();
                },
                viewSrc: function() {
                    this.srcField.viewSrc.fire("click");
                },
                add: function() {
                    this.srcField.addButton.fire("click");
                },
                setStatus: function(status) {
                    this.get(CONTENTBOX).one(".status").set("text", status);
                },
                run: function() {
                    if (running) {
                        return;
                    }
                    if (!this.srcField.validate() || !this.validate()) {
                        this.showMessage("error", "Some fields are invalid", 1000);
                        return;
                    }
                    var script = this.srcField.getValue();
                    script.content = this.extractForm() + ";\n" + script.content;
                    running = true;
                    this.setStatus("Running");
                    Y.Wegas.Facade.Variable.script.run(script, {
                        on: {
                            success: Y.bind(function(e) {
                                running = false;
                                this.hideOverlay();
                                this.get(CONTENTBOX).one(".results").prepend('<div class="result">Script exectuted. Returned value: ' +
                                                                             Y.JSON.stringify(e.response.results.entities[0]) +
                                                                             "</div>");
                                this.setStatus("Impact successfully executed");
                            }, this),
                            failure: Y.bind(function(e) {
                                running = false;
                                this.hideOverlay();
                                this.get(CONTENTBOX).one(".results").prepend('<div class="result error">Error executing script: ' +
                                                                             e.response.results.message + "</div>");
                                this.setStatus("Impact failed");
                            }, this)
                        }
                    }, this.get("player"));
                },
                extractForm: function() {
                    var inputs = this._form.inputs, i, out = [];
                    for (i = 0; i < inputs.length; i += 1) {
                        if (Y.Array.some(inputs[i].getArray(), validateItem)) {
                            out.push(PARSER.genResult(this.get("customImpacts")[i][1], inputs[i].getArray()));
                        }
                    }
                    return out.join(";\n");
                },
                validate: function() {
                    var inputs = this._form.inputs, i, valid = true;
                    for (i = 0; i < inputs.length; i += 1) {
                        if (Y.Array.some(inputs[i].getArray(), validateItem)) {
                            valid = valid && inputs[i].validate();
                        }
                    }
                    return valid;
                },
                destructor: function() {
                    this.srcField.destroy();
                    this.srcField = null;
                    this._form.destroy();
                    this._form = null;
                }
            },
            {
                ATTRS: {
                    player: {},
                    /**
                     * Array of impacts. An impact is an Array [Legend, script template] or a script template.
                     * A script template is a string where `${"type":TYPE, "label":LABEL}` will be replaced by given
                     * value.
                     * ${...} delimiter will be processed as a JSON Object. Properties are inputex field configuration
                     */
                    customImpacts: {
                        value: Y.namespace("Wegas.Config").CustomImpacts,
                        validator: Y.Lang.isArray,
                        setter: function(v) {
                            return Y.Array.map(v, function(i) {
                                return Y.Lang.isArray(i) ? i : [undefined, i];
                            });
                        }
                    }
                }
            });
    Wegas.CustomConsole = Console;

});