/* 
 * Wegas
 * http://wegas.albasim.ch
 
 * Copyright (c) 2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */

YUI.add('wegas-serverlog', function(Y) {
    "use strict";
    /**
     * 
     * @param {Array} logs array of logs: {type, val}
     * @returns {undefined}
     */
    var output = function(logs) {
        var cur;
        if (console) {
            if (console.groupCollapsed) {
                console.groupCollapsed("Server logs");
            }
            while (logs.length) {
                cur = logs.shift();
                if (console[cur.type]) {
                    console[cur.type](cur.val);
                }
            }
            if (console.groupEnd) {
                console.groupEnd();
            }
        }
    };
    Y.namespace("Plugin").ServerLog = Y.Base.create("ServerLog", Y.Plugin.Base, [], {
        initializer: function() {
            this.timer = null;
            this.logs = [];
            this.onHostEvent(["*:log", "*:warn", "*:info", "*:error", "*:debug"], function(e) {
                this.logs.push({type: e.type.split(":").pop(), val: e.details[0]});
                this._out();
            });
            this.onHostEvent("ExceptionEvent", function(e) {
                this.logs.push({type: "error", val: e.details[0]});
                this._out();
            });
        },
        _out: function() {
            if (this.timer) {
                this.timer.cancel();
            }
            this.timer = Y.later(20, this, function() {
                output(this.logs);
                this.logs.length = 0;
            });
        },
        destructor: function() {
            if (this.timer) {
                this.timer.cancel();
                this.logs.length = 0;
            }
        }
    }, {
        NS: "serverlog"
    });
});
