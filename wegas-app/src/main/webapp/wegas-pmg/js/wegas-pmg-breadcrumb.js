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
YUI.add("wegas-pmg-breadcrumb", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Breadcrumb;

    Breadcrumb = Y.Base.create("wegas-pmg-breadcrumb", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        handlers: null,
        initializer: function() {
            this.handlers = {};
        },
        renderUI: function() {
            var i, node, cb = this.get(CONTENTBOX), locations = this.get("locations");
            if (locations.length === 0)
                return;
            node = Y.Node.create("<div class='pmg-breadcrumb'></div>");
            for (i = 0; i < locations.length; i++) {
                node.append("<span class='element_" + i + "'>" + locations[i] + "</span>");
            }
            cb.append(node);
        },
        bindUI: function() {
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
        },
        syncUI: function() {
            var i, cb = this.get(CONTENTBOX), locations = this.get("locations"), varValue,
                varDesc = Y.Wegas.Facade.VariableDescriptor.cache.find("name", this.get("variable"));
            if (locations.length === 0 || !varDesc) {
                return;
            }
            cb.all(".pmg-breadcrumb span").each(function(node) {
                node.removeClass("previous").removeClass("current").removeClass("next");
            });
            varValue = varDesc.getInstance().get("value") - varDesc.get("minValue");
            if (typeof varValue === "string") {
                for (i = 0; i < locations.length; i++) {
                    if (locations[i] === varValue)
                        cb.one(".pmg-breadcrumb .element_" + (i + 1)).addClass("current");
                    if (locations[i] < varValue)
                        cb.one(".pmg-breadcrumb .element_" + (i + 1)).addClass("previous");
                    if (locations[i] > varValue)
                        cb.one(".pmg-breadcrumb .element_" + (i + 1)).addClass("next");
                }
            }
            else if (typeof varValue === "number") {
                if (varValue > locations.length || varValue < 0)
                    return;
                for (i = 0; i < locations.length; i++) {
                    if (i === varValue)
                        cb.one(".pmg-breadcrumb .element_" + i).addClass("current");
                    if (i < varValue)
                        cb.one(".pmg-breadcrumb .element_" + i).addClass("previous");
                    if (i > varValue)
                        cb.one(".pmg-breadcrumb .element_" + i).addClass("next");
                }
            }
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        }

    }, {
        ATTRS: {
            locations: {
                validator: Y.Lang.isArray
            },
            variable: {
                type: "String",
                value: null
            }
        }
    });

    Y.Wegas.PmgBreadcrumb = Breadcrumb;
});