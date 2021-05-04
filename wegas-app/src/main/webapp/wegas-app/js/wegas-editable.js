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
YUI.add('wegas-editable', function(Y) {
    "use strict";
    var Lang = Y.Lang;
    /**
     *  Add custom attributes to be used in ATTR param in static cfg.
     */
    Y.Base._ATTR_CFG.push("type", "properties", "view",
        /* should vanish once */ "_inputex", "required", "format", "errored",
        "choices", "items", "enum", "pattern", "maxLength", "minLength", "index",
        "default", "transient", "visible", "additionalProperties", "additionalItems",
        "minItems", "maxItems", "minimum", "maximum", "uniqueItems", "patternProperties",
        "maxWritableVisibility");
    Y.Base._ATTR_CFG_HASH = Y.Array.hash(Y.Base._ATTR_CFG);
    /**
     * @name Y.Wegas.Editable
     * @class Extension to be added to a Y.Widget, allowing edition on wegas entities.
     * @constructor
     */
    function Editable() {
    }

    Y.mix(Editable.prototype, {
        /** @lends Y.Wegas.Editable# */

        /**
         * Serialize to a json object. Method used <b>recursively</b> by JSON.stringify
         *
         * @function
         * @returns {Object}
         */
        toJSON: function() {
            var k,
                object = {},
                attrCfgs = this.getAttrCfgs();
            for (k in attrCfgs) {
                // do not even read transient attrs
                if (attrCfgs.hasOwnProperty(k) && !attrCfgs[k]["transient"]) {
                    object[k] = this.get(k);
                }
            }
            return object;
        },
        /**
         * Create a new JSON Object from this entity, filtered out by mask
         *
         * @fixme This method will parse the field and the clone it
         *
         * @function
         * @param {Array|String} mask or a list of string parameters
         * @return {Object} a filtered out clone
         */
        toObject: function(mask) {
            mask = Lang.isArray(mask) ? mask : Array.prototype.slice.call(arguments);
            var masker = mask.length > 0 ? function(key, value) {
                if (Y.Array.indexOf(mask, key) !== -1) {
                    return undefined;
                } else {
                    return value;
                }
            } : null;
            return Y.JSON.parse(Y.JSON.stringify(this), masker);
        },
        /**
         * Create a new Object from this entity
         * may be used by revive
         * @method clone
         * @return {Object} a clone
         */
        clone: function() {
            return this.toObject(["id", "variableInstances"]);
        },
        /**
         * Returns the form configuration associated to this object, to be used a Form schema.
         * @param {Array} fieldsToIgnore (optional), don't create these inputs.
         */
        getFormCfg: function(fieldsToIgnore, parent) {
            var i, schemaMap, attrCfgs;

            var gameModelType = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type");

            fieldsToIgnore = (fieldsToIgnore || []);

            attrCfgs = Y.clone(this.getAttrCfgs(), true, function(item, key) {
                if ((item && item["transient"]) || Y.Array.indexOf(fieldsToIgnore, key) > -1) {
                    return false;
                }
            });

            schemaMap = {
                type: 'object',
                properties: attrCfgs
            };

            if (gameModelType === "SCENARIO") {
                //Y.log("ATTRS: " + JSON.stringify(schemaMap));
                if (parent) {
                    var parentCfg = parent.getFormCfg();
                    this._overrideFormConfig(schemaMap, this, "PRIVATE", parent.get("visibility"),
                        parentCfg.maxWritableVisibility); // inheritedVisibility, inheritedMaxWritableVisibility
                } else {
                    this._overrideFormConfig(schemaMap, this, "PRIVATE");
                }
                //Y.log("ATTRS: " + JSON.stringify(schemaMap));
            }
            return schemaMap;
        },
        _isInstanceOf: function(entity, type) {
            return type && entity instanceof type;
        },
        _getVisibility: function(entity, defaultVisibility) {
            if (entity && typeof entity.get === "function" && entity.get("visibility")) {
                // entity has its own visibility
                return entity.get("visibility");
            } else {
                if (!defaultVisibility) {
                    var parent;
                    if (this._isInstanceOf(entity, Y.Wegas.persistence.VariableInstance)) {
                        // Default instance should use descriptor visibility
                        if (entity.getDescriptor().get("defaultInstance").get("id") === entity.get("id")) {
                            // it's the default instance
                            parent = entity.getDescriptor();
                        }
                    } else if (this._isInstanceOf(entity, Y.Wegas.persistence.Result)) {
                        // Choice descriptor visibility
                        parent = entity.getChoiceDescriptor();
                    } else if (this._isInstanceOf(entity, Y.Wegas.persistence.EvaluationDescriptorContainer) || this._isInstanceOf(entity, Y.Wegas.persistence.EvaluationDescriptor)) {
                        parent = entity.getParentDescriptor();
                    }
                    if (parent) {
                        return parent.get("visibility");
                    } else {
                        //Y.log("Create new -> ASSUME PRIVATE");
                        return "PRIVATE";
                    }
                }
            }
            return defaultVisibility;
        },
        _getMode: function(defaultMode, visibility, maxVisibility) {
            var visibilities = ["NONE", "PRIVATE", "INHERITED", "PROTECTED", "INTERNAL"];
            switch (Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type")) {
                case "MODEL":
                case "PLAY":
                    // one can always edit MODEL and PLAY gameModels
                    return "EDITABLE";
                case "REFERENCE":
                    // one can never edit a REFERENCE
                    return "READONLY";
            }


            if (visibility) {
                maxVisibility = maxVisibility || "INHERITED";
                //Y.log("Visibilities: " + visibility + " <-> " + maxVisibility);
                return (visibilities.indexOf(maxVisibility) >= visibilities.indexOf(visibility) ?
                    "EDITABLE" : "READONLY");
            } else {
                //Y.log("USE default mode: " + defaultMode);
                return defaultMode;
            }
        },
        _overrideFormConfig: function(cfg, entity, inheritedMode, inheritedVisibility, inheritedMaxWriteVisibility) {
            var visibility, mode, key, maxWritableVisibility;

            visibility = this._getVisibility(entity, inheritedVisibility);

            maxWritableVisibility = (cfg && cfg.maxWritableVisibility) || inheritedMaxWriteVisibility || "INHERITED";

            mode = this._getMode(inheritedMode, visibility, maxWritableVisibility);

            //Y.log("CurrentMode: " + mode + "  -> " + JSON.stringify(entity));

            //make sure there is a view, even an empty one
            cfg.view = cfg.view || {
                type: undefined
            };

            if (cfg.type === "object" || cfg.properties) {
                // Object
                for (key in cfg.properties) {
                    if (cfg.properties.hasOwnProperty(key)) {
                        //Y.log("KEY: " + key);
                        this._overrideFormConfig(cfg.properties[key], entity && (entity.get ? entity.get(key) : entity[key]), mode, visibility, maxWritableVisibility);
                    }
                }
                if (mode === "READONLY") {
                    cfg.view.readOnly = true;
                    if (cfg.additionalProperties && cfg.additionalProperties.view) {
                        cfg.additionalProperties.view.readOnly = true;
                    }
                }
            } else if (cfg.type === "array" && cfg.items) {
                this._overrideFormConfig(cfg.items, entity && entity.length > 0 && entity[0], mode, visibility, maxWritableVisibility);
                if (mode === "READONLY") {
                    cfg.view.readOnly = true;
                }
            } else {
                if (!cfg.view.type || (
                    cfg.view.type !== "hidden" &&
                    cfg.view.type !== "uneditable")) {
                    if (mode === "READONLY") {
                        //Y.log(" ->  READONLY");
                        //cfg.view.type = "uneditable";
                        cfg.view.readOnly = true;
                    }
                }
            }
        },
        getMenuConfigMap: function(data) {
            var menus = this.getStatic("EDITMENU", true),
                menu = this._aggregateMenuConfigMap(menus),
                visibility;

            menu = Y.JSON.parse(Y.JSON.stringify(menu)); // CLONE

            visibility = this._getVisibility(this, "PRIVATE");

            // filter unhauthoried buttons

            if (!Y.one("body.wegas-internalmode")) {
                for (var key in menu) {
                    if (menu.hasOwnProperty(key)) {
                        if (!menu[key] || !this._getMode("EDITABLE", visibility, menu[key].maxVisibility) === "EDITABLE") {
                            delete menu[key];
                        }
                    }
                }
            }

            data = data || {};
            data.entity = data.entity || this;
            data.widget = data.widget || this;

            Editable.mixMenuCfg(Object.values(menu).map(function(item){return item.cfg}), data);

            return menu;
        },
        _aggregateMenuConfigMap: function(menus) {
            var aggMenu = {},
                menu,
                key,
                button,
                i;

            for (i in menus) {
                if (menus.hasOwnProperty(i)) {
                    menu = menus[i];
                    for (key in menu) {
                        if (menu.hasOwnProperty(key)) {
                            button = menu[key];
                            if (!aggMenu.hasOwnProperty(key)) {
                                aggMenu[key] = button;
                            }
                        }
                    }
                }
            }
            return aggMenu;
        },
        /**
         * clone and return the edition menu associated to this object, to be used a an inputex object.
         *
         * @function
         * @param {type} data
         * @returns {Array}
         */
        getMenuCfg: function(data) {
            var menuMap = this.getMenuConfigMap(data);

            var menu = [];
            for (var key in menuMap) {
                if (menuMap.hasOwnProperty(key) && menuMap[key]) {
                    menu.push(menuMap[key]);
                }
            }
            menu.sort(function(a, b) {
                var ia, ib;
                ia = a.index || 0;
                ib = b.index || 0;
                if (ia < ib) {
                    return -1;
                } else if (ia === ib) {
                    return 0;
                } else {
                    return 1;
                }
            });

            // only keep configs
            menu = menu.map(function(item) {
                return item.cfg;
            });

            return menu;
        },
        /**
         * Returns the edition menu associated to this object, to be used a an wysiwyg editor.
         * @function
         * @param {type} data
         * @returns {unresolved}
         */
        getMethodCfgs: function(data) {
            var menu = this.getStatic("METHODS")[0] || {};
            return menu;
        },
        /**
         *  Helper function that walks the class hierarchy and returns it's attributes
         *  cfg (ATTRS), used in Y.Wegas.Entity.getFormCfg().
         *  @function
         *  @private
         */
        getAttrCfgs: function() {
            return this._aggregateAttrs(this.getStatic("ATTRS"));
        },
        /**
         *
         * @function
         * @private
         * @param {type} key
         * @param {type} withExtensions
         * @returns {Array}
         */
        getStatic: function(key, withExtensions) {
            var c = this.constructor,
                ret = [], i;

            while (c) {
                if (c[key]) {                                                   // Add to attributes
                    ret[ret.length] = c[key];
                }
                if (withExtensions && c._yuibuild && c._yuibuild.exts) {
                    for (i = 0; i < c._yuibuild.exts.length; i += 1) {
                        if (c._yuibuild.exts[i][key]) {
                            ret.push(c._yuibuild.exts[i][key]);
                        }
                    }
                }
                c = c.superclass ? c.superclass.constructor : null;
            }
            return ret;
        },
        /**
         * Retrives editable's editorname or name
         * @function
         * @public
         * @returns {String} static EDITORNAME or NAME
         */
        getType: function() {
            return this.constructor.EDITORNAME || this.constructor.NAME;
        },
        getLabel: function() {
            return null;
        },
        getEditorLabel: function() {
            return this.getLabel();
        },
        getTreeEditorLabel: function() {
            return this.getEditorLabel();
        },
        /**
         * Check if this widget is augmented (extended) by a specifique Widget
         * @param {Class} extension to check for
         * @returns {Boolean}
         */
        isAugmentedBy: function(extension) {
            var self = this.constructor, i;
            while (self._yuibuild) {
                for (i = 0; i < self._yuibuild.exts.length; i += 1) {
                    if (self._yuibuild.exts[i] === extension) {
                        return true;
                    }
                }
                self = self.superclass.constructor;
            }
            return false;
        }
    });
    Y.mix(Editable, {
        /** @lends Y.Wegas.Editable */
        /**
         *
         * @param {type} elts
         * @param {type} data
         * @returns {undefined}
         */
        mixMenuCfg: function(elts, data) {
            var i, j;
            for (i = 0; i < elts.length; i += 1) {
                Y.mix(elts[i], data, true); // Attach self and the provided datasource to the menu items, to allow them to know which entity to update

                if (elts[i].children) {
                    Editable.mixMenuCfg(elts[i].children, data); // push data in children arg
                }
                if (elts[i].wchildren) {
                    Editable.mixMenuCfg(elts[i].wchildren, data); // push data in wchildren
                }
                if (elts[i].plugins) {
                    for (j = 0; j < elts[i].plugins.length; j = j + 1) {
                        elts[i].plugins[j].cfg = elts[i].plugins[j].cfg || {};
                        Y.mix(elts[i].plugins[j].cfg, data, true);
                        if (elts[i].plugins[j].cfg.children) {
                            Editable.mixMenuCfg(elts[i].plugins[j].cfg.children, data); // push data in children arg
                        }
                        if (elts[i].plugins[j].cfg.wchildren) {
                            Editable.mixMenuCfg(elts[i].plugins[j].cfg.wchildren, data); // push data in wchildren
                        }
                    }
                }
            }
        },
        /**
         * Load the modules from an Wegas widget definition
         *
         * @function
         * @static
         * @param {Object} cfg
         * @param {Function} cb callback to be called when modules are loaded
         */
        use: function(cfg, cb) {
            var modules = Y.Array.reject(Editable.getModulesFromDefinition(cfg), function(i) {
                return i === "";
            });
            if (modules.length > 0) {
                Y.log("Loading modules:" + modules.join(), "info", "Wegas.Editable");
            }
            Y.use(modules, cb);
        },
        /**
         * Return recursively the modules from their 'type' property using (modulesByType from loader.js)
         * @function
         * @static
         * @private
         * @param {type} cfg
         * @returns {Array}
         */
        getRawModulesFromDefinition: function(cfg) {
            var i, props,
                type = cfg.type || cfg["@class"],
                module = YUI_config.Wegas.modulesByType[type],
                modules = [];
            if (Y.Lang.isArray(cfg)) {
                return Y.Array.flatten(Y.Array.map(cfg, Editable.getModulesFromDefinition));
            }

            if (module) {
                modules.push(module);
            }

            props = ["children", "entities", "items"]; // Revive array attributes
            props.push("updatedEntities");
            props.push("deletedEntities");
            for (i = 0; i < props.length; i += 1) {
                if (cfg[props[i]]) {                                            // Get definitions from children (for Y.WidgetParent widgets)
                    Y.Array.each(cfg[props[i]], function(field) {
                        if (field) {
                            modules = modules.concat(Editable.getModulesFromDefinition(field));
                        }
                    });
                }
            }
            if (cfg.plugins) {                                                  // Plugins must be revived in the proper way
                Y.Array.each(cfg.plugins, function(field) {
                    field.cfg = field.cfg || {
                    };
                    field.cfg.type = field.fn;
                    modules = modules.concat(Editable.getModulesFromDefinition(field.cfg));
                    delete field.cfg.type;
                });
            }

            props = ["left", "right", "center", "top", "bottom"]; // Revive  objects attributes
            for (i = 0; i < props.length; i = i + 1) {
                if (cfg[props[i]]) {
                    modules = modules.concat(Editable.getModulesFromDefinition(cfg[props[i]]));
                }
            }

            return modules;
        },
        /**
         * Return unique modules definitions
         * @function
         * @static
         * @private
         * @param {Object} cfg
         */
        getModulesFromDefinition: function(cfg) {
            return Y.Object.keys(Y.Array.hash(Editable.getRawModulesFromDefinition(cfg)));
        },
        /**
         *  This method takes a js object and recursively instantiate it based on
         *  on their @class attribute. Target class are found in namespace
         *  Y.Wegas.persistence.
         *
         *  @static
         *  @param {Object} data the object to revive
         *  @return Y.Wegas.Widget the resulting entity
         */
        revive: function(data) {
            var walk = function(value) {
                var k;
                if (Lang.isObject(value)) {
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            value[k] = walk(value[k]);
                        }
                    }
                    return Editable.reviver(value);
                } else {
                    return value; // Return raw original object
                }
            };
            return walk(data);
        },
        /**
         *  Takes an js object and lookup the corresponding entity in the
         *  Y.Wegas.persistence package, based on its @class or type attributes.
         *
         *  @function
         *  @static
         *  @param {Object} o the object to revive
         *  @return {Y.Wegas.Widget} the resulting entity
         */
        reviver: function(o) {
            if (o["@class"]) {
                return new (Y.Wegas.persistence[o["@class"]] || Y.Wegas.persistence.DefaultEntity)(o);
            } else if (o.type) {
                return new (Y.Wegas.persistence[o.type] || Y.Wegas.persistence.DefaultEntity)(o);
            }
            return o;
        },
        /**
         *
         * Combine use and revive function to get a revived entity.
         *
         * @function
         * @static
         * @param {type} cfg
         * @param {type} cb
         */
        useAndRevive: function(cfg, cb) {
            Editable.use(cfg, Y.bind(function(cb) {                             // Load target class dependencies
                cb(Editable.revive(this));
            }, cfg, cb));
        },
        /**
         * Serialization purpose.
         * Any null or empty String attribute won't serialize.
         * Use this with getters.
         * @static
         * @public
         * @function
         * @param {Any} value
         * @returns {Any|undefined}
         */
        removeNullValue: function(value) {
            return (value === null || value === "") ? undefined : value;
        },

        staticGetFormCfg: function(klass, fieldsToIgnore, parent) {
            var i, schemaMap, attrCfgs;


            fieldsToIgnore = (fieldsToIgnore || []);

            attrCfgs = Y.clone(Y.Wegas.Editable.staticGetAttrCfgs(klass), true, function(item, key) {
                if ((item && item["transient"]) || Y.Array.indexOf(fieldsToIgnore, key) > -1) {
                    return false;
                }
            });

            schemaMap = {
                type: 'object',
                properties: attrCfgs
            };

            /*
             var gameModelType = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("type");
             if (gameModelType === "SCENARIO") {
             if (parent) {
             var parentCfg = parent.getFormCfg();
             this._overrideFormConfig(schemaMap, this, "PRIVATE", parent.get("visibility"),
             parentCfg.maxWritableVisibility); // inheritedVisibility, inheritedMaxWritableVisibility
             } else {
             this._overrideFormConfig(schemaMap, this, "PRIVATE");
             }
             }*/
            return schemaMap;
        },

        staticGetAttrCfgs: function(klass) {
            var allAttrs = Y.Wegas.Editable.staticGetStatic(klass, "ATTRS");
            return Y.BaseCore.prototype._aggregateAttrs.call({
                _attrCfgHash: function() {
                    if (this.constructor._ATTR_CFG_HASH) {
                        return this.constructor._ATTR_CFG_HASH;
                    } else {
                        debugger;
                        return {};
                    }
                },
                constructor: klass
            }, allAttrs);
        },
        staticGetStatic: function(klass, key, withExtensions) {
            var c = klass, ret = [], i;

            while (c) {
                if (c[key]) {                                                   // Add to attributes
                    ret[ret.length] = c[key];
                }
                if (withExtensions && c._yuibuild && c._yuibuild.exts) {
                    for (i = 0; i < c._yuibuild.exts.length; i += 1) {
                        if (c._yuibuild.exts[i][key]) {
                            ret.push(c._yuibuild.exts[i][key]);
                        }
                    }
                }
                c = c.superclass ? c.superclass.constructor : null;
            }
            return ret;
        }
    });
    Y.namespace("Wegas").Editable = Editable;
    Y.Wegas.use = Y.Wegas.Editable.use; // Set up a shortcut
});
