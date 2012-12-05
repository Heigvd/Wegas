/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-proggame-level', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
            GRIDSIZE = 31,
            ProgGameLevel;

    /**
     *  The level display class, with script input, ia, debugger and
     *  terrain display.
     *
     */
    ProgGameLevel = Y.Base.create("wegas-proggame-level", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        // *** Fields *** //
        handlers: null,
        aceField: null,
        display: null,
        runButton: null,
        commandsStack: null,
        CONTENT_TEMPLATE: '<div class="yui3-g">'

                + '<div class="yui3-u left">'
                + '<div class="inventory"><h1>Inventory</h1><i><center style="padding-top:40px;">empty</center></i></div>'
                + '<div class="api"><h1>Api</h1></div>'
                + '</div>'

                + '<div class="yui3-u right">'
                + '<div class="yui3-g topright">'
                + '<div class="yui3-u topcenter"><h1></h1><div class="terrain"></div></div>'
                + '<div class="yui3-u toptopright">'
                + '<div class="buttons"></div>'
                + '<div class="ai"><h1>Enemy A.I.</h1></div>'
                + '<div class="debugger"><h1>Log</h1></div>'
                + '</div>'
                + '</div>'

                + '<div class="code"><h1>Your code</h1></div>'
                + '</div>'
                + '<div style="clear:both"></div>',
        // *** Lifecycle Methods *** //
        initializer: function () {
            var cb = this.get(CONTENTBOX);
            this.handlers = {};
            this.aceField = new Y.inputEx.AceField({
                parentEl: cb.one(".code"),
                name: 'text',
                type: 'ace',
                height: "300px",
                language: "javascript",
                value: "//Put your code here.\nmove();\nfire();"
            });
            this.display = new Y.Wegas.ProgGameDisplay(this.toObject());
            this.runButton = new Y.Wegas.Button({
                label: "RUN SCRIPT"
            });
        },
        renderUI: function () {
            var i, api = [], cb = this.get(CONTENTBOX);

            cb.one(".ai").append(Y.Wegas.App.nl2br(this.get("ai")));
            cb.one(".topcenter h1").setHTML(this.get("label"));

            for (i = 0; i < this.get("api").length; i++) {
                api.push(this.get("api")[i].name);
            }
            cb.one(".api").append(api.join(', ') + "*");

            this.display.render(cb.one(".terrain"));
            this.runButton.render(cb.one(".buttons"));

        },
        bindUI: function () {
            this.handlers.response = Y.Wegas.app.VariableDescriptorFacade.after("response", // If data changes, refresh
                    this.syncUI, this);

            this.handlers.playerChange = Y.Wegas.app.after('currentPlayerChange', this.syncUI, this);       // If current user changes, refresh (editor only)

            this.handlers.runButton = this.runButton.on("click", function () {

                this.display.set("objects", this.get("objects"));            // Reset the display to default
                this.display.syncUI();
                this.get(CONTENTBOX).one(".debugger").setHTML("<h1>Debugger</h1>");
                this.runButton.set("label", "RUNNING...");
                this.runButton.set("disabled", true);

                Y.Wegas.app.VariableDescriptorFacade.rest.sendRequest({
                    request: "/ProgGame/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: "var i, j, ret = [], objects = " + Y.JSON.stringify(this.get("objects"))
                                + ",cObject,"
                                + "winingCondition=function(){return " + this.get("winningCondition") + ";};"
                                + "for (i = 0; i < " + this.get("maxTurns") + "; i += 1) {"
                                + "for (j = 0; j < objects.length; j += 1) {"
                                + "if(objects[j].type === 'pc'){"
                                + "cObject = objects[j].id;"
                                + "sendCommand({type:'log', 'text': 'Player turn.'});"
                                + this.aceField.getValue()
                                + "} else if (objects[j].type === 'npc'){"
                                + "cObject = objects[j].id;"
                                + "sendCommand({type:'log', 'text': 'Enemy turn.'});"
                                + this.get("ai")
                                + "}}}"
                                + "sendCommand({type:'log', 'text': 'Max turn reached, match is a draw.'});"
                                + "sendCommand({type:'resetLevel', objects: " + Y.JSON.stringify(this.get("objects")) + "});"
                                + "JSON.stringify(ret)"
                    },
                    on: {
                        success: Y.bind(this.onServerReply, this),
                        failure: Y.bind(function () {
                            this.runButton.set("label", "RUN SCRIPT");
                            this.runButton.set("disabled", false);
                            alert("Your script contains an error.");
                        }, this)
                    }

                });
            }, this);

            this.handlers.commandExecuted = this.display.after('commandExecuted', function () {
                this.consumeServerCommand();
            }, this);
            this.handlers.commandExecuted = this.after('commandExecuted', function () {
                this.consumeServerCommand();
            });

        },
        syncUI: function () {
            this.display.syncUI();
        },
        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.aceField.destroy();
            this.display.destroy();
            this.runButton.destroy();
        },
        onServerReply: function (e) {
            this.commandsStack = Y.JSON.parse(e.response.entity);
            this.consumeServerCommand();
        },
        doNextLevel: function () {
            Y.Wegas.app.VariableDescriptorFacade.rest.sendRequest({
                request: "/ProgGame/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: this.get("onWin")
                }
            });
        },
        consumeServerCommand: function () {
            if (this.commandsStack && this.commandsStack.length > 0) {
                var command = this.commandsStack.shift();
                this.display.execute(command);
                switch (command.type) {
                    case "gameWon":
                        this.runButton.set("label", "NEXT LEVEL");
                        this.runButton.set("disabled", false);
                        this.runButton.detachAll("click");
                        this.runButton.on("click", this.doNextLevel, this);
                        break;
                    case "log":
                        this.get("contentBox").one(".debugger").append(command.text + "<br />");
                        this.fire("commandExecuted");
                    default:
                        break;
                }

            } else {
                this.runButton.set("label", "RUN SCRIPT");
                this.runButton.set("disabled", false);
            }
        }

    }, {
        ATTRS: {
            label: {
                type: "string"
            },
            objects: {
                _inputex: {
                    _type: "object"
                }
            },
            api: {
                value: []
            },
            ai: {
                type: "string",
                format: "text"
//                _inputex: {
//                    _type: "ace"
//                }
            },
            winningCondition: {
                type: "string",
                format: "text"
//                _inputex: {
//                    _type: "ace"
//                }
            },
            onWin: {
                type: "string",
                _inputex: {
                    _type: "ace"
                }
            },
            maxTurns: {
                type: "string",
                format: "Integer",
                validator: function (s) {
                    return (parseInt(s) ? parseInt(s) : 1);
                }
            },
            gridW: {
                type: "number",
                format: "Integer",
                validator: function (s) {
                    return (parseInt(s) ? parseInt(s) : 9);
                }
            },
            gridH: {
                type: "string",
                format: "Integer",
                validator: function (s) {
                    return (parseInt(s) ? parseInt(s) : 9);
                }
            }
        }
    });
    Y.namespace('Wegas').ProgGameLevel = ProgGameLevel;
});