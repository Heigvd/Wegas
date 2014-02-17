/*
 * Wegas
 *
 * http://wegas.albasim.ch
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-form', function(Y) {
    "use strict";

    /**
     * @name Y.Wegas.Form
     * @class  Class to submit a form, add a toolbar with buttons "submit" and
     * "cancel" to mangae forms.
     * @extends Y.Widget
     * @augments Y.WidgetChild
     * @augments Y.Wegas.Widget
     * @constructor
     */
    var inputEx = Y.inputEx,
            lang = Y.Lang,
            Form = Y.Base.create("wegas-form", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        /**
         * @lends Y.Wegas.Form#
         */

        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description plug a toolbar and publich "submit" event.
         */
        initializer: function() {
            this.plug(Y.Plugin.WidgetToolbar);
            this.publish("submit", {
                emitFacade: true
            });
            this.publish("updated", {
                emitFacade: false
            });
        },
        /**
         * @function
         * @private
         * @description
         */
        renderUI: function() {
            Y.Array.each(this.get("buttons"), this.addButton, this);
        },
        /**
         * @function
         * @private
         * @description call function "renderToolbar".
         */
        syncUI: function() {
            this.set("cfg", this.get("cfg"));
        },
        /**
         * @function
         * @private
         * @returns {undefined}
         */
        destructor: function() {
            this.set("form", null);
        },
        addButton: function(b) {
            switch (b.action) {
                case "submit":
                    b.on = {
                        click: Y.bind(function() {
                            var form = this.get("form"),
                                    val = form.getValue();

                            if (!form.validate()) {
                                this.showMessageBis("error", "Some fields are not valid.");
                                return;
                            }
                            if (val.valueselector) {
                                val = val.valueselector;
                            }
                            this.fire("submit", {
                                value: val
                            });
                        }, this)
                    };
                    break;
                default:
                    b.on = {
                        click: Y.bind(function(action) {
                            this.fire(action);
                        }, this, b.action)
                    };
                    break;
            }
            this.toolbar.add(b);
        },
        /**
         * @function
         * @private
         * @description set the given form to null
         */
        destroyForm: function() {
            this.get("form").destroy();
            this.set("form", null);
        }

    }, {
        /** @lends Y.Wegas.Form */
        EDITORNAME: "Form",
        /**
         * <p><strong>Attributes</strong></p>
         * <ul>
         *    <li>values: values of fields of the form</li>
         *    <li>form: the form to manage (see YUI Form)</li>
         *    <li>cfg: configuation of the form (see YUI Form)</li>
         * </ul>
         *
         * @field
         * @static
         */
        ATTRS: {
            /**
             * Values of fields of the form
             */
            values: {
                "transient": true,
                value: {},
                setter: function(val) {
                    if (this.get("form")) {
                        this.get("form").setValue(val, false);
                    }
                    return val;
                }
            },
            /**
             * The form to manage
             */
            form: {
                "transient": true,
                setter: function(val) {
                    if (this.get("form")) {                                     // If there is alread a form instantiated, destroy it
                        this.get("form").destroy();
                    }
                    return val;
                }
            },
            /**
             * Configuation of the form
             */
            cfg: {
                setter: function(val) {
                    if (val) {
                        var cfg = Y.clone(val);                                 // Duplicate so val will be untouched while serializing
                        cfg.parentEl = this.get("contentBox");                  // Set up the form parentEl attribute, so it knows where to render
                        cfg.className = "wegas-form-ix";
                        cfg.type = cfg.type || "group";
                        Y.inputEx.use(val, Y.bind(function(cfg) {               // Load form dependencies
                            var form = Y.inputEx(cfg);                          // Initialize and render form
                            form.setValue(this.get("values"), false);           // Sync form with "values" ATTR
                            this.set("form", form);
                            form.on("updated", function(e) {
                                this.fire("updated", e);
                            }, this);
                        }, this, cfg));
                    }
                    return val;
                },
                items: {
                    test: {
                        type: "string"
                    }
                },
                _inputex: {
                    index: 8,
                    _type: "group",
                    legend: "Fields",
                    fields: Y.inputEx.Group.groupOptions
                }
            },
            buttons: {
                value: [{
                        type: "Button",
                        action: "submit",
                        label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save"
                    }
                ]
            }
        }
    });
    Y.namespace("Wegas").Form = Form;

    /* Add relevant plugin*/
    Y.Wegas.Form.ATTRS.plugins = Y.clone(Y.Wegas.Widget.ATTRS.plugins);
    Y.Wegas.Form.ATTRS.plugins._inputex.items.push({
        type: "Button",
        label: "Save to",
        data: "SaveObjectAction"
    });

    /**
     *  @hack So we can easily change classs on inputex fields
     */
    inputEx.Field.prototype.addClassName = function(className) {
        Y.one(this.divEl).addClass(className);
    };
    inputEx.Field.prototype.removeClassName = function(className) {
        Y.one(this.divEl).removeClass(className);
    };

    Y.inputEx.Group.groupOptions.splice(0, 4);
    Y.inputEx.Group.groupOptions[0].label = null;
    Y.inputEx.Group.groupOptions[0].useButtons = true;

    /*
     * @hack Automatically add the "optional" message when necessary
     */
    inputEx.StringField.prototype.setOptions = function(options) {
        inputEx.StringField.superclass.setOptions.call(this, options);

        this.options.regexp = options.regexp;
        this.options.size = options.size;
        this.options.maxLength = options.maxLength;
        this.options.minLength = options.minLength;
        this.options.typeInvite = options.typeInvite;
        if (!this.options.required && this.options.typeInvite === undefined) {  // !!!MODIFIED!!!
            this.options.typeInvite = "optional";
        }
        this.options.readonly = options.readonly;
        this.options.autocomplete = lang.isUndefined(options.autocomplete) ?
                inputEx.browserAutocomplete :
                (options.autocomplete === false || options.autocomplete === "off") ? false : true;
        this.options.trim = (options.trim === true) ? true : false;
    };
    /** 
     * Modified to allow changes on the fly
     */
    inputEx.StringField.prototype.initEvents = function() {
        //Y.on("change", this.onChange, this.el, this);
        Y.on("valueChange", this.onChange, this.el, this);                      // Modified
        
        if (Y.UA.ie > 0) { // refer to inputEx-95
            var field = this.el;
            Y.on("key", function(e) {
                field.blur();
                field.focus();
            }, this.el, 'down:13', this);
        }

        Y.on("focus", this.onFocus, this.el, this);
        Y.on("blur", this.onBlur, this.el, this);
        Y.on("keypress", this.onKeyPress, this.el, this);
        Y.on("keyup", this.onKeyUp, this.el, this);
    };
    /**
     * @hack Let inputex also get requirement from selectfields, lists
     */
    inputEx.getRawModulesFromDefinition = function(inputexDef) {

        var type = inputexDef.type || 'string',
                module = YUI_config.groups.inputex.modulesByType[type],
                modules = [module || type],
                //set fields if they exist
                fields = inputexDef.fields
                //else see if we have elementType for lists - if neither then we end up with null
                || inputexDef.availableFields || [];

        if (inputexDef.elementType) {
            fields.push(inputexDef.elementType);
        }

        // recursive for group,forms,list,combine, etc...
        Y.Array.each(fields, function(field) {
            modules = modules.concat(this.getModulesFromDefinition(field));
        }, this);

        // TODO: inplaceedit  editorField

        return modules;
    };

});
