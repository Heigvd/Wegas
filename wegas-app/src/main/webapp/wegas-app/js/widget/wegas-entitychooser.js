/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-entitychooser", function(Y) {
    "use strict";
    var CONTENTBOX = "contentBox", EntityChooser;

    EntityChooser = Y.Base.create("wegas-entitychooser",
        Y.Widget,
        [Y.WidgetChild,
            Y.Wegas.Widget,
            Y.Wegas.Editable],
        {
            CONTENT_TEMPLATE: "<div><ul class='chooser-entities'></ul><div class='chooser-widget'></div></div>",
            renderUI: function() {
                var items = this.get("variable.evaluated") ? this.get("variable.evaluated").flatten() : [],
                    i, entityBox = this.get(CONTENTBOX).one(".chooser-entities");
                for (i in items) {
                    entityBox.append("<li class='chooser-entity' data-name='" + items[i].get("name") + "'>" +
                                     (items[i].get("title") || items[i].get("label")) + "</li>");
                }
                this.widget;
            },
            bindUI: function() {
                this.get(CONTENTBOX).delegate("click", function(e) {
                    this.genWidget(e.target.getData("name"));
                    this.get(CONTENTBOX).all(".chooser-choosen").removeClass("chooser-choosen");
                    e.target.addClass("chooser-choosen");
                }, ".chooser-entities .chooser-entity", this);
            },
            genWidget: function(name) {
                var cfg = this.get("widget");
                if (this.widget) {
                    this.widget.set(this.get("widgetAttr"), {name: name});
                } else {
                    cfg[this.get("widgetAttr")] = {name: name};
                    Y.Wegas.use(cfg, Y.bind(function() {
                        this.widget = Y.Wegas.Widget.create(cfg);
                        this.widget.render(this.get(CONTENTBOX).one(".chooser-widget"));
                    }, this));
                }
            },
            syncUI: function() {

            }

        },
        {
            ATTRS: {
                variable: {
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    _inputex: {
                        _type: "variableselect",
                        legend: "Folder",
                        classFilter: ["ListDescriptor"]
                    }
                },
                widget: {
                    value: {type: "HistoryDialog"},
                    getter: function(v) {
                        return Y.JSON.parse(Y.JSON.stringify(v));
                    },
                    _inputex: {
                        _type: "group",
                        fields: [{
                            type: "string",
                            name: "type",
                            label: "Type"
                        }]
                    }
                },
                widgetAttr: {
                    value: "dialogueVariable",
                    type: "string"
                }
            }
        });
    Y.Wegas.EntityChooser = EntityChooser;
});