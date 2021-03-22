/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add("wegas-inputex-list", function(Y) {
    "use strict";

    var inputEx = Y.inputEx, ListField, EditableList, PluginList;

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
    ListField = function(options) {
        ListField.superclass.constructor.call(this, options);

        //parentNode.insert(this.addButton.get("boundingBox").remove(), 1);
        this.addButton.render(this.fieldset);
        Y.one(this.fieldset).prepend(this.addButton.get("boundingBox"));
    };
    Y.extend(ListField, inputEx.Group, {
        /**
         * Set the ListField classname
         * @param {Object} options Options object as passed to the constructor
         */
        setOptions: function(options) {
            ListField.superclass.setOptions.call(this, options);
            this.options.className = options.className || 'inputEx-Field inputEx-ListField';
            this.options.addType = options.addType;
            this.options.sortable = options.sortable || false;
            this.options.removable = options.removable || false;
            this.options.numbered = options.numbered || false;
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
            var i, length;
            this.addButton.destroy();

            for (i = 0, length = this.inputs.length; i < length; i += 1) {
                this._purgeField(this.inputs[i]);

            }
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
            var fieldInstance = ListField.superclass.renderField.call(this, fieldOptions);
            if (this.options.numbered !== false) {
                this.addClassName("numbered");
            }
            if (this.options.removable === false) {
                this.addClassName("hide-first-removebutton");
            }
            fieldInstance._handlers = [];
            fieldInstance._handlers.push(
                new Y.Wegas.Button({                                            // Render remove line button
                    label: '<span class="wegas-icon wegas-icon-remove"></span>',
                    cssClass: "wegas-removebutton",
                    on: {
                        click: Y.bind(this.onRemove, this, fieldInstance)
                    }
                }).render(fieldInstance.divEl)
            );
            if (this.options.sortable) {                                        // Render move up/down buttons
                fieldInstance._handlers.push(
                    new Y.Wegas.Button({
                        label: '<span class="wegas-icon wegas-icon-moveup"></span>',
                        cssClass: "wegas-moveupbutton",
                        on: {
                            click: Y.bind(this.move, this, fieldInstance, -1)
                        }
                    }).render(fieldInstance.divEl)
                    );
                fieldInstance._handlers.push(
                    new Y.Wegas.Button({
                        label: '<span class="wegas-icon wegas-icon-movedown"></span>',
                        cssClass: "wegas-movedownbutton",
                        on: {
                            click: Y.bind(this.move, this, fieldInstance, 1)
                        }
                    }).render(fieldInstance.divEl)
                    );
            }
            return fieldInstance;
        },
        move: function(field, direction) {
            var i = Y.Array.indexOf(this.inputs, field),
                tmp = this.inputs[i];

            if (this.inputs[i + direction]) {
                this.inputs[i] = this.inputs[i + direction];
                this.inputs[i + direction] = tmp;

                if (Y.one(this.inputs[i].divEl).one(".mce-tinymce")) {
                    Y.one(this.inputs[i].divEl).swap(tmp.divEl);
                } else {
                    Y.one(tmp.divEl).swap(this.inputs[i].divEl);
                }

                Y.one(tmp.divEl).setStyle("backgroundColor", "#ededed")
                    .transition({
                        duration: 1,
                        easing: 'ease-out',
                        backgroundColor: "#FFFFFF"
                    });                                                         // Animate the moved node so the user can see the change

                this.fireUpdatedEvt();
            }
        },
        onRemove: function(field) {
            var i = Y.Array.indexOf(this.inputs, field),
                d = this.inputs[i];
            d.destroy();
            this.inputs.splice(i, 1);
            this.fireUpdatedEvt();
        },
        onAdd: function() {
            this.addField(Y.Lang.isString(this.options.addType) ? {type: this.options.addType} : this.options.addType);
            this.fireUpdatedEvt();
        },
        _purgeField: function(field) {
            var i;
            for (i = 0; i < field._handlers.length; i += 1) {
                if (field._handlers[i].destroy) {
                    field._handlers[i].destroy();
                } else if (field._handlers[i].detach) {
                    field._handlers[i].detach();
                }
            }
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
    EditableList = function(options) {
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
            this.clear(fireUpdatedEvent);
            var i;
            for (i = 0; i < value.length; i += 1) {
                this.addPluginField(value[i].fn, value[i].cfg, fireUpdatedEvent);
            }

          /*  if (fireUpdatedEvent) {
                //this.fireUpdatedEvent();
            }*/
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
        onAdd: function() {
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
    PluginList = function(options) {
        PluginList.superclass.constructor.call(this, options);
    };
    Y.extend(PluginList, EditableList, {
        /**
         * Handle the click event on the add button
         */
        initEvents: function() {
            PluginList.superclass.initEvents.call(this);

            this.addButton.menu.on("button:click", function(e) {
                if (e.target.get("data")) {
                    this.addPluginField(e.target.get("data"));
                }
            }, this);
        },
        /**
         *
         * @returns {Array}
         */
        getValue: function() {
            var f = [], e;
            for (e = 0; e < this.inputs.length; e += 1) {
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
            this.clear(fireUpdatedEvent);
            var i;
            for (i = 0; i < value.length; i += 1) {
                this.addPluginField(value[i].fn, value[i].cfg, fireUpdatedEvent);
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
        addPluginField: function(fn, value, fireUpdatedEvent) {
            Y.Wegas.use({type: fn}, Y.bind(function() { //load required modules
                var cfg, targetPlg = Y.Plugin[fn],
                    w = new Y.Wegas.Text();                                 // Use this hack to retrieve a plugin config
                w.plug(targetPlg);
                cfg = w[targetPlg.NS].getFormCfg();
                cfg.name = targetPlg.NAME;
                cfg.value = value;
                inputEx.use(w[targetPlg.NS].getFormCfg(), Y.bind(function(cfg) {
                    this.addField(cfg);
                    if (fireUpdatedEvent !== false) {
                        this.fireUpdatedEvt();
                    }
                }, this, cfg, value));
            }, this));
        }
    });
    inputEx.registerType("pluginlist", PluginList);                             // Register this class as "list" type

});
