/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add('wegas-console-custom', function(Y) {
    'use strict';
    var Wegas = Y.Wegas,
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
                    if (cfg[i - 1].type === "string" || cfg[i - 1].type === "html" || cfg[i - 1].type === "flatvariableselect") {
                        return Y.JSON.stringify(val[i - 1]);
                    } else if (cfg[i - 1].type === "number") {
                        if (Y.Lang.isNumber(val[i - 1])) {
                            return +val[i - 1];
                        } else {
                            return undefined;
                        }
                    } else {
                        return val[i - 1];
                    }
                });
            }
        },
        validateItem = function(item) {
            return Y.Array.indexOf(["", undefined, null], item) === -1;
        },
        Console = Y.Base.create("wegas-console-custom",
            Y.Widget,
            [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
            BOUNDING_TEMPLATE: '<div class="wegas-form"></div>',
            renderUI: function() {
                var cb = this.get(CONTENTBOX), menu, contents, contentBasics, contentAdvanced, cfg;
                if (this.get("customImpacts").length > 0) {
                    menu = cb.append("" +
                        "<div class='modal--menu" + (this.get("showAdvancedImpacts") ? "" : " wegas-advanced-feature") + "'>" +
                        "<button id='basics-impacts-btn' class='modal--tab-btn modal--tab-btn-selected'>Basic impacts</button>" +
                        "<button id='advanced-impacts-btn' class='modal--tab-btn" + (this.get("showAdvancedImpacts") ? "" : " wegas-advanced-feature") + "'>Advanced impacts</button>" +
                        "</div>").one(".modal--menu");

                    contents = cb.append("" +
                        "<div class='modal--content-tabs'>" +
                        "<div class='modal--content-basics modal--content-tab modal--content-selected'></div>" +
                        "<div class='modal--content-advanced modal--content-tab'><div class='content-advanced-script'></div></div>" +
                        "</div>");
                    contentBasics = cb.one(".modal--content-basics");
                    contentAdvanced = cb.one(".modal--content-advanced .content-advanced-script");

                    // _inputex: to be destroyed
                    cfg = {
                        type: "group",
                        parentEl: contentBasics,
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
                } else {
                    cb.addClass("modal--content-advanced modal--without-menu");
                    cb.append("<div class='content-advanced-script'></div>");
                    contentAdvanced = cb.one(".content-advanced-script");
                }
                // this.srcField = new Y.inputEx.WysiwygScript({
                //     parentEl: contentAdvanced
                // });
                Y.Wegas.RForm.Script.MultiVariableMethod({}, contentAdvanced.getDOMNode()).then(function(o) {
                    this.srcField = o;
                }.bind(this));
                cb.append(
                    '<div class="wegas-status-bar wegas-status-bar-hidden"><div class="results wegas-advanced-feature"></div><div class="status"></div></div>');
                // Remove buttons for advanced features (view source, etc).
                // Y.one(this.srcField.getEl()).all("div > button").remove();
                // Correct small scrollbar issue after rendering:
                if (cb.one('.modal--content-tab'))
                    setTimeout(function() {
                        cb.one('.modal--content-tab').setStyle('overflowY', 'auto')
                    }, 1000);
            },
            bindUI: function() {
                Y.Wegas.Facade.Variable.on("WegasOutOfBoundException", function(e) {
                    var message;
                    if (e.value < e.min) {
                        message = e.variableName + " can not be less than " + e.min;
                    } else {
                        if (e.value > e.max) {
                            message = e.variableName + " can not be more than " + e.max;
                        } else {
                            message = "Something's wrong with " + e.variableName;
                        }
                    }
                    this.setStatus(message);
                    e.halt();
                }, this);
                this.get(CONTENTBOX).delegate("click", function(e) {
                    var modalContent = this.get(CONTENTBOX).one(".modal--content-selected");
                    if (!modalContent.hasClass("modal--content-basics")) {
                        modalContent.removeClass("modal--content-selected");
                        this.get(CONTENTBOX).one(".modal--content-basics").addClass("modal--content-selected");
                        this.get(CONTENTBOX).one(".modal--tab-btn-selected").removeClass("modal--tab-btn-selected");
                        this.get(CONTENTBOX).one("#basics-impacts-btn").addClass("modal--tab-btn-selected");
                    }
                }, "#basics-impacts-btn", this);
                this.get(CONTENTBOX).delegate("click", function(e) {
                    var modalContent = this.get(CONTENTBOX).one(".modal--content-selected");
                    if (!modalContent.hasClass("modal--content-advanced")) {
                        modalContent.removeClass("modal--content-selected");
                        this.get(CONTENTBOX).one(".modal--content-advanced").addClass("modal--content-selected");
                        this.get(CONTENTBOX).one(".modal--tab-btn-selected").removeClass("modal--tab-btn-selected");
                        this.get(CONTENTBOX).one("#advanced-impacts-btn").addClass("modal--tab-btn-selected");
                    }
                }, "#advanced-impacts-btn", this);
                // this.get(CONTENTBOX).delegate("click", function(e) {
                //     var impacts = this.get(CONTENTBOX).all(".wegas-inputex-variabledescriptorselect-group");

                //     if (impacts.size() < 5) {
                //         this.add();
                //     }
                //     if (impacts.size() === 0) {
                //         this.get(CONTENTBOX).one(".content-advanced-script-add").addClass("secondary");
                //     }
                //     if (impacts.size() === 4) {
                //         e.currentTarget.remove();
                //     }
                // }, ".content-advanced-script-add", this);
                this.get(CONTENTBOX).delegate("keyup", function(e) {
                    if (this.get("value").length > 0) {
                        if (!this.hasClass("selected")) {
                            this.addClass("selected");
                        }
                    } else {
                        if (this.hasClass("selected")) {
                            this.removeClass("selected");
                        }
                    }
                }, "input[type='text']");
            },
            // viewSrc: function() {
            //     this.srcField.viewSrc.fire("click");
            // },
            // add: function() {
            //     this.srcField.addButton.fire("click");
            // },
            setStatus: function(status) {
                this.get(CONTENTBOX).one(".wegas-status-bar .status").set("text", status);
            },
            getBasicsImpactsScript: function() {
                if (!this.validate()) {
                    this.showMessage("error", "Some fields are invalid", 1000);
                    return false;
                }
                return this.extractForm();
            },
            getAdvancedImpactsScript: function() {
                if (this.srcField.validate().length) {
                    this.showMessage("error", "Some fields are invalid", 1000);
                    return false;
                }
                return this.srcField.getValue();
            },
            run: function(modale) {
                var script, tabSelected;
                if (running) {
                    return;
                }
                if (this.get("customImpacts").length > 0) {
                    tabSelected = this.get(CONTENTBOX).one(".modal--content-selected");
                    if (tabSelected.hasClass("modal--content-basics")) {
                        script = this.getBasicsImpactsScript();
                    } else {
                        script = this.getAdvancedImpactsScript();
                    }
                } else {
                    script = this.getAdvancedImpactsScript();
                }
                if (script) {
                    // The script is run sequentially on each player of the "player" argument (single object or array).
                    var arg = this.get("player"),
                        players = (arg.constructor === Array ? arg : [arg]),
                        len = players.length;

                    running = true;
                    this.get(CONTENTBOX).one(".wegas-status-bar").removeClass("wegas-status-bar-hidden");
                    this.get(CONTENTBOX).one(".status").addClass("status--running");

                    var count = 0,
                        succeeded = 0,
                        failed = 0,
                        teamOrPlayer = Y.Wegas.Facade.Game.cache.getCurrentGame().get("properties.freeForAll") ? 'Player ' : 'Team ',
                        contentBox = this.get(CONTENTBOX),
                        resDiv;

                    for (var i = 0; i < len; i++) {
                        var player = players[i];

                        Y.Wegas.Facade.Variable.script.run(script, {
                            on: {
                                success: Y.bind(function(event) {
                                    count++;
                                    succeeded++;
                                    if (len > 1 && failed === 0) {
                                        if (!resDiv) {
                                            resDiv = contentBox.one(".results");
                                            resDiv.removeClass("wegas-advanced-feature");
                                        }
                                        resDiv.setHTML('<div class="result">' + teamOrPlayer + count + '&thinsp;/&thinsp;' + len + '</div>');
                                    }
                                    if (count >= len) { // Last iteration:
                                        contentBox.one(".wegas-status-bar").addClass("wegas-status-bar-transition");
                                        Y.later(200, this, function() {
                                            contentBox.one(".wegas-status-bar").removeClass("wegas-status-bar-transition");
                                            contentBox.one(".status").removeClass("status--running").addClass("status--success");
                                            this.hideOverlay();
                                            contentBox.one(".results").setHTML('<div class="result">Terminated.</div>');
                                            Y.later((failed > 0 ? 5000 : 1000), null, function() {
                                                if (modale) {
                                                    modale.close();
                                                }
                                                running = false;
                                            });
                                        });
                                    }
                                }, this),
                                failure: Y.bind(function(e) {
                                    count++;
                                    failed++;
                                    contentBox.one(".status").removeClass("status--running").addClass("status--error");
                                    this.hideOverlay();
                                    if (len > 1) {
                                        contentBox.one(".status").prepend('<div class="result error" style="text-align:center;padding-bottom:5px">' + teamOrPlayer + count + '&thinsp;/&thinsp;' + len +
                                            //'<br/>Error executing script: ' + e.response.results.message +
                                            "&thinsp;:</div>");
                                    }
                                    if (count >= len) { // Last iteration:
                                        running = false;
                                        Y.later(6000, this, function() {
                                            this.setStatus("");
                                            contentBox.one(".wegas-status-bar").addClass("wegas-status-bar-hidden");
                                            contentBox.one(".status").removeClass("status--error");
                                        });
                                    }
                                }, this)
                            }
                        }, player);
                    }
                }
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
                    } else {
                        inputs[i].setClassFromState("valid");
                    }
                }
                return valid;
            },
            destructor: function() {
                this.srcField.destroy();
                this.srcField = null;
                if (this.get("customImpacts").length > 0) {
                    this._form.destroy();
                    this._form = null;
                }
            }
        },
            {
                ATTRS: {
                    player: {},
                    statusNode: {
                        setter: function(v) {
                            if (v) {
                                return v;
                            } else {
                                return this.get("contentBox").one("status");
                            }
                        }
                    },
                    /**
                     * Array of impacts. An impact is an Array [Legend, script template] or a script template.
                     * A script template is a string where `${"type":TYPE, "label":LABEL}` will be replaced by given
                     * value.
                     * ${...} delimiter will be processed as a JSON Object. Properties are inputex field configuration
                     */
                    customImpacts: {
                        value: Y.namespace("Wegas.Config").CustomImpacts || [],
                        validator: Y.Lang.isArray,
                        setter: function(v) {
                            v = Y.Lang.isFunction(v) ? v() : v;
                            return Y.Array.map(v, function(i) {
                                return Y.Lang.isArray(i) ? i : [undefined, i];
                            });
                        }
                    },
                    showAdvancedImpacts: {
                        type: "boolean",
                        value: true
                    }
                }
            });
    Wegas.CustomConsole = Console;

});
