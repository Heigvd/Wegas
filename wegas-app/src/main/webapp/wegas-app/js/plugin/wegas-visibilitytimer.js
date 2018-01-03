/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-visibilitytimer", function(Y) {
    "use strict";
    var HIDDENNODECSSCLASS = "timed-hidden-node",
        VisibilityPlugin;

    VisibilityPlugin = function() {
        VisibilityPlugin.superclass.constructor.apply(this, arguments);
    };
    Y.extend(VisibilityPlugin, Y.Plugin.Base, {
        initializer: function() {
            this.timers = [];
            this.initialVisible = null;
            if (this.get("host") instanceof Y.Widget) {
                this.initialVisible = this.get("host").get("visible");
            } else if (this.get("host") instanceof Y.Node) {
                this.initialVisible = this.get("host").hasClass(HIDDENNODECSSCLASS);
            }
            this.set("time", this.get("time"));
            this.restartEvent = Y.on("visibility-timer:restart", function() {
                this.reset();
                this.start();
            }, this);
            this.start();
        },
        reset: function() {
            var t, host = this.get("host");
            for (t in this.timers) {
                this.timers[t].cancel();
            }
            if (host instanceof Y.Widget) {
                host.set("visible", this.initialVisible);
            } else if (host instanceof Y.Node) {
                host.toggleClass(HIDDENNODECSSCLASS, !this.initialVisible);
            }
        },
        start: function() {
            Y.log("Abstract function, needs to be implemented", "warn");
        },
        destructor: function() {
            this.reset();
            this.restartEvent.detach();
        }
    }, {
        ATTRS: {
            time: {
                value: "0",
                type: "string",
                _inputex: {
                    label: "Timer ms"
                },
                setter: function(v) {
                    this._set("arrayTime", v.split(/[ ,]+/));
                    return v;
                }
            },
            arrayTime: {
                readOnly: true,
                type: "array",
                "transient": true,

                _inputex: {
                    _type: "hidden"
                }
            }
        }
    });

    /**
     *
     */
    Y.Plugin.ShowAfter = Y.Base.create("wegas-showafter", VisibilityPlugin, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /**
         * @lends Y.Plugin.ShowAfter#
         */

        start: function() {
            var host = this.get("host"), time;
            this.reset();
            if (host instanceof Y.Widget) {
                for (time in this.get("arrayTime")) {
                    this.timers.push(Y.later(+this.get("arrayTime")[time], host, host.show));
                }
            } else if (host instanceof Y.Node) {
                for (time in this.get("arrayTime")) {
                    this.timers.push(Y.later(+this.get("arrayTime")[time], host, host.removeClass, HIDDENNODECSSCLASS));
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
            time: {
                _inputex: {
                    label: "Show after (ms)",
                    description: "Multiple times may be separated by ','",
                    regexp: /^([0-9]+(,|, | , | ,)?)*[^, ]$/
                }
            }
        }
    });
    Y.Plugin.HideAfter = Y.Base.create("wegas-hideafter", VisibilityPlugin, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        /**
         * @lends Y.Plugin.HideAfter#
         */

        start: function() {
            var host = this.get("host"), time;
            this.reset();
            if (host instanceof Y.Widget) {
                for (time in this.get("arrayTime")) {
                    this.timers.push(Y.later(+this.get("arrayTime")[time], host, host.hide));
                }
            } else if (host instanceof Y.Node) {
                for (time in this.get("arrayTime")) {
                    this.timers.push(Y.later(+this.get("arrayTime")[time], host, host.addClass, HIDDENNODECSSCLASS));
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
            time: {
                _inputex: {
                    label: "Hide after (ms)",
                    description: "Multiple times may be separated by ','",
                    regexp: /^([0-9]+(,|, | , | ,)?)*[^, ]$/
                }
            }
        }
    });
});
