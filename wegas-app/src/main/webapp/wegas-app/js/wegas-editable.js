/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editable', function (Y) {
    "use strict";


    /**
     *  Add custom attributes to be used in ATTR param in static cfg.
     */
    Y.Base._ATTR_CFG.push("type", "properties", "_inputex", "optional", "format", "choices", "items", "enum", "default", "transient");
    Y.Base._ATTR_CFG_HASH = Y.Array.hash(Y.Base._ATTR_CFG);

    /**
     *
     */
    function Editable() { }

    Y.mix(Editable.prototype, {
        /**
         * Serialize to a json object. Method used <b>recursively</b> by JSON.stringify
         *
         * @method toJSON
         * @return {object}
         */
        toJSON: function () {
            var k, ret = this.getAttrs(),
            attrCfgs = this.getAttrCfgs();

            for (k in ret) {
                if (attrCfgs[k] && attrCfgs[k]["transient"]) {                           // Remove any transient attribute
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
         * @method toObject
         * @param {Array} mask or {String}* a list of params
         * @return {Object} a filtered out clone
         */
        toObject: function (mask) {
            var e = JSON.parse(JSON.stringify(this));
            mask = Y.Lang.isArray(mask) ? mask : Array.prototype.slice.call(arguments);
            return mask.length > 0 ? Y.clone(e, true, function (value, key, output, input) {
                if (mask.indexOf(key) !== -1) {
                    return false;
                } else {
                    return true;
                }
            }) : e;

        },
        /**
         * Create a new Object from this entity
         * may be used by revive
         * @method clone
         * @return {Object} a clone
         */
        clone: function () {
            return this.toObject(["id", "variableInstances"]);
        },
        /**
         * Returns the form configuration associated to this object, to be used a an inputex object.
         */
        getFormCfg: function () {
            var i, form, schemaMap, attrCfgs, builder;
            // forms = Y.Wegas.app.get('editorForms'),                          // Select first server defined forms, based on the @class or the type attribute
            // form = forms[this.get('@class')] || forms[this.get("type")]

            form = form || this.constructor.EDITFORM;                          // And if no form is defined we check if there is a default one defined in the entity

            if (!form) {                                                        // If no edit form could be found, we generate one based on the ATTRS parameter.
                attrCfgs = this.getAttrCfgs();

                for (i in attrCfgs) {
                    attrCfgs[i]["default"] = attrCfgs[i].value;                 // Use the value as default (useful form json object serialization)

                    if (attrCfgs[i]["transient"]) {
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
         */
        getMenuCfg: function (data) {
            var menus = Y.Wegas.app.get('editorMenus'),
            //    staticMenus =
            menu;

            if (menus) {
                menu = menus[ this.get('@class')] || menus[this.get("type")];  // Select first server defined forms, based on the @class or the type attribute
            }
            menu = menu || this.getStatic("EDITMENU")[0] || [];                 // And if no form is defined we return the default one defined in the entity


            function mixMenuCfg(elts, data) {
                var i, j;
                for (i = 0; i < elts.length; i += 1) {
                    elts[i].data = Y.mix({}, data);// Attach self and the provided datasource to the menu items, to allow them to know which entity to update

                    if (elts[i].plugins) {
                        for (j = 0; j < elts[i].plugins.length; j = j + 1) {
                            if (elts[i].plugins[j].cfg && elts[i].plugins[j].cfg.children) {
                                mixMenuCfg(elts[i].plugins[j].cfg.children, data);
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
         */
        getMethodCfgs: function (data) {
            var menu = this.getStatic("METHODS")[0] || {};
            return menu;
        },
        /**
         *  Helper function that walks the class hierarchy and returns it's attributes
         *  cfg (ATTRS), used in Y.Wegas.Entity.getFormCfg().
         */
        getAttrCfgs: function () {
            return this._aggregateAttrs(this.getStatic("ATTRS"));
        },
        getStatic: function (key) {
            var c = this.constructor, ret = [];

            while (c) {
                if (c[key]) {                                                  // Add to attributes
                    ret[ret.length] = c[key];
                }
                c = c.superclass ? c.superclass.constructor : null;
            }
            return ret;
        }
    });
    Y.mix(Editable, {

        /**
         * Load the modules from an Wegas widget definition
         */
        use: function (cfg, cb) {
            var modules = Editable.getModulesFromDefinition(cfg);
            modules.push(cb);
            Y.use.apply(Y, modules);
        },

        /**
        * Return recursively the inputex modules from their 'type' property using (modulesByType from loader.js)
        */
        getRawModulesFromDefinition: function (cfg) {
            var i, props, type = cfg.type || "text",
            module = YUI_config.groups.wegas.modulesByType[type],
            modules = [];

            if (module) {
                modules.push(module);
            }

            props = [ "children" ];
            for (i = 0; i < props.length; i = i + 1) {
                if (cfg[props[i]]) {                                            // Get definitions from children (for Y.WidgetParent widgets)
                    Y.Array.each(cfg[props[i]], function (field) {
                        modules = modules.concat(Editable.getModulesFromDefinition(field));
                    });
                }
            }
            if (cfg.plugins) {                                                   // Get definitions from children (for Y.WidgetParent widgets)
                Y.Array.each(cfg.plugins, function (field) {
                    field.cfg = field.cfg || {};
                    field.cfg.type = field.fn;
                    modules = modules.concat(Editable.getModulesFromDefinition(field.cfg));
                });
            }

            props = ["left", "right", "center", "top", "bottom"];               // Get definitions from children (for Y.Wegas.Layout widgets)
            for (i = 0; i < props.length; i = i + 1) {
                if (cfg[props[i]]) {
                    modules = modules.concat(Editable.getModulesFromDefinition(cfg[props[i]]));
                }
            }

            return modules;
        },
        /**
         * Return unique modules definitions
         */
        getModulesFromDefinition: function (cfg) {
            var modules = Editable.getRawModulesFromDefinition(cfg);
            return Y.Object.keys(Y.Array.hash(modules));
        },

        /**
         *  This method takes a parsed json object and instantiate them based
         *  on their @class attribute. Target class are found in namespace
         *  Y.Wegas.Data.
         */
        revive: function (data) {
            var walk = function (o, key) {
                var k, v, value = o[key];
                if (value && typeof value === "object") {
                    for (k in value) {
                        if (value.hasOwnProperty(k)) {
                            v = walk(value, k);
                            if (v === undefined) {
                            //delete value[k];
                            } else {
                                value[k] = v;
                            }
                        }
                    }
                    if (!Y.Lang.isArray(value) &&
                        (!Y.Lang.isUndefined(value["@class"]) || !Y.Lang.isUndefined(value.type))) {
                        return Y.Wegas.Editable.readObject(value);
                    }
                }
                return value;                                                   // If no value was returned before, return raw original object
            };

            //return typeof reviver === 'function' ? walk({'':data},'') : data;
            return walk({
                '': data
            }, '');
        },
        readObject: function (o) {
            var classDef = Y.Wegas.persistence.Entity;

            if (o["@class"]) {
                classDef = Y.Wegas.persistence[o["@class"]] || Y.Wegas.persistence.DefaultEntity;

            } else if (o.type) {
                classDef = Y.Wegas.persistence[o.type] || Y.Wegas.persistence.WidgetEntity;

            } else {
                if (o["@class"] && o["@class"].indexOf("Descriptor") !== -1) {  // @Hack so VariableDescriptors are instantiated even if they dont have a mapping
                    classDef = Y.Wegas.persistence.VariableDescriptor;
                }
                if (o["@class"] && o["@class"].indexOf("Instance") !== -1) {    // @Hack so VariableInstances are instantiated even if they dont have a mapping
                    classDef = Y.Wegas.persistence.VariableInstance;
                }
            }
            return new classDef(o);
        }
    });
    Y.namespace("Wegas").Editable = Editable;

});
