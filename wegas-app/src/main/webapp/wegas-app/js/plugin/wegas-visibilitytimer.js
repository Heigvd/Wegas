/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-visibilitytimer", function(Y) {
    "use strict";
    
    var HIDDENNODECSSCLASS = "timed-hidden-node",
            visibilityPlugin;
    visibilityPlugin = function() {
        visibilityPlugin.superclass.constructor.apply(this, arguments);
    };
    Y.extend(visibilityPlugin, Y.Plugin.Base, {
        initializer: function() {
            this.timers = [];
            this.initialVisible = null;
            if (this.get("host") instanceof Y.Widget) {
                this.initialVisible = this.get("host").get("visible");
            } else if (this.get("host") instanceof Y.Node) {
                this.initialVisible = this.get("host").hasClass(HIDDENNODECSSCLASS);
            }
            this.onHostEvent("visibility-timer:restart", function(e){
                this.start();
            });
            if (this.get("autoStart")) {
                this.start();
            }
        },
        reset: function() {
            var t;
            if (this.timers.length > 0) {
                for (t in this.timers) {
                    this.timers[t].cancel();
                }
            }
            if (this.initialVisible) {
                if (this.get("host") instanceof Y.Widget) {
                    this.get("host").show();
                } else if (this.get("host") instanceof Y.Node) {
                    this.get("host").removeClass(HIDDENNODECSSCLASS);
                }
            } else {
                if (this.get("host") instanceof Y.Widget) {
                    this.get("host").get("visible").hide();
                } else if (this.get("host") instanceof Y.Node) {
                    this.get("host").addClass(HIDDENNODECSSCLASS);
                }
            }
        },
        start: function() {
            Y.log("Abstract function, needs to be implemented", "warn");
        }
    });
    Y.mix(visibilityPlugin, {
        ATTRS: {
            time: {
                value: "0",
                type: "string",
                _inputEx: {
                    label: "ms"
                },
                getter: function(v) {
                    return v.split(",");
                }
            },
            autoStart: {
                value: true,
                type: "boolean"
            }
        }
    });


    Y.Plugin.ShowAfter = Y.Base.create("wegas-showafter", visibilityPlugin, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /**
         * @lends Y.Plugin.ShowAfter#
         */

        start: function() {
            var host = this.get("host"), time;
            this.reset();
            if (host instanceof Y.Widget) {
                for (time in this.get("time")) {
                    this.timers.push(Y.later(+this.get("time")[time], host, host.show));
                }
            } else if (host instanceof Y.Node) {
                for (time in this.get("time")) {
                    this.timers.push(Y.later(+this.get("time")[time], host, host.removeClass, HIDDENNODECSSCLASS));
                }
            }
        }

    }, {
        /**
         * @lends Y.Plugin.ShowAfter#
         */
        NAME: "ShowAfter",
        NS: "showafter",
        ATTRS: {
        }
    });

    Y.Plugin.HideAfter = Y.Base.create("wegas-hideafter", visibilityPlugin, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /**
         * @lends Y.Plugin.HideAfter#
         */

        start: function() {
            var host = this.get("host"), time;
            this.reset();
            if (host instanceof Y.Widget) {
                for (time in this.get("time")) {
                    this.timers.push(Y.later(+this.get("time")[time], host, host.hide));
                }
            } else if (host instanceof Y.Node) {
                for (time in this.get("time")) {
                    this.timers.push(Y.later(+this.get("time")[time], host, host.addClass, HIDDENNODECSSCLASS));
                }
            }
        }
    }, {
        /**
         * @lends Y.Plugin.HideAfter#
         */
        NAME: "HideAfter",
        NS: "hideafter",
        ATTRS: {
        }
    });
});


