/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 * @fileoverview New version of Form widget to replace inputex, not in use yet.
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('form', function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", BOUNDINGBOX = "boundingBox",
            Field;

    Field = Y.Base.create("form-field", Y.Widget, [Y.WidgetChild], {
        /**
         * 
         */
        BOUNDING_TEMPLATE: "<div><div class=\"yui3-form-label\"></div></div>",
        /**
         *
         */
        renderUI: function() {
            this.get(BOUNDINGBOX).append("<div class=\"yui3-form-status\"></div>" +
                    "<div class=\"yui3-form-description\"></div>");
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
            value: {},
            className: {},
            name: {},
            readonly: {},
            required: {
                value: false
            },
            validator: {},
            label: {
                setter: function(value) {
                    if (value) {
                        this.get(BOUNDINGBOX).one(".yui3-form-label").setContent(value);
                    }
                    return value;
                }
            },
            description: {
                setter: function(value) {
                    if (value) {
                        this.get(BOUNDINGBOX).one(".yui3-form-description").setContent(value);
                    }
                    return value;
                }
            }
            //showMsg: {
            //    value: false
            //},
            //messages: {
            //}

        }
    });
    Y.Field = Field;

    var String = Y.Base.create("form-string", Field, [], {
        CONTENT_TEMPLATE: "<div><input type=\"text\"></div>",
        /**
         * 
         */
        bindUI: function() {
            this.get("inputNode").on("valueChange", function(e) {
                this.set("value", this.get("value"), {internal: true});
            }, this);
        },
        /**
         * 
         */
        syncUI: function() {
            String.superclass.syncUI.call(this);
            this.set("readonly", this.get("readonly"));
            this.set("maxLength", this.get("maxLength"));
            this.set("autocomplete", this.get("maxLength"));
            this.set("placeholder", this.get("placeholder"));
        }
    }, {
        ATTRS: {
            inputNode: {
                readonly: true,
                getter: function() {
                    return this.get(CONTENTBOX).one("input");
                }
            },
            value: {
                getter: function() {
                    return this.get("inputNode").get("value");
                },
                setter: function(value, name, cfg) {
                    if (!cfg || !cfg.internal) {
                        this.get("inputNode").set("value", value);
                    }
                    return value;
                }
            },
            maxLength: {
                value: false,
                setter: function(value) {
                    this.get("inputNode").setAttribute("maxLength", value);
                    return value;
                }
            },
            readonly: {
                value: false,
                setter: function(value) {
                    if (value) {
                        this.get("inputNode").setAttribute("readonly", "readonly");
                    }
                    return value;
                }
            },
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
                    this.get("inputNode").set("autocomplete", value ? "on" : "off");
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
    Y.String = String;

    /**
     * 
     */
    var Textarea = Y.Base.create("form-textarea", String, [], {
        CONTENT_TEMPLATE: "<div><textarea></textarea></div>"
    }, {
        ATTRS: {
            inputNode: {
                readonly: true,
                getter: function() {
                    return this.get(CONTENTBOX).one("textarea");
                }
            }
        }
    });
    Y.Textarea = Textarea;

    /**
     * 
     * @type @exp;Y@pro;Base@call;create
     */
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
            //input.on("change", this.fire, this, "update");
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
    Y.Checkbox = Checkbox;

    /*
     * 
     */
    var Select = Y.Base.create("form-select", Field, [Y.WidgetParent], {
        CONTENT_TEMPLATE: "<div><select></select></div>",
        initializer: function(cfg) {
            if (cfg.children) {
                cfg.children = Y.Array.map(cfg.children, function(i) {
                    if (Y.Lang.isString(i)) {
                        return {
                            label: i,
                            value: i
                        };
                    } else {
                        return i;
                    }
                });
            }
        },
        /**
         * 
         */
        renderUI: function() {
            Select.superclass.renderUI.call(this);
            this._childrenContainer = this.get(CONTENTBOX).one("select");
        },
        /**
         * 
         */
        bindUI: function() {
            this.get(CONTENTBOX).one("select").on("change", function(e) {
                this.set("value", this.get("value"), {internal: true});
            }, this);
            //Y.on("focus", this.onFocus, this.el, this);
            //Y.on("blur", this.onBlur, this.el, this);
        }
    }, {
        ATTRS: {
            defaultChildType: {
                value: "SelectOption"
            },
            selectNode: {
                readonly: true,
                getter: function() {
                    return this.get(CONTENTBOX).one("select");
                }
            },
            value: {
                getter: function() {
                    return this.get(CONTENTBOX).one("select").get("value");
                },
                setter: function(value, name, cfg) {
                    if (value && (!cfg || !cfg.internal)) {
                        this.get(CONTENTBOX).one("select").set("value", value);
                    }
                    return value;
                }
            }
        }
    });
    Y.Select = Select;
    /**
     * 
     * 
     */
    var SelectOption = Y.Base.create("form-selectoption", Y.Widget, [Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<option>blabla</option>",
        CONTENT_TEMPLATE: null,
        syncUI: function() {
            this.set("label", this.get("label"));
            this.set("value", this.get("value"));
        }
    }, {
        ATTRS: {
            value: {
                setter: function(value) {
                    this.get(BOUNDINGBOX).set("value", value);
                    return value;
                }
            },
            label: {
                setter: function(value) {
                    this.get(BOUNDINGBOX).setHTML(value);
                    return value;
                }
            }
        }
    });
    Y.SelectOption = SelectOption;

    var Group = Y.Base.create("form-group", Field, [Y.WidgetParent], {
        bindUI: function() {
            this.on("addCild", function(e) {
                e.child.on("valueChange", this.onChildValueChange, this);
            });
            this.each(function(i) {
                i.on("valueChange", this.onChildValueChange, this);
            }, this);
        },
        onChildValueChange: function() {
            this.set("value", this.get("value"), {internal: true});
        }
    }, {
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
                setter: function(value, name, cfg) {
                    if (!cfg || !cfg.internal) {
                        if (this.get("flatten")) {
                            // TODO
                        } else {
                            this.each(function(item) {
                                if (value.hasOwnProperty(item.get("name"))) {
                                    item.set("value", value[item.get("name")]);
                                }
                            });
                        }
                    }
                    return value;
                }
            },
            flatten: {
                value: false
            }
        }
    });
    Y.Group = Group;
});
