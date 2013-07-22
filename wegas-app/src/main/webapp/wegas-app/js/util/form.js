/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('form', function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox",
            BOUNDINGBOX = "boundingBox",
            Field = Y.Base.create("form-field", Y.Widget, [Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<div><label></label></div>",
        /**
         *
         */
        initializer: function() {
            this.publish("updated", {emitFacade: true});
        },
        renderUI: function() {
            this.get(BOUNDINGBOX).append("<div class=\"yui3-form-status\"></div>" +
                    "<div class=\"yui3-form-description\"></div>");
        },
        onInputUpdate: function(e) {
            this.fire("updated", {});
        },
        /**
         *
         */
        syncUI: function() {
            this.set("label", this.get("label"));
            this.set("description", this.get("description"));
            this.set("value", this.get("value"));
        },
        isValid: function() {
            return true;
        }
    }, {
        ATTRS: {
            label: {
                setter: function(value) {
                    if (value) {
                        this.get(BOUNDINGBOX).one("label").setContent(value);
                    }
                    return value;
                }
            },
            value: {},
            description: {
                setter: function(value) {
                    if (value) {
                        this.get(BOUNDINGBOX).one(".yui3-form-description").setContent(value);
                    }
                    return value;
                }
            },
            className: {},
            name: {}, readonly: {},
            required: {
                value: false
            },
            //showMsg: {
            //    value: false
            //},
            //messages: {
            //}

        }
    });
    Y.namespace("Wegas").Field = Field;

    var String = Y.Base.create("form-string", Field, [], {
        CONTENT_TEMPLATE: "<div><input type=\"text\"></div>",
        renderUI: function() {
            String.superclass.renderUI.call(this);
            var input = this.get(CONTENTBOX).one("input");

            input.setAttribute("autocomplete", this.get("autocomplete") ? "on" : "off");

            if (this.get("readonly")) {
                input.setAttributes("readonly", "readonly");
            }
            if (this.get("maxLength")) {
                input.setAttributes("maxLength", this.get("maxLength"));
            }
            // + 'name="' +this.get()
            // + 'size='
            // attributes.id = this.divEl.id?this.divEl.id+'-field':Y.guid();
        },
        bindUI: function() {
            this.get("contentBox").one("input").on("change", this.onInputUpdate, this);

            //if (Y.UA.ie > 0) { // refer to inputEx-95
            //    var field = this.el;
            //    Y.on("key", function(e) {
            //        field.blur();
            //        field.focus();
            //    }, this.el, 'down:13', this);
            //}
            //
            //Y.on("focus", this.onFocus, this.el, this);
            //Y.on("blur", this.onBlur, this.el, this);
            //Y.on("keypress", this.onKeyPress, this.el, this);
            //Y.on("keyup", this.onKeyUp, this.el, this);
        },
        syncUI: function() {
            String.superclass.syncUI.call(this);
            this.set("placeholder", this.get("placeholder"));
        }
    }, {
        ATTRS: {
            inputNode: {
                getter: function() {
                    return this.get(CONTENTBOX).one("input");
                }
            },
            value: {
                getter: function() {
                    return this.get("inputNode").get("value");
                },
                setter: function(value) {
                    this.get("inputNode").set("value", value);
                    return value;
                }
            },
            maxLength: {},
            placeholder: {
                setter: function(value) {
                    if (value) {
                        this.get("inputNode").set("placeholder", value);
                    }
                    return value;
                }
            },
            autocomplete: {
                setter: function(value) {
                    if (value) {
                        this.get("inputNode").set("placeholder", value);
                    }
                    return value;
                }
            }
            //regexp: {},
            //minLength: {},
            //size: {},
            //trim: {
            //    value: false
            //}
        }
    });
    Y.namespace("Wegas").String = String;

    var Checkbox = Y.Base.create("form-checkbox", Field, [], {
        CONTENT_TEMPLATE: "<div><input type=\"checkbox\"><div class=\"rightLabel\"</div>",
        bindUI: function() {
            var input = this.get("contentBox").one("input");

            input.on("change", this.onInputUpdate, this);

            // Awful Hack to work in IE6 and below (the checkbox doesn't fire the change event)
            // It seems IE 8 removed this behavior from IE7 so it only works with IE 7 ??
            //if (Y.UA.ie) {
            //    input.on("click", function(e) {
            //        Y.later(10, this, function() {
            //            this.onChange(e);
            //        });
            //    }, this);
            //} else {
            //input.on("change", this.fire, this, "updated");
            //}

            //Y.one(this.el).on("focus", this.onFocus, this, true);
            //Y.one(this.el).on("blur", this.onBlur, this, true);
        }
    }, {
        ATTRS: {
            value: {
                setter: function(value) {
                    this.get(CONTENTBOX).one("input").set("checked", value);
                    return value;
                },
                getter: function() {
                    return this.get(CONTENTBOX).one("input").get("value");
                }
            },
            rightLabel: {},
            checkedValue: {
                value: true
            },
            uncheckedValue: {
                value: false
            }
        }
    });
    Y.namespace("Wegas").Checkbox = Checkbox;

    var Select = Y.Base.create("form-select", Field, [], {
        CONTENT_TEMPLATE: "<div><select></select></div>",
        bindUI: function() {
            input.on("change", this.fire, this, "updated");
            //Y.on("focus", this.onFocus, this.el, this);
            //Y.on("blur", this.onBlur, this.el, this);
        }
    }, {
        ATTRS: {
            choices: {
                value: [],
                setter: function(value) {
                    var i, selectNode = this.get(CONTENTBOX).one("select");
                    for (var i = 0; i < value.length; i += 1) {
                        selectNode.append('<option value="' + value[i].value + '">' + value[i].label + '</option>');
                    }
                    return value;
                }
            }
        }
    });
    Y.namespace("Wegas").Select = Select;

    var Group = Y.Base.create("form-group", Field, [Y.WidgetParent], {}, {
        ATTRS: {
            value: {
                getter: function() {
                    if (this.get("flatten")) {
                        return [];
                    } else {
                        var ret = {};
                        this.each(function(item) {
                            ret[item.get("name")] = item.get("value");
                        }, ret);
                        return ret;
                    }
                },
                setter: function(value) {
                    var i, j = 0;
                    if (this.get("flatten")) {
                        // TODO
                    } else {
                        this.each(function(item) {
                            item.set("value", value[item.get("name")]);
                        });
                    }
                    return value;
                }
            },
            flatten: {
                value: false
            }
        }
    });
    Y.namespace("Wegas").Group = Group;
});
