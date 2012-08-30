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

YUI.add('wegas-widget', function (Y) {
    "use strict";

    var Lang = Y.Lang,
    CONTENTBOX = 'contentBox';

    function Widget() {
        this.after('render', function () {
            if (this.get('cssClass')) {
                this.get(CONTENTBOX).addClass(this.get('cssClass'));
            }
        });
        this.constructor.CSS_PREFIX = this.constructor.CSS_PREFIX || this.constructor.NAME.toLowerCase();
        this._cssPrefix = this.constructor.CSS_PREFIX;
    }

    Y.mix(Widget.prototype, {
        /*   _overlay: null,

            hideReloadOverlay: function(){
                    this._overlay.hide();
            },

            showReloadOverlay: function(){
                    var bb = this.get('boundingBox');

                    if (!this._overlay) {
                            this._overlay = Y.Node.create('<div class="yui3-redcms-loading-overlay"><div></div></div>');
                            bb.prepend(this._overlay);
                    }
                    this._overlay.one('div').setStyle('height', bb.getComputedStyle('height'));
                    this._overlay.show();
            }*/
        });

    Y.mix(Widget, {
        ATTRS: {
            cssClass: {}
        },
        create: function (config) {
            var type = config.childType || config.type,
            child, Fn;

            if (type) {
                Fn = Lang.isString(type) ? Y.Wegas[type] || Y[type] : type;
            }

            if (Lang.isFunction(Fn)) {
                child = new Fn(config);
            } else {
                Y.log("Could not create a child widget because its constructor is either undefined or invalid(" + type + ").", 'error', 'Wegas.Widget');
            }

            return child;
        },

        /**
        * Returns the class for the given type
        *
        * @static
        * @param {String} type String type of the field
        */
        getClass: function( type ) {
        // @todo
        },

        /**
        * Get the type for the given class
        * @static
        * @param {Wegas.Widget} Widget Class
        * @return {String} returns the Wegas type string or <code>null</code>
        */
        getType: function( FieldClass ) {
        // @todo
        },


        /**
        * Return recursively the inputex modules from their 'type' property using (modulesByType from loader.js)
        */
        getRawModulesFromDefinition: function(cfg) {

            var props, type = cfg.type || 'text',
            module = YUI_config.groups.wegas.modulesByType[type],
            modules = [];

            if (module) {
                modules.push(module);
            }

            props = [ "children" ]
            for (var i = 0; i < props.length; i = i + 1) {
                if (cfg[props[i]]) {                                            // Get definitions from children (for Y.WidgetParents)
                    Y.Array.each(cfg[props[i]], function(field) {
                        modules = modules.concat( this.getModulesFromDefinition(field) );
                    }, this);
                }
            }

            props = ["left", "right", "center", "top", "bottom"];           // Get definitions from children (for Y.Wegas.Layouts)
            for (var i = 0; i < props.length; i = i + 1) {
                if (cfg[props[i]]) {
                    modules = modules.concat(this.getModulesFromDefinition(cfg[props[i]]));
                }
            }

            return modules;
        },
        /**
         * Return unique modules definitions
         */
        getModulesFromDefinition: function(cfg) {
            var modules = Y.Wegas.Widget.getRawModulesFromDefinition(cfg);
            return Y.Object.keys(Y.Array.hash(modules));
        },
        /**
         * Load the modules from an Wegas widget definition
         */
        use: function(cfg, cb) {
            var modules = Y.Wegas.Widget.getModulesFromDefinition(cfg);
            modules.push(cb);
            Y.use.apply( Y, modules);
        }
    });
    
    Y.namespace('Wegas').Widget = Widget;

    /**
     * @FIXME We override this function so widget are looked for in Wegas ns.
     */
    Y.WidgetParent.prototype._createChild = function (config) {
        var defaultType = this.get("defaultChildType"),
        altType = config.childType || config.type,
        child,
        Fn,
        FnConstructor;

        if (altType) {
            Fn = Lang.isString(altType) ? Y.Wegas[altType] || Y[altType] : altType;           // @hacked
        }

        if (Lang.isFunction(Fn)) {
            FnConstructor = Fn;
        } else if (defaultType) {
            // defaultType is normalized to a function in it's setter
            FnConstructor = defaultType;
        }

        if (FnConstructor) {
            child = new FnConstructor(config);
        } else {
            Y.error("Could not create a child instance because its constructor is either undefined or invalid (" + altType + ")");
        }
        return child;
    };

    /*
     * FIXME Hack so plugin host accepts string definition of classes
     */
    var newPlug = Y.DataSource.IO.prototype.plug = function(Plugin, config) {
        var i, ln, ns;

        if (Lang.isArray(Plugin)) {
            for (i = 0, ln = Plugin.length; i < ln; i++) {
                this.plug(Plugin[i]);
            }
        } else {
            if (Plugin && !Lang.isFunction(Plugin)) {
                config = Plugin.cfg;
                Plugin = Plugin.fn;
            }
            if (Plugin && !Lang.isFunction(Plugin)) {			// @hacked
                Plugin = Y.Plugin[Plugin];
            }

            // Plugin should be fn by now
            if (Plugin && Plugin.NS) {
                ns = Plugin.NS;

                config = config || {};
                config.host = this;

                if (this.hasPlugin(ns)) {
                    // Update config
                    this[ns].setAttrs(config);
                } else {
                    // Create new instance
                    this[ns] = new Plugin(config);
                    this._plugins[ns] = Plugin;
                }
            }
        }
        return this;
    };
    Y.Widget.prototype.plug = newPlug;
    Y.DataSource.IO.prototype.plug = newPlug;
});
