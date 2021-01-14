/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-slideshow", function(Y) {
    "use strict";
    /**
     * Plugin to transform A Y.Wegas.ChoiceList into a timed slideshow.
     * @constructor
     * @name Y.Plugin.SlideShow
     * @augments Y.Wegas.Plugin, Y.Wegas.Editable
     * @extends Y.Plugin.Base
     */
    var SlideShow = Y.Base.create("SlideShow", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            if (!this.get("host") instanceof Y.Wegas.ChoiceList) {
                Y.log("Host should be a ChoiceList", "warn", "Y.Plugin.SlideShow");
                return;
            }
            /*
             * Change Host's Type
             */
            this.beforeHostMethod("getType", function() {
                return new Y.Do.Halt(null, "SlideShow");
            });
        },
        /**
         * Increment host's element index
         * @function
         * @returns {undefined}
         */
        next: function() {
            this.get("host").set("element", this.get("host").get("element") + 1);
        },
        destructor: function() {
            if (this._timer) {
                this._timer.cancel();
            }
        }
    }, {
        NS: "SlideShow",
        ATTRS: {
            delay: {
                value: 3000,
                type: "number",
                validator: Y.Lang.isNumber,
                lazyAdd: false,
                view: {
                    label: "Delay ms"
                },
                setter: function(v) {
                    if (this._timer) {
                        this._timer.cancel();
                    }
                    this._timer = Y.later(v, this, this.next, null, true);
                    return v;
                }
            }
        }
    });
    Y.Plugin.SlideShow = SlideShow;
});