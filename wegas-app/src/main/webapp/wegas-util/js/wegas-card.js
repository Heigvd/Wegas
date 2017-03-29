/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Raphaël Schmutz
 */
YUI.add('wegas-card', function(Y) {
    "use strict";
    Y.Wegas.Card = Y.Base.create("wegas-card", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetParent, Y.WidgetChild], {
        BOUNDING_TEMPLATE: "<div class='wrapper wrapper--card' />",
        CONTENT_TEMPLATE: "<div class='card'><div class='card__title'></div></div>",
        renderUI: function() {
            if (this.get("icon")) {
                var tooltip = this.get("tooltip") || "";
                if (tooltip.length>0) tooltip = " title='" + tooltip + "' ";
                this.get("contentBox")
                    .addClass("card--illustred")
                    .prepend("<div class='card__icon'" + tooltip + "><i class='fa fa-" + this.get("icon") + "'></i></div>");
            }
        }
    }, {
        'ATTRS': {
            'id': {
                value: null
            },
            'title': {
                lazyAdd: false,
                value: "Empty card",
                setter: function(value) {
                    var ct = this.get("contentBox").one(".card__title");
                    ct.set("text", value);
                    var tooltip = this.get("tooltip") || "";
                    if (tooltip.length>0) {
                        setTimeout(function() {
                            ct.one("span").set("title", tooltip) },
                            1000);
                    }
                    return value;
                }
            },
            'icon': {
                value: null
            },
            'tooltip': {
                value: null
            },
            'defaultChildType': {
                value: Y.Wegas.CardBloc
            },
            'blocs': {
                lazyAdd: false,
                value: [],
                setter: function(value) {
                    this.destroyAll();
                    Y.Array.each(value, function(bloc) {
                        this.add(new Y.Wegas.CardBloc(bloc));
                    }, this);
                    return value;
                }
            }
        }
    });
});
