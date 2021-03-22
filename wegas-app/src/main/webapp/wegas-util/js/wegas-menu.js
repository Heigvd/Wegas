/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Cyril Junod
 */
YUI.add('wegas-menu', function(Y) {
    'use strict';

    var WegasMenu,
        CONTENT_BOX = "contentBox",
        tooltipTrigger = "wegas-tooltip-trigger";

    WegasMenu = Y.Base.create("wegas-menu", Y.Widget, [], {
        BOUNDING_TEMPLATE: "<div></div>",
        CONTENT_TEMPLATE: null,
        nodeInstances: null,
        eventInstances: null,
        clickHandler: null,
        initializer: function() {
            this.nodeInstances = [];
            this.eventInstances = [];
            this.publish("itemClick", {
                emitFacade: true,
                bubbles: true
            });
        },
        syncUI: function() {
            this.buildMenu(this.get("items"), this.get(CONTENT_BOX));

        },
        bindUI: function() {
            this.clickHandler = this.get(CONTENT_BOX).delegate('click', function(e) {// Listen for click events on the table
                e.stopImmediatePropagation();
                this.fire("itemClick", {
                    data: e.currentTarget.item.data,
                    params: this.get("params")
                });
            }, 'li', this);
            if (this.get("eventTarget")) {
                this.addTarget(this.get("eventTarget"));
            }
        },
        destructor: function() {
            this.clickHandler.detach();
            for (var n in this.nodeInstances) {
                this.nodeInstances[n].destroy();
            }
        },
        buildMenu: function(items, node) {
            var listItem, item, content = Y.Node.create("<ul></ul>");
            for (var n in this.nodeInstances) {
                this.nodeInstances[n].destroy();
            }
            node.empty();
            for (var i in items) {
                item = items[i];

                listItem = this.itemCreator(item);
                if (item.items) {
                    this.buildMenu(item.items, listItem);
                }
                content.append(listItem);
                this.nodeInstances.push(listItem);
            }
            node.append(content);
        },
        itemCreator: function(item) {
            //TODO: Tooltip
            var node = Y.Node.create("<li><div>" + (item.cssClass ? "<span class='menu-icon " + item.cssClass + "'></span>" : "") + "<span>" + (item.label ? item.label : "") + "</span></div></li>"),
                divNode = node.one("div");
            node.item = item;
            node.addClass(this.getClassName("itemlist", this.get("horizontal") ? "horizontal" : "vertical"));
            if (item.tooltip) {
                divNode.addClass(tooltipTrigger);
                divNode.setAttribute("title", item.tooltip);
            }
            return node;
        }

    }, {
        NAME: "wegas-menu",
        CSS_PREFIX: "wegas-menu",
        ATTRS: {
            eventTarget: {
                value: null
            },
            items: {
                validator: Y.Lang.isArray
            },
            horizontal: {
                value: false
            },
            params: {// Given input params returned with the click event, a reference for instance
                value: null
            }
        }
    });

    Y.namespace('Wegas').WegasMenu = WegasMenu;
});