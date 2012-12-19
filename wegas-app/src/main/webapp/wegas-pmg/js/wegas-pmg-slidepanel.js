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
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add("wegas-pmg-slidepanel", function (Y) {
    "use strict";

    var CONTENTBOX = "contentBox", SlidePanel;

    SlidePanel = Y.Base.create("wegas-pmg-slidepanel", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        list: null,
        animation: null,
        cleaner: null,
        initializer: function () {
            this.handlers = {};
            this.list = new Y.Wegas.List({
                "children": this.get("children")
            });
        },
        renderUI: function () {
            var cb = this.get(CONTENTBOX), node;
            node = Y.Node.create("<div class='slidepanel' style='position:relative;'></div>")
            node.append("<div class='slidepanel-title'><h2>" + this.get('title') + "</h2></div>");
            node.append("<div class='slidepanel-content' style='position:absolute;'></div>");
            node.append("<div class='slidepanel-cleaner' style='position:relative; z-index:-1;'></div>");
            this.list.render(node.one('.slidepanel-content'));

            this.animation = node.one('.slidepanel-content').plug(Y.Plugin.NodeFX, {//slide animation
                from: {
                    height: 0
                },
                to: {
                    height: function (node) { // dynamic in case of change
                        return node.get('scrollHeight'); // get expanded height (offsetHeight may be zero)
                    }
                },
                easing: Y.Easing.easeOut,
                duration: 0.5
            }, this);

            this.cleaner = node.one('.slidepanel-cleaner').plug(Y.Plugin.NodeFX, {//compensates the non-height of the content's absolute position.
                from: {
                    height: 0
                },
                to: {
                    height: function (node) {
                        return node.ancestor().one('.slidepanel-content').get('scrollHeight');
                    }
                },
                easing: Y.Easing.easeOut,
                duration: 0.5
            }, this);
            cb.append(node);
        },
        bindUI: function () {
            var cb = this.get(CONTENTBOX);
            this.handlers.update = Y.Wegas.VariableDescriptorFacade.after("update", this.syncUI, this);
            
            this.handlers.anim = cb.one(".slidepanel-title").on('click', function (e) {
                this.animation.fx.set('reverse', !this.animation.fx.get('reverse')); // toggle reverse 
                this.animation.fx.run();
                this.cleaner.fx.set('reverse', !this.cleaner.fx.get('reverse')); // toggle reverse 
                this.cleaner.fx.run();
            }, this);
        },
        syncUI: function () {
            var cb = this.get(CONTENTBOX), height;
            height = cb.one('.slidepanel-content').get('scrollHeight');
            cb.one('.slidepanel-cleaner').setStyle('height', height); //compensates the non-height of the content's absolute position.
        },
        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.list.destroy();
            this.animation.destroy();
            this.cleaner.destroy();
        }

    }, {
        ATTRS: {
            title: {
                value: "unnamed",
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            children: {
                validator: Y.Lang.isArray
            }
        }
    });

    Y.namespace("Wegas").PmgSlidePanel = SlidePanel;
});