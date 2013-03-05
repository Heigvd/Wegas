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
YUI.add('wegas-editable', function(Y) {
    "use strict";

    var Lang = Y.Lang;

    /**
     *  Add custom attributes to be used in ATTR param in static cfg.
     */
    Y.Base._ATTR_CFG.push("type", "properties", "_inputex", "optional", "format",
            "choices", "items", "enum", "default", "transient");
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
            var k, ret = this.getAttrs(),
                    attrCfgs = this.getAttrCfgs();

            for (k in ret) {
                if (attrCfgs[k] && attrCfgs[k]["transient"]) {                  // Remove any transient attribute
                    delete ret[k];
                }
            }
            return ret;                                                         // Return a copy of this's fields.
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
            var masker;
            mask = Lang.isArray(mask) ? mask : Array.prototype.slice.call(arguments);
            masker = mask.length > 0 ? function(key, value) {
                if (mask.indexOf(key) !== -1) {
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
         * Returns the form configuration associated to this object, to be used a an inputex object.
         * @param {Array} fieldsToIgnore (optional), don't create these inputs.
         */
        getFormCfg: function(fieldsToIgnore) {
            var i, form, schemaMap, attrCfgs, builder;
            fieldsToIgnore = (fieldsToIgnore || []);
            // forms = Y.Wegas.app.get('editorForms'),                          // Select first server defined forms, based on the @class or the type attribute
            // form = forms[this.get('@class')] || forms[this.get("type")]

            form = form || this.constructor.EDITFORM;                           // And if no form is defined we check if there is a default one defined in the entity

            if (!form) {                          // If no edit form could be found, we generate one based on the ATTRS parameter.
                attrCfgs = this.getAttrCfgs();

                for (i in attrCfgs) {
                    attrCfgs[i]["default"] = attrCfgs[i].value;// Use the value as default (useful form json object serialization)

                    if (attrCfgs[i]["transient"] || fieldsToIgnore.indexOf(i) > -1) {
                        delete attrCfgs[i];
                    }
                }

                schemaMap = {
                    Entity: {
                        properties: attrCfgs
                    }
                };

                builder = new Y.inputEx.JsonSchema.Builder({
                    'schemaIdentifierMap': schemaMap,
                    'defaultOptions': {
                        'showMsg': true
                    }
                });
                form = builder.schemaToInputEx(schemaMap.Entity);
            }
            return form || [];
        },
        /**
         * Returns the edition menu associated to this object, to be used a an inputex object.
         *
         * @function
         */
        getMenuCfg: function(data) {
            var menu, menus = Y.Wegas.app.get('editorMenus');
            //    staticMenus =

            if (menus) {
                menu = menus[this.get('@class')] || menus[this.get("type")];    // Select first server defined forms, based on the @class or the type attribute
            }
            menu = menu || this.getStatic("EDITMENU")[0] || [];                // And if no form is defined we return the default one defined in the entity

            function mixMenuCfg(elts, data) {
                var i, j;
                for (i = 0; i < elts.length; i += 1) {
                    Y.mix(elts[i], data, true);                                 // Attach self and the provided datasource to the menu items, to allow them to know which entity to update

                    if (elts[i].plugins) {
                        for (j = 0; j < elts[i].plugins.length; j = j + 1) {
                            elts[i].plugins[j].cfg = elts[i].plugins[j].cfg || {};
                            Y.mix(elts[i].plugins[j].cfg, data, true);
                            if (elts[i].plugins[j].cfg.children) {
                                mixMenuCfg(elts[i].plugins[j].cfg.children, data); // push data in children arg
                            }
                            if (elts[i].plugins[j].cfg.wchildren) {
                                mixMenuCfg(elts[i].plugins[j].cfg.wchildren, data);// push data in wchildren
                            }
                        }
                    }
                }

            }

            mixMenuCfg(menu, data);
            return menu;
        },
        /**
         * Returns the edition menu associated to this object, to be used a an wysiwyg editor.
         * @function
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
         *  @function
         *  @private
         */
        getStatic: function(key) {
            var c = this.constructor, ret = [];

            while (c) {
                if (c[key]) {                                                  // Add to attributes
                    ret[ret.length] = c[key];
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
        getName: function() {
            return this.constructor.EDITORNAME || this.constructor.NAME;
        }
    });
    Y.mix(Editable, {
        /** @lends Y.Wegas.Editable */

        /**
         * Load the modules from an Wegas widget definition
         * @function
         * @static
         * @param {Object}
         * @param {Function} cb callback to be called when modules are loaded
         */
        use: function(cfg, cb) {
            var modules = Editable.getModulesFromDefinition(cfg);
            modules.push(cb);
            Y.use.apply(Y, modules);
        },
        /**
         * Return recursively the inputex modules from their 'type' property using (modulesByType from loader.js)
         * @function
         * @static
         * @private
         */
        getRawModulesFromDefinition: function(cfg) {
            var i, props, type = cfg.type || cfg["@class"],
                    module = YUI_config.groups.wegas.modulesByType[type],
                    modules = [],
                    pushFn = function(field) {
                if (field) {
                    modules = modules.concat(Editable.getModulesFromDefinition(field));
                }
            };

            if (module) {
                modules.push(module);
            }

            props = ["children", "entities", "items"];                          // Revive array attributes
            for (i = 0; i < props.length; i += 1) {
                if (cfg[props[i]]) {                                            // Get definitions from children (for Y.WidgetParent widgets)
                    Y.Array.each(cfg[props[i]], pushFn);
                }
            }
            if (cfg.plugins) {                                                  // Plugins must be revived in the proper way
                Y.Array.each(cfg.plugins, function(field) {
                    field.cfg = field.cfg || {};
                    field.cfg.type = field.fn;
                    modules = modules.concat(Editable.getModulesFromDefinition(field.cfg));
                });
            }

            props = ["left", "right", "center", "top", "bottom"];               // Revive  objects attributes
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
         */
        getModulesFromDefinition: function(cfg) {
            var modules = Editable.getRawModulesFromDefinition(cfg);
            return Y.Object.keys(Y.Array.hash(modules));
        },
        /**
         *  This method takes a js object and recuresively instantiate it based on
         *  on their @class attribute. Target class are found in namespace
         *  Y.Wegas.persistence.
         *
         *  @static
         *  @param {Object} data the object to revive
         *  @return Y.Wegas.Widget the resulting entity
         */
        revive: function(data) {
            var walk = function(o, key) {
                var k, v, value = o[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            v = walk(value, k);
                            if (!Lang.isUndefined(v)) {
                                value[k] = v;
                            }
                        }
                    }
                    if (!Lang.isUndefined(value["@class"]) || !Lang.isUndefined(value.type)) {
                        return Editable.reviver(value);
                    }
                }
                return value;                                      // If no value was returned before, return raw original object
            };

            //return typeof reviver === 'function' ? walk({'':data},'') : data;
            return walk({
                '': data
            }, '');
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
            var classDef = Y.Wegas.persistence.DefaultEntity;

            if (o["@class"]) {
                classDef = Y.Wegas.persistence[o["@class"]] || Y.Wegas.persistence.DefaultEntity;

            } else if (o.type) {
                classDef = Y.Wegas.persistence[o.type] || Y.Wegas.persistence.WidgetEntity;

            }
            return new classDef(o);
        },
        /**
         *
         * Combine use and revive function to get a revived entity.
         *
         * @function
         * @static
         */
        useAndRevive: function(cfg, cb) {
            Editable.use(cfg, Y.bind(function(cb) {                            // Load target class dependencies
                cb(Editable.revive(this));
            }, cfg, cb));
        }
    });
    Y.namespace("Wegas").Editable = Editable;

});
