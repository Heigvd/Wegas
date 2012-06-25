/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-widget', function (Y) {
    "use strict";

    var Lang = Y.Lang,
    CONTENTBOX = 'contentBox';

    function Widget() {
        this.after('render', function () {
            var cb = this.get(CONTENTBOX);
            cb.addClass(this.get('cssClass'));
        });
        this.constructor.CSS_PREFIX = this.constructor.NAME.toLowerCase();
        this._cssPrefix = this.constructor.NAME.toLowerCase();
        /*this.publish("wegas:select", {
            emitFacade: false
        });
        this.publish("wegas:reload", {
            emitFacade: false
        });
        this.publish("wegas:success", {
        defaultTargetOnly: true,
        defaultFn: this._defAddChildFn
        });*/
    }
    //Widget.CSS_PREFIX = "wegas";
    Widget.ATTRS = {
        cssClass: {}
    };
    Widget.create = function (config) {
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
    };

    Widget.prototype = {
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
    };

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
