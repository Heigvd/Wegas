YUI.add("wegas-simpledialogue-main", function(Y) {
    
    "use strict";
    var CONTENTBOX = "contentBox", SimpleDialogueMain;
    
    SimpleDialogueMain = Y.Base.create("wegas-teaching-main", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        currentDialogue: null,
        handlers: null,
        initializer: function() {
            this.handlers = {};
            this.currentDialogue = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "simpleDialogue");
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.append('<div class="dialogue"><div class="talk"></div><div class="response"></div></div>');
        },
        bindUI: function() {
            var no, cb = this.get(CONTENTBOX);
            this.handlers.update = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);
            this.handlers.dialogueResponse = cb.one('.dialogue .response').delegate('click', function(e) {
                no = parseInt(e.currentTarget.getDOMNode().attributes[0].nodeValue);
                if (this.availableActions[no]) {
                    this.currentDialogue.doTransition(this.availableActions[no]);
                }
            }, '.responseElements li', this);
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX);
            this.readStateMachine(cb);
        },
        destructor: function() {
            var i;
            for (i in this.handlers) {
                this.handlers[i].detach();
            }
        },
        readStateMachine: function(cb) {
            if (!this.currentDialogue) {
                cb.one('.dialogue .talk').insert("Aucun dialogue n'est disponible.");
                return;
            }
            this.state = this.currentDialogue.getCurrentState();
            if (!this.state.getAvailableActions) {
                Y.log("State isn't a dialogue state.", 'error', 'wegas-simpledialogue-main.js');
                return;
            }
            this.state.getAvailableActions(Y.bind(this.readStateContent, this));
        },
        readStateContent: function(availableActions) {
            var cb = this.get(CONTENTBOX);
            this.availableActions = availableActions;
            cb.one('.dialogue .talk').setHTML('<p></p>');
            this.displayText(cb, this.state.get('text'));
        },
        displayText: function(cb, textParts) {
            cb.one('.dialogue .talk p').insert(textParts);
            this.displayResponse(cb);
        },
        displayResponse: function(cb) {
            var i;
            if (!this.availableActions) {
                return;
            }
            if (cb.one('.dialogue .response .responseElements')) {
                cb.one('.dialogue .response .responseElements').empty(true);
            } else {
                cb.one('.dialogue .response').insert('<ul class="responseElements"></ul>');
            }

            for (i = 0; i < this.availableActions.length; i++) {
                cb.one('.dialogue .response .responseElements').insert('<li response_no="' + i + '">' + this.availableActions[i].get('actionText') + '</li>');
            }
            cb.one('.response').show();
        }
    });
    Y.namespace("Wegas").SimpleDialogueMain = SimpleDialogueMain;
});