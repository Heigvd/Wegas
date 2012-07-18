/**
 *
 * @module editbutton
 * @main editbutton
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor-buttons', function (Y) {
    "use strict";
    /**
     * @class NewButton
     * @constructor
     * @extends Widget
     * @param {Object} cfg The button config object
     */
    var NewButton = Y.Base.create("new-button", Y.Button, [], {
        bindUI: function () {
            Y.Wegas.NewButton.superclass.bindUI.apply(this, arguments);
            this.on("click", function(){
                Y.Wegas.editor.showAddForm({
                    "@class": this.get("targetClass")
                }, null, Y.Wegas.app.dataSources[this.get("targetClass")]);
            });
        }
    }, {
        CSS_PREFIX:"yui3-button",
        ATTRS : {
            targetClass: {}
        }
    });
    Y.Wegas.NewButton = NewButton;

    Y.Wegas.ResetButton = Y.Base.create("reset-button", Y.Button, [], {
        bindUI: function () {
            Y.Wegas.NewButton.superclass.bindUI.apply(this, arguments);
            this.on("click", function(){
                Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({
                    request: '/reset'
                });
            });
        }
    }, {
        CSS_PREFIX:"yui3-button"
    });

    Y.Wegas.SelectPlayer = Y.Base.create("wegas-selectbutton", Y.Widget, [], {
        renderUI: function () {
            this.selectField = new Y.inputEx.SelectField({
                label: "Current player:",
                choices: [{
                    value: "loading..."
                }],
                parentEl: this.get("contentBox")
            });
        },
        bindUI: function () {
            this.selectField.on("updated", function (val) {
                if (val !== "") {
                    Y.Wegas.app.set('currentPlayer', val);
                }
            }, this);
            Y.Wegas.app.dataSources.Game.after("response", this.syncUI, this);
            Y.Wegas.app.on("currentPlayerChange", function (e) {
                this.selectField.setValue(e.newVal, false);
            }, this);
        },
        syncUI: function() {
            var isEmpty = true, j, k,
            cGame = Y.Wegas.app.dataSources.Game.rest.getCurrentGame();

            if (!cGame) {                                                       // The game has not been loaded yet
                return;
            }

            while(this.selectField.choicesList.length > 0) {
                this.selectField.removeChoice({
                    position:0
                });
            }
            for (j = 0; cGame.teams && j < cGame.teams.length; j = j + 1) {
                for (k = 0; k < cGame.teams[j].players.length; k = k + 1) {
                    this.selectField.addChoice({
                        value: cGame.teams[j].players[k].id,
                        label: cGame.teams[j].players[k].name
                    });
                    isEmpty = false;
                }
            }
            this.selectField.setValue(Y.Wegas.app.get("currentPlayer"), false);
        }
    }, {
        CSS_PREFIX: "wegas-selectbutton"
    });
});