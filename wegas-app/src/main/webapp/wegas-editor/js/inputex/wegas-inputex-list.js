/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-list", function(Y) {
    "use strict";

    var inputEx = Y.inputEx;

    /**
     *  Adds a method that retrieves the value of each input in the group
     *  (unlike Y.inputEx.Group.getValue() that returns an object based on
     *  inputs names):
     */
    inputEx.Group.prototype.getArray = function() {
        var i, ret = [];
        for (i = 0; i < this.inputs.length; i = i + 1) {
            ret.push(this.inputs[i].getValue());
        }
        return ret;
    };

    /**
     * @class ListField
     * @constructor
     * @extends inputEx.Group
     * @param {Object} options InputEx definition object
     */
    var ListField = function(options) {
        ListField.superclass.constructor.call(this, options);

        var parentNode = new Y.Node(this.fieldset);
        //parentNode.insert(this.addButton.get("boundingBox").remove(), 1);
        this.addButton.render(this.fieldset);
        parentNode.prepend(this.addButton.get("boundingBox"));
    };
    Y.extend(ListField, inputEx.Group, {
        /**
         * Set the ListField classname
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            ListField.superclass.setOptions.call(this, options);
            this.options.className = options.className || 'inputEx-Field inputEx-ListField';
            this.options.addType = options.addType || "variabledescriptorsetter";
        },
        /**
         * Render the addButton
         */
        render: function() {
            ListField.superclass.render.call(this);

            this.addButton = new Y.Wegas.Button({
                label: "<span class=\"wegas-icon wegas-icon-add\"></span>"
            });
            this.addButton.get("boundingBox").addClass("wegas-addbutton");
        },
        /**
         *
         */
        destroy: function() {
            this.addButton.destroy();
            ListField.superclass.destroy.call(this);
        },
        /**
         * Handle the click event on the add button
         */
        initEvents: function() {
            ListField.superclass.initEvents.call(this);
            this.addButton.on("click", this.onAdd, this);
        },
        renderField: function(fieldOptions) {
            var fieldInstance = ListField.superclass.renderField.call(this, fieldOptions),
                    removebutton = new Y.Wegas.Button({
                label: '<span class="wegas-icon wegas-icon-remove"></span>'
            });

            removebutton.targetField = fieldInstance;
            removebutton.get("boundingBox").addClass("wegas-removebutton");
            removebutton.render(fieldInstance.divEl);
            removebutton.on("click", this.onRemove, this);

            return fieldInstance;
        },
        onRemove: function(e) {
            var i = Y.Array.indexOf(this.inputs, e.target.targetField),
                    d = this.inputs[i];
            d.destroy();
            this.inputs.splice(i, 1);
            this.fireUpdatedEvt();
        },
        onAdd: function(e) {
            this.addField({
                type: this.options.addType
            });
            this.fireUpdatedEvt();
        },
        /**
         * Override to disable
         */
        runInteractions: function() {
        }

    });

    inputEx.registerType("listfield", ListField);                               // Register this class as "list" type

    /**
     * @class ListField
     * @constructor
     * @extends Y.Wegas.ListField
     * @param {Object} options InputEx definition object
     */
    var EditableList = function(options) {
        EditableList.superclass.constructor.call(this, options);
    };
    Y.extend(EditableList, ListField, {
        /**
         * Set the ListField classname
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            EditableList.superclass.setOptions.call(this, options);
            this.options.fields = options.fields || [];
            this.options.items = options.items || [];
        },
        setValue: function(value, fireUpdatedEvent) {
            //EditableList.superclass.setValue.apply(this, arguments);
            this.clear();
            var i;
            for (i = 0; i < value.length; i += 1) {
                this.addPluginField(value[i].fn, value[i].cfg);
            }

            if (fireUpdatedEvent) {
                //this.fireUpdatedEvent();
            }
        },
        /**
         * Handle the click event on the add button
         */
        initEvents: function() {
            EditableList.superclass.initEvents.call(this);
            /*var ttplugin = new Y.Plugin.Tooltip;*/

            this.addButton.plug(Y.Plugin.WidgetMenu, {
                children: this.options.items
            });
        },
        /**
         * Override to prevent field creation on click
         */
        onAdd: function(e) {
        },
        /**
         * Override to disable
         */
        runInteractions: function() {
        }

    });

    inputEx.registerType("editablelist", EditableList);                         // Register this class as "list" type


    /**
     * @class PluginList
     * @constructor
     * @extends Y.Wegas.EditableList
     * @param {Object} options InputEx definition object
     */
    var PluginList = function(options) {
        PluginList.superclass.constructor.call(this, options);
    };
    Y.extend(PluginList, EditableList, {
        /**
         * Handle the click event on the add button
         */
        initEvents: function() {
            PluginList.superclass.initEvents.call(this);

            this.addButton.menu.on("button:click", function(e) {
                this.addPluginField(e.target.get("data"));
            }, this);
        },
        /**
         *
         * @returns {Array}
         */
        getValue: function() {
            var f = [];
            for (var e = 0; e < this.inputs.length; e += 1) {
                f.push({
                    fn: this.inputs[e].options.name,
                    cfg: this.inputs[e].getValue()
                });
            }
            return f;
        },
        /**
         *
         * @param {Object} value
         * @param {boolean} fireUpdatedEvent
         */
        setValue: function(value, fireUpdatedEvent) {
            //EditableList.superclass.setValue.apply(this, arguments);
            this.clear();
            var i;
            for (i = 0; i < value.length; i += 1) {
                this.addPluginField(value[i].fn, value[i].cfg);
            }

            if (fireUpdatedEvent) {
                //this.fireUpdatedEvent();
            }
        },
        /**
         *
         * @param {string|function} fn
         * @param {Object} value
         */
        addPluginField: function(fn, value) {
            Y.use(Y.Wegas.Editable.getRawModulesFromDefinition({type: fn}), Y.bind(function() { //load required modules
                var cfg, targetPlg = Y.Plugin[fn],
                        w = new Y.Wegas.Text();                                     // Use this hack to retrieve a plugin config
                w.plug(targetPlg);
                cfg = w[targetPlg.NS].getFormCfg();
                cfg.name = targetPlg.NAME;
                cfg.value = value;
                inputEx.use(w[targetPlg.NS].getFormCfg(), Y.bind(function(cfg) {
                    this.addField(cfg);
                    this.fireUpdatedEvt();
                }, this, cfg, value));
            }, this));
        }
    });
    inputEx.registerType("pluginlist", PluginList);                             // Register this class as "list" type

});
