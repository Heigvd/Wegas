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

    var CONTENTBOX = 'contentBox', ProgGameLevel;

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
        + '<div class="yui3-u topcenter"><h1></h1>'
        + '<div class="terrain-ui player-ui">Life<div class="life"><span /></div>Actions<div class="actions"></div></div>'
        + '<div class="terrain-ui enemy-ui">Life<div class="life"><span></span><div class="cl"></div></div>Actions<div class="actions"></div></div>'
        + '<div class="terrain"></div></div>'
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
            this.handlers = {};
        },
        renderUI: function () {
            var i, cb = this.get(CONTENTBOX);

            this.aceField = new Y.inputEx.AceField({
                parentEl: cb.one(".code"),
                name: 'text',
                type: 'ace',
                height: "300px",
                language: "javascript",
                value: "//Put your code here..."
            });

            cb.one(".ai").append(Y.Wegas.App.nl2br(this.get("ai") || "<center><i>empty</i></center>"));
            cb.one(".topcenter h1").setHTML(this.get("label"));

            for (i = 0; i < this.get("api").length; i += 1) {
                cb.one(".api").append(this.get("api")[i].name + "() <br />");
            }

            this.display = new Y.Wegas.ProgGameDisplay(this.toObject());
            this.display.render(cb.one(".terrain"));

            this.runButton = new Y.Wegas.Button({
                label: "RUN SCRIPT"
            });
            this.runButton.render(cb.one(".buttons"));

            this.resetUI();
        },
        bindUI: function () {
            this.handlers.response = Y.Wegas.app.VariableDescriptorFacade.after("response",
                this.syncUI, this);                                             // If data changes, refresh
            this.handlers.playerChange = Y.Wegas.app.after('currentPlayerChange',
                this.syncUI, this);                                             // If current user changes, refresh (editor only)

            this.runButton.on("click", this.run, this);

            this.display.after('commandExecuted', this.consumeCommand, this);
            this.after('commandExecuted', this.consumeCommand, this);

        },
        run: function () {

            if (this.runButton.get("label") === "STOP") {
                this.commandsStack = null;
                this.runButton.set("label", "RUN SCRIPT");
                return;
            }
            this.resetUI();
            this.runButton.set("label", "STOP");

            Y.Wegas.app.VariableDescriptorFacade.rest.sendRequest({
                request: "/ProgGame/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: "JSON.stringify(run(function () {" + this.aceField.getValue() + "}, "
                    + Y.JSON.stringify(this.toObject()) + "));"
                },
                on: {
                    success: Y.bind(this.onServerReply, this),
                    failure: Y.bind(function () {
                        this.runButton.set("label", "RUN SCRIPT");
                        alert("Your script contains an error.");
                    }, this)
                }
            });
        },
        syncUI: function () {
            this.display.syncUI();
            this.syncFrontUI();
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

        resetUI: function () {
            this.objects = Y.clone(this.get("objects"));
            this.commandsStack = null;

            //this.display.set("objects", this.objects);                          // Reset the display to default
            //this.display.syncUI();
            this.display.execute({
                type:'resetLevel',
                objects: this.objects
            });

            this.get(CONTENTBOX).one(".debugger").setHTML("<h1>Debugger</h1>");
            //this.get("contentBox").one(".debugger").empty();

            this.syncFrontUI();
        },

        onServerReply: function (e) {
            this.commandsStack = Y.JSON.parse(e.response.entity);
            var i;
            for (i = 0; i < this.commandsStack.length; i += 1) {
                console.log("command: ", this.commandsStack[i].type, this.commandsStack[i], this.commandsStack[i].text);
            }

            this.consumeCommand();
        },

        findObjectById: function (id) {
            return Y.Array.find(this.objects, function (o) {
                return o.id === id;
            });
        },

        consumeCommand: function () {
            if (this.commandsStack && this.commandsStack.length > 0) {
                var command = this.commandsStack.shift();
                console.log("consumeCommand", command.type, command);

                switch (command.type) {

                    case "move":
                    case "fire":
                        Y.mix(this.findObjectById(command.object.id),           // Update target object cfg
                            command.object, true);
                        this.syncFrontUI();
                        break;

                    case "updated":
                        Y.mix(this.findObjectById(command.object.id),           // Update target object cfg
                            command.object, true);
                        this.syncFrontUI();
                        this.consumeCommand();
                        break;

                    case "gameWon":
                        this.runButton.set("label", "NEXT LEVEL");
                        this.runButton.detachAll("click");
                        this.runButton.on("click", this.doNextLevel, this);
                        break;
                    case "log":
                        this.get("contentBox").one(".debugger").append(command.text + "<br />");

                        Y.later(500, this, this.consumeCommand);
                        //this.fire("commandExecuted");
                        break;
                    default:
                        break;
                }

                this.display.execute(command);                                  // Forware the command to the display

            } else if (this.commandsStack) {
                this.runButton.set("label", "RUN SCRIPT");
            }
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

        syncFrontUI: function () {
            var cb = this.get(CONTENTBOX);

            function updateUI(object, el) {
                var i, acc = [];
                for (i = 0; i < object.actions; i += 1) {
                    acc.push("<span></span>");
                }

                el.one(".life span").setStyle("width", object.life + "%");
                el.one(".actions").setHTML(acc.join(""));
            }
            updateUI.call(this, this.objects[0], cb.one(".player-ui"));
            updateUI.call(this, this.objects[1], cb.one(".enemy-ui"));
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
            maxTurns: {
                type: "string",
                format: "Integer",
                validator: function (s) {
                    return (parseInt(s) ? parseInt(s) : 1);
                },
                _inputex: {
                    label: "Max turns"
                }
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
