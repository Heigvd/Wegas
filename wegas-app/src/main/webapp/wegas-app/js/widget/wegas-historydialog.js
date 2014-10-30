/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-historydialog", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", HistoryDialog, EntityChooser,
        persistence = Y.Wegas.persistence;

    HistoryDialog = Y.Base.create("wegas-historydialog", Y.Wegas.SimpleDialogue, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: '<div><div class="history"></div><div class="dialogue"><div class="talk"></div><div class="response"><ul class="responseElements"></ul></div></div></div>',
        //TODO: query states only once
        syncUI: function() {
            this.getHistory();
        },
        getHistory: function() {
            var dial = this.get("dialogueVariable.evaluated");
            Y.Wegas.Facade.Variable.cache.getWithView(dial, "Extended", {
                on: {
                    success: Y.bind(function(e) {
                        this.displayHistory(e.response.entity.getFullHistory(dial.getInstance().get("transitionHistory")));
                    }, this)
                }
            });
        },
        displayHistory: function(history) {
            var historyNode = this.get(CONTENTBOX).one(".history"), i;
            history.pop(); //remove last element (currentState)
            historyNode.empty(true);
            for (i in history) {
                if (history[i] instanceof persistence.DialogueTransition) {
                    historyNode.append("<div class='response h" + history[i].get('id') + "'>" + history[i].get("actionText") + "</ul>");
                } else if (history[i] instanceof persistence.DialogueState) {
                    historyNode.append("<div class='talk h" + history[i].get('id') + "'>" + history[i].get("text") + "</div>");
                }
            }
            HistoryDialog.superclass.syncUI.call(this);
        }

    }, {});
    Y.Wegas.HistoryDialog = HistoryDialog;

    EntityChooser = Y.Base.create("wegas-entitychooser", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><ul class='chooser-entities'></ul><div class='chooser-widget'></div></div>",
        renderUI: function() {
            var items = this.get("variable.evaluated") ? this.get("variable.evaluated").flatten() : [],
                i, entityBox = this.get(CONTENTBOX).one(".chooser-entities");
            for (i in items) {
                entityBox.append("<li class='chooser-entity' data-name='" + items[i].get("name") + "'>" + items[i].get("label") + "</li>");
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

    }, {
        ATTRS: {
            widget: {
                value: {type: "HistoryDialog"}
            },
            widgetAttr: {
                value: "dialogueVariable"
            },
            variable: {
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    legend: "Folder",
                    classFilter: ["ListDescriptor"]
                }
            }
        }
    });
    Y.Wegas.EntityChooser = EntityChooser;
});
