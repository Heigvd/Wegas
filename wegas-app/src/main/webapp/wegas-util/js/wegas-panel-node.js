/* 
 * Wegas
 * http://wegas.albasim.ch
 
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */

YUI.add("wegas-panel-node", function(Y) {
    "use strict";
    var PanelNode, DECELERATION = 0.93,
        requestAnimationFrame = (function() {
            return  window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    return window.setTimeout(function() {
                        callback(Y.Lang.now());
                    }, 1000 / 60); //Fallback 60 FPS
                };
        }()),
        cancelAnimationFrame = (function() {
            return  window.cancelAnimationFrame ||
                window.webkitCancelAnimationFrame ||
                window.mozCancelAnimationFrame ||
                window.msCancelAnimationFrame ||
                window.clearTimeout;
        }());
    PanelNode = Y.Base.create("panel-node", Y.Plugin.Base, [], {
        initializer: function() {
            var node = this.get("host");
            this.handlers = [];
            this._lastDelta = null;
            this.dd = new Y.DD.Drag({
                node: node
            });
            this.handlers.push(node.on("mousedown", function() {
                if (this.timer) {
                    cancelAnimationFrame(this.timer);
                }
            }, this));
            this.dd.on("drag:drag", function(e) {
                e.halt();
                this.set("scrollX", this.get("scrollX") - e.info.delta[0]);
                this.set("scrollY", this.get("scrollY") - e.info.delta[1]);
                this._lastDelta = {
                    x: e.info.delta[0],
                    y: e.info.delta[1],
                    t: Y.Lang.now()
                };
            }, this);
            this.dd.on("drag:end", function(e) {
                var decelerate = function(ctx, x, y, lastTime) {
                    ctx.set("scrollX", ctx.get("scrollX") - x);
                    ctx.set("scrollY", ctx.get("scrollY") - y);

                    if (Math.abs(x) > 0.9 || Math.abs(y) > 0.9) {
                        x = x * DECELERATION;
                        y = y * DECELERATION;
                        ctx.timer = requestAnimationFrame(function(time) {
                            /*    var nDesc;
                             if (lastTime) {
                             nDesc = DECELERATION / (time - lastTime) * 1000 / 60;
                             } else {
                             nDesc = DECELERATION;
                             }
                             x = x * nDesc;
                             y = y * nDesc;*/
                            decelerate(ctx, x, y, time);
                        }, ctx.get("host").ancestor().getDOMNode());
                    }

                };
                if (e.endTime - this._lastDelta.t > 100) { //User stopped
                    return;
                }
                decelerate(this, this._lastDelta.x, this._lastDelta.y);
                this.lastDelta = null;
            }, this);
        },
        destructor: function() {
            var i;
            this.dd.destroy();
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
            cancelAnimationFrame(this.timer);
        }
    }, {
        NS: "panel",
        ATTRS: {
            scrollX: {
                setter: function(v) {
                    this.get("host").ancestor().getDOMNode().scrollLeft = v;
                }, getter: function() {
                    return this.get("host").ancestor().getDOMNode().scrollLeft;
                }
            },
            scrollY: {
                setter: function(v) {
                    this.get("host").ancestor().getDOMNode().scrollTop = v;
                }, getter: function() {
                    return this.get("host").ancestor().getDOMNode().scrollTop;
                }
            }
        }
    });
    Y.Plugin.PanelNode = PanelNode;
});


