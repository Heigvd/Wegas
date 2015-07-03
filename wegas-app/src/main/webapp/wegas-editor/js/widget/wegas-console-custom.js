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
            return Y.Array.indexOf(["", undefined, null], item) === -1;
        },
        Console = Y.Base.create("wegas-console-custom",
            Y.Widget,
            [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
                BOUNDING_TEMPLATE: '<div class="wegas-form"></div>',
                renderUI: function() {
                    var cb = this.get(CONTENTBOX), menu, contents, contentBasics, contentAdvanced, cfg;       
                    if(this.get("customImpacts").length > 0){
                        menu = cb.append(""+
                            "<div class='modal--menu'>"+
                                "<button id='basics-impacts-btn' class='modal--tab-btn modal--tab-btn-selected'>Basics impacts</button>"+
                                "<button id='advanced-impacts-btn' class='modal--tab-btn'>Advanced impacts</button>"+
                            "</div>").one(".modal--menu");                    
                        contents = cb.append(""+
                            "<div class='modal--content-tabs'>"+
                                "<div class='modal--content-basics modal--content-tab modal--content-selected'></div>"+
                                "<div class='modal--content-advanced modal--content-tab'><div class='content-advanced-script'></div><button class='content-advanced-script-add'>Add Impact</button></div>"+
                            "</div>");
                        contentBasics = cb.one(".modal--content-basics");
                        contentAdvanced = cb.one(".modal--content-advanced .content-advanced-script");
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
                    }else{
                        cb.addClass("modal--content-advanced modal--without-menu");
                        contentAdvanced = cb.append("<div class='content-advanced-script'></div><button class='content-advanced-script-add'>Add Impact</button>").one(".content-advanced-script");
                    }        
                    this.srcField = new Y.inputEx.WysiwygScript({
                        parentEl: contentAdvanced
                    });
                    cb.append('<div><div class="results wegas-advanced-feature"></div><div class="status"></div></div>');
                    Y.one(this.srcField.getEl()).all("div > button").remove();
                },
                bindUI: function() {
                    this.get(CONTENTBOX).delegate("click", function(e) {
                        var modalContent = this.get(CONTENTBOX).one(".modal--content-selected");
                        if(!modalContent.hasClass("modal--content-basics")){
                            modalContent.removeClass("modal--content-selected");
                            this.get(CONTENTBOX).one(".modal--content-basics").addClass("modal--content-selected");
                            this.get(CONTENTBOX).one(".modal--tab-btn-selected").removeClass("modal--tab-btn-selected");
                            this.get(CONTENTBOX).one("#basics-impacts-btn").addClass("modal--tab-btn-selected");
                        }
                        
                    }, "#basics-impacts-btn", this);
                    this.get(CONTENTBOX).delegate("click", function(e) {
                        var modalContent = this.get(CONTENTBOX).one(".modal--content-selected");
                        if(!modalContent.hasClass("modal--content-advanced")){
                            modalContent.removeClass("modal--content-selected");
                            this.get(CONTENTBOX).one(".modal--content-advanced").addClass("modal--content-selected");
                            this.get(CONTENTBOX).one(".modal--tab-btn-selected").removeClass("modal--tab-btn-selected");
                            this.get(CONTENTBOX).one("#advanced-impacts-btn").addClass("modal--tab-btn-selected"); 
                        }
                    }, "#advanced-impacts-btn", this);
                    this.get(CONTENTBOX).delegate("click", function(e) {
                        var impacts = this.get(CONTENTBOX).all(".wegas-inputex-variabledescriptorselect-group");
      
                        if(impacts.size() < 5){
                            this.add();
                        }
                        if(impacts.size() === 0){
                            this.get(CONTENTBOX).one(".content-advanced-script-add").addClass("secondary");
                        }
                        if(impacts.size() === 4){
                            e.currentTarget.remove();
                        }
                    }, ".content-advanced-script-add", this);
                }, 
                viewSrc: function() {
                    this.srcField.viewSrc.fire("click");
                },
                add: function() {
                    this.srcField.addButton.fire("click");
                },
                setStatus: function(status) {
                    this.get("statusNode").set("text", status);
                },
                getBasicsImpactsScript: function(){
                    if (!this.validate()) {
                        this.showMessage("error", "Some fields are invalid", 1000);
                        return false;
                    }
                    return this.extractForm();
                },
                getAdvancedImpactsScript: function(){
                    if(!this.srcField.validate()){
                        this.showMessage("error", "Some fields are invalid", 1000);
                        return false;
                    }
                    return this.srcField.getValue();
                },
                run: function() {
                    var script, tabSelected;
                    if (running) {
                        return;
                    }
                   
                    if(this.get("customImpacts").length > 0){
                        tabSelected = this.get(CONTENTBOX).one(".modal--content-selected");
                        if(tabSelected.hasClass("modal--content-basics")){
                            script = this.getBasicsImpactsScript();
                        }else{
                            script = this.getAdvancedImpactsScript();
                        }
                    }else{
                        script = this.getAdvancedImpactsScript();
                    }
                    if(script !== false){
                        running = true;
                        this.setStatus("Running...");
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
                    if(this.get("customImpacts").length > 0){
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
                        value: Y.namespace("Wegas.Config").CustomImpacts,
                        validator: Y.Lang.isArray,
                        setter: function(v) {
                            v = Y.Lang.isFunction(v) ? v() : v;
                            return Y.Array.map(v, function(i) {
                                return Y.Lang.isArray(i) ? i : [undefined, i];
                            });
                        }
                    }
                }
            });
    Wegas.CustomConsole = Console;

});
