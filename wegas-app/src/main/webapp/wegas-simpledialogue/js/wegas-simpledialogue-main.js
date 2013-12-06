/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Anthony Geiser <antho.geiser@gmail.com>
 */
YUI.add("wegas-simpledialogue", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", SimpleDialogueMain;

    SimpleDialogueMain = Y.Base.create("wegas-teaching-main", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: '<div><div class="dialogue"><div class="talk"></div><div class="response"><ul class="responseElements"></ul></div></div></div>',
        initializer: function() {
            this.handlers = {};
        },
        bindUI: function() {
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            this.get(CONTENTBOX).delegate('click', function(e) {
                var no = parseInt(e.currentTarget.getAttribute("response_no"));
                if (this.availableActions[no]) {
                    this.currentDialogue.doTransition(this.availableActions[no]);
                }
            }, '.dialogue .response .responseElements li', this);
        },
        syncUI: function() {
            this.currentDialogue = this.get("dialogueVariable.evaluated");

            if (!this.currentDialogue) {
                this.get(CONTENTBOX).one('.dialogue .talk').insert("Dialog variable could not be found");
                return;
            }
            var state = this.currentDialogue.getCurrentState();
            this.displayText(state.get('text'));
            if (!state instanceof Y.Wegas.persistence.DialogueDescriptor) {
                Y.log("State isn't a dialogue state.", 'error', 'SimpleDialogue');
                return;
            }
            state.getAvailableActions(Y.bind(this.readStateContent, this));
        },
        destructor: function() {
            var i;
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        readStateContent: function(availableActions) {
            this.availableActions = availableActions;
            this.displayResponse(availableActions);
        },
        displayText: function(textParts) {
            this.get(CONTENTBOX).one('.dialogue .talk').setHTML("<p>" + textParts + "</p>");
        },
        displayResponse: function(availableActions) {
            var i, responseNode = this.get(CONTENTBOX).one('.dialogue .response .responseElements');

            if (!availableActions) {
                return;
            }
            responseNode.empty(true);
            for (i = 0; i < availableActions.length; i++) {
                responseNode.insert('<li response_no="' + i + '">' + availableActions[i].get('actionText') + '</li>');
            }
        }
    }, {
        ATTRS: {
            dialogueVariable: {
                value: {
                    name: "simpleDialogue"
                },
                getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect",
                    legend: "Dialogue",
                    classFilter: ["DialogueDescriptor"]
                }
            }
        }
    });
    Y.namespace("Wegas").SimpleDialogueMain = SimpleDialogueMain;
});