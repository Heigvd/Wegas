/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**opera:speeddial
 
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>opera:speeddial
 
 */

YUI.add('wegas-form', function (Y) {
    "use strict";

    /**
     * @name Y.Wegas.Form
     * @extends Y.Widget
     * @borrows Y.WidgetChild, Y.Wegas.Widget
     * @class  class to submit a form 
     * @constructor
     * @description Add a toolbar with buttons "submit" and "cancel" to manger forms.
     */
    var Form = Y.Base.create("wegas-form", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        /**
         * @lends Y.Wegas.Form#
         */

        // ** Lifecycle Methods ** //
        /**
         * @function
         * @private
         * @description plug a toolbar and publich "submit" event.
         */
        initializer: function () {
            this.plug(Y.Plugin.WidgetToolbar);
            this.publish("submit", {
                emitFacade: true
            });
        },
        /**
         * @function
         * @private
         * @description call function "renderToolbar".
         */
        renderUI: function () {
            this.renderToolbar();
        },
        // ** Private Methods ** //
        /**
         * @function
         * @private
         * @description Add a submit button (with "afterValidation" and
         *  "submit" events) and a cancel button (with "cancel" event).
         * Render the Toolbar.
         */
        renderToolbar: function () {
            var toolbarNode = this.toolbar.get('header');

            this.saveButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save",
                on: {
                    click: Y.bind(function () {
                        var form = this.get("form"),
                                val = form.getValue();

                        if (!form.validate()) {
                            return;
                        }
                        form.fire("afterValidation");
                        if (val.valueselector) {
                            val = val.valueselector;
                        }
                        this.fire("submit", {
                            value: val
                        });
                    }, this)
                }
            }).render(toolbarNode);

            this.cancelButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-cancel\" ></span>Cancel",
                on: {
                    click: Y.bind(function () {
                        this.fire("cancel");
                    }, this)
                }
            }).render(toolbarNode);
        },
        /**
         * @function
         * @private
         * @description set the given form to null
         */
        destroyForm: function () {
            this.set("form", null);
        }
        /**
         * @lends Y.Wegas.Form
         */
        /**
         * @field
         * @static
         * @description
         * <p><strong>Method</strong></p>
         * <ul>
         *    <li>values: values of fields of the form</li>
         *    <li>form: the form to manage (see YUI Form)</li>
         *    <li>cfg: configuation of the form (see YUI Form)</li>
         * </ul>
         */
    }, {
        ATTRS: {
            /**
             * Values of fields of the form
             */
            values: {
                value: {
                    setter: function (val) {
                        if (this.get("form")) {
                            this.form.setValue(val);
                        }
                    }
                }
            },
            /**
             * The form to manage
             */
            form: {
                setter: function (val) {
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
                setter: function (val) {
                    val.parentEl = this.get("contentBox");                        // Set up the form parentEl attribute, so it knows where to render
                    val.className = "wegas-form-ix";
                    Y.inputEx.use(val, Y.bind(function (cfg) {                  // Load form dependencies
                        var form = Y.inputEx(cfg);                              // Initialize and render form
                        form.setValue(this.get("values"));                      // Sync form with "values" ATTR
                        this.set("form", form);
                    }, this, val));
                    return val;
                }
            }
        }
    });

    Y.namespace("Wegas").Form = Form;

    var inputEx = Y.inputEx,
            lang = Y.Lang;

    /**
     *  @hack So we can easily change classs on inputex fields
     */
    Y.inputEx.Field.prototype.addClassName = function (className) {
        Y.one(this.divEl).addClass(className);
    };
    Y.inputEx.Field.prototype.removeClassName = function (className) {
        Y.one(this.divEl).removeClass(className);
    };
    /*
     * @hack Automatically add the "optional" message when necessary
     */
    Y.inputEx.StringField.prototype.setOptions = function (options) {
        Y.inputEx.StringField.superclass.setOptions.call(this, options);

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
     * @hack Let inputex also get requirement from selectfields, lists
     */
    Y.inputEx.getRawModulesFromDefinition = function (inputexDef) {

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
        Y.Array.each(fields, function (field) {
            modules = modules.concat(this.getModulesFromDefinition(field));
        }, this);

        // TODO: inplaceedit  editorField

        return modules;
    };
});
