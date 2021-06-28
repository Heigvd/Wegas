/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

/**
 *
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-historydialog", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", HistoryDialog,
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
            HistoryDialog.superclass.syncUI.call(this);
            history.pop(); //remove last element (currentState)
            historyNode.empty(true);
            for (i in history) {
                if (history[i] instanceof persistence.DialogueTransition) {
                    historyNode.append("<div class='response h" + history[i].get('id') + "'>" + (history[i].get("actionText") === null ? "" : I18n.t(history[i].get("actionText"))) + "</ul>");
                } else if (history[i] instanceof persistence.DialogueState) {
                    historyNode.append("<div class='talk h" + history[i].get('id') + "'>" + (history[i].get("text") === null ? "" : I18n.t(history[i].get("text"))) + "</div>");
                }
            }
        }

    }, {});
    Y.Wegas.HistoryDialog = HistoryDialog;
});
