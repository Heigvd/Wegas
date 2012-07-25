/**
 *
 * @module editbutton
 * @main editbutton
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-editor-buttons', function (Y) {
    "use strict";

    /**
     * @class SelectPlayer
     * @constructor
     * @extends Widget
     * @param {Object} cfg The button config object
     */
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
            var j, k, cTeam, cPlayer,
            cGame = Y.Wegas.app.dataSources.Game.rest.getCurrentGame();

            while(this.selectField.choicesList.length > 0) {                    // Empty the current list of choices
                this.selectField.removeChoice({
                    position:0
                });
            }

            for (j = 0; j < cGame.get("teams").length; j = j + 1) {
                cTeam = cGame.get("teams")[j];
                for (k = 0; k < cTeam.get("players").length; k = k + 1) {
                    cPlayer = cTeam.get("players")[k];
                    this.selectField.addChoice({
                        value: cPlayer.get("id"),
                        label: cPlayer.get("name")
                    });
                }
            }
            this.selectField.setValue(Y.Wegas.app.get("currentPlayer"), false);
        }
    }, {
        CSS_PREFIX: "wegas-selectbutton"
    });
});