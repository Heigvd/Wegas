/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-scriptlibrary', function (Y) {
    var CONTENTBOX = 'contentBox',
    CSSEditor;

    /* @fixme hack so we can programatically add an element to a yui button */
    Y.Button.prototype._uiSetLabel = function(value) {
        var node = this._host,
        attr = (node.get('tagName').toLowerCase() === 'input') ? 'value' : 'text';

        //        node.set(attr, value);
        node.setContent(value);
        return value;
    };

    ScriptLibrary = Y.Base.create("wegas-scriptlibrary", Y.Widget, [Y.WidgetChild,  Y.Wegas.Widget], {

        currentScript: null,

        destroyer: function () {
        },

        renderUI: function () {
            var cb = this.get(CONTENTBOX);

            this.aceField = new Y.inputEx.AceField({
                parentEl: cb,
                name: 'text',
                type: 'ace',
                height: "100%",
                language: "javascript",
                value: ""
            });

            this.renderToolbar();
        },
        bindUI: function () {
            Y.Wegas.app.dataSources.GameModel.after("response", this.syncUI, this);

            this.selectField.on("updated", function (val) {
                this.currentScript = val;
                this.syncEditor();
            }, this);
        },
        syncUI: function () {
            var cGameModel = Y.Wegas.app.dataSources.GameModel.rest.getCachedVariableById(Y.Wegas.app.get('currentGameModel')),
            isEmpty = true;

            if (!cGameModel) return;

            while(this.selectField.choicesList.length > 0) {
                this.selectField.removeChoice({
                    position:0
                });
            }
            for (var i in cGameModel.scriptLibrary) {
                if (!this.currentScript) this.currentScript = i;
                this.selectField.addChoice({
                    value: i
                });
                isEmpty = false;
            }
            if (isEmpty) {
                this.selectField.addChoice({
                    value: "No scripts"
                });
            } else {
                this.selectField.setValue(this.currentScript, false);
            }

            this.saveButton.set("disabled", isEmpty);
            this.deleteButton.set("disabled", isEmpty);
        },

        // *** Private Methods *** //

        renderToolbar: function () {
            var toolbarNode = this.get("parent").get('toolbarNode');

            this.newButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>New",
                on: {
                    click: Y.bind(function () {
                        this.currentScript = prompt("Script name:");
                        Y.Wegas.app.dataSources.GameModel.rest.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel") + "/ScriptLibrary/" + this.currentScript,
                            cfg: {
                                method: "POST",
                                data: ""
                            }
                        });
                    }, this)
                }
            }).render(toolbarNode);

            this.selectField = new Y.inputEx.SelectField({
                choices: [{
                    value: "loading..."
                }],
                parentEl: toolbarNode
            });

            this.saveButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-save\" ></span>Save",
                on: {
                    click: Y.bind(function () {
                        Y.Wegas.app.dataSources.GameModel.rest.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel") + "/ScriptLibrary/" + this.selectField.getValue(),
                            cfg: {
                                method: "POST",
                                data: this.aceField.getValue()
                            }
                        });
                    }, this)
                }
            }).render(toolbarNode);

            this.deleteButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-delete\"></span>Delete",
                on: {
                    click: Y.bind(function () {
                        Y.Wegas.app.dataSources.GameModel.rest.sendRequest({
                            request: "/" + Y.Wegas.app.get("currentGameModel") + "/ScriptLibrary/" + this.currentScript,
                            cfg: {
                                method: "DELETE"
                            }
                        });
                        this.currentScript = null;
                    }, this)
                }
            }).render(toolbarNode);
        },

        syncEditor: function () {
            var cGameModel = Y.Wegas.app.dataSources.GameModel.rest.getCachedVariableById(Y.Wegas.app.get('currentGameModel')),
            val = cGameModel.scriptLibrary[this.selectField.getValue()] || "";
            this.aceField.setValue(val);
        }
    });

    Y.namespace('Wegas').ScriptLibrary = ScriptLibrary;
});