/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-pmg-slidepanel", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", SlidePanel;

    SlidePanel = Y.Base.create("wegas-pmg-slidepanel", Y.Widget, [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Layout], {
        handlers: null,
        list: null,
        animation: null,
        cleaner: null,
        initializer: function() {
            this.handlers = {};
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX), node, titelNode, bb = this.get("boundingBox");
            titelNode = Y.Node.create("<div class='slidepanel-title' style='position:relative;'><h2>" + this.get('title') + "</h2></div>");

            bb.insertBefore(titelNode, cb);
            bb.append("<div class='slidepanel-cleaner' style='position:relative; z-index:-1;'></div>");

            cb.setStyle("position", "absolute");
            cb.setStyle("width", "100%");

            if (this.get("animation")) {
                this.animation = cb.plug(Y.Plugin.NodeFX, {//slide animation
                    from: {
                        height: 0
                    },
                    to: {
                        height: function(node) { // dynamic in case of change
                            return node.get('scrollHeight'); // get expanded height (offsetHeight may be zero)
                        }
                    },
                    easing: Y.Easing.easeOut,
                    duration: 0.5
                }, this);

                this.cleaner = cb.ancestor().one(".slidepanel-cleaner").plug(Y.Plugin.NodeFX, {//compensates the non-height of the content's absolute position.
                    from: {
                        height: 0
                    },
                    to: {
                        height: function(node) {
                            return node.ancestor().one(".wegas-pmg-slidepanel-content").get('scrollHeight');
                        }
                    },
                    easing: Y.Easing.easeOut,
                    duration: 0.5
                }, this);
            }
        },
        bindUI: function() {
            var cb = this.get(CONTENTBOX), bb = this.get("boundingBox");
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            if (this.get('animation')) {
                this.handlers.anim = bb.one(".slidepanel-title").on('click', function(e) {
                    e.preventDefault();

                    this.animation.fx.set('reverse', !this.animation.fx.get('reverse')); // toggle reverse
                    this.animation.fx.run();
                    this.cleaner.fx.set('reverse', !this.cleaner.fx.get('reverse')); // toggle reverse
                    this.cleaner.fx.run();
                }, this);
            }
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX), height;
            height = cb.get('scrollHeight');
            cb.ancestor().one(".slidepanel-cleaner").setStyle('height', height); //compensates the non-height of the content's absolute position.
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            if (this.get('animation')) {
                this.animation.destroy();
                this.cleaner.destroy();
            }
        }

    }, {
        ATTRS: {
            title: {
                value: "unnamed",
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                },
                _inputex: {
                    _type: "string",
                    label: "Titel"
                }
            },
            animation: {
                value: true,
                _inputex: {
                    _type: "boolean",
                    label: "Animation"
                }
            }
        }
    });

    Y.namespace("Wegas").PmgSlidePanel = SlidePanel;
});