/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-proggame-level', function(Y) {
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
        CONTENT_TEMPLATE: '<div>'
                + '<div class="yui3-g top">'

                + '<div class="yui3-u topcenter">'
                + '<div class="ui"><h1></h1>'
                + '<div class="terrain-ui player-ui"></div>'
                + '<div class="terrain-ui enemy-ui"></div>'
                + '</div>'
                + '<div class="terrain"></div>'
                + '</div>'


                + '<div class="yui3-u topright">'
                + '<div class="buttons"></div>'
                + '<div class="ai"><h1>Enemy A.I.</h1></div>'
                + '<div class="debugger"><h1>Log</h1></div>'
                + '</div>'
                + '</div>'

                + '<div class="code"><h1>public void main(<span class="arguments"></span>) {</h1><div class="code-content"></div><h1>}</h1></div>'

                + '</div>',
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.objects = this.get("objects");
        },
        renderUI: function() {
            var i, cb = this.get(CONTENTBOX),
                    METHODTOTEXT = {
                say: "say(text: String)"
            }, api = this.get("api");

            this.aceField = new Y.inputEx.AceField({
                parentEl: cb.one(".code-content"),
                name: 'text',
                type: 'ace',
                height: "300px",
                language: "javascript",
                value: "//Put your code here..."
            });


            var enemy = this.findObject("Enemy");
            cb.one(".ai").append(Y.Wegas.Helper.nl2br((enemy && enemy.ai) || "<center><i>empty</i></center>"));
            cb.one(".topcenter h1").setHTML(this.get("label"));
            cb.one(".arguments").setHTML(this.get("arguments").join(", "));

            var acc = ["<h1>API</h1>"];
            for (i = 0; i < api.length; i += 1) {
                acc.push((METHODTOTEXT[api[i].name] || api[i].name + "()") + "<br />");
            }
            Y.all(".api").setHTML(acc.join(""));                                // All so it does not crash if widget is not present

            var params = this.toObject();                                       // @fixme here proggamedipslay parameters should be in a single attre
            delete params.plugins;
            this.display = new Y.Wegas.ProgGameDisplay(params);
            this.display.render(cb.one(".terrain"));

            this.runButton = new Y.Wegas.Button({
                label: "RUN SCRIPT"
            });
            this.runButton.render(cb.one(".buttons"));

            this.resetUI();
        },
        bindUI: function() {
            this.handlers.response = Y.Wegas.Facade.VariableDescriptor.after("update",
                    this.syncUI, this);                                             // If data changes, refresh

            this.runButton.on("click", this.run, this);

            this.display.after('commandExecuted', this.consumeCommand, this);
            this.after('commandExecuted', this.consumeCommand, this);

        },
        run: function() {

            if (this.runButton.get("label") === "STOP") {
                this.commandsStack = null;
                this.runButton.set("label", "RUN SCRIPT");
                return;
            }
            this.resetUI();
            this.runButton.set("label", "STOP");

            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: "JSON.stringify(run("
                            + "function (name) {" + this.aceField.getValue() + "\n}, "
                            + Y.JSON.stringify(this.toObject()) + "));"
                },
                on: {
                    success: Y.bind(this.onServerReply, this),
                    failure: Y.bind(function() {
                        this.runButton.set("label", "RUN SCRIPT");
                        alert("Your script contains an error.");
                    }, this)
                }
            });
        },
        syncUI: function() {
            this.display.syncUI();
            this.syncFrontUI();
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            this.aceField.destroy();
            this.display.destroy();
            this.runButton.destroy();
        },
        resetUI: function() {
            this.objects = Y.clone(this.get("objects"));
            this.commandsStack = null;

            //this.display.set("objects", this.objects);                          // Reset the display to default
            //this.display.syncUI();
            this.display.execute({
                type: 'resetLevel',
                objects: this.objects
            });

            this.get(CONTENTBOX).one(".debugger").setHTML("<h1>Debugger</h1>");
            //this.get("contentBox").one(".debugger").empty();

            this.syncFrontUI();
        },
        onServerReply: function(e) {
            this.commandsStack = Y.JSON.parse(e.response.entity);
            var i;
            for (i = 0; i < this.commandsStack.length; i += 1) {
                Y.log("command: " + this.commandsStack[i].type + ", " + this.commandsStack[i] + ", " + this.commandsStack[i].text);
            }

            this.consumeCommand();
        },
        findObject: function(id) {
            return Y.Array.find(this.objects, function(o) {
                return o.id === id;
            });
        },
        consumeCommand: function() {
            if (this.commandsStack && this.commandsStack.length > 0) {
                var command = this.commandsStack.shift();
                Y.log("consumeCommand" + ", " + command.type + ", " + command);

                switch (command.type) {

                    case "move":
                    case "fire":
                        Y.mix(this.findObject(command.object.id), // Update target object cfg
                                command.object, true);
                        this.syncFrontUI();
                        break;

                    case "updated":
                        Y.mix(this.findObject(command.object.id), // Update target object cfg
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
        doNextLevel: function() {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: this.get("onWin")
                }
            });
        },
        syncFrontUI: function() {
            var cb = this.get(CONTENTBOX);

            function updateUI(object, el) {
                var i, acc = [];
                if (!Y.Lang.isUndefined(object.life)) {
                    acc.push("Life<div class=\"life\"><span style=\"width:" + object.life + "%;\" ></span></div>");
                }
                if (!Y.Lang.isUndefined(object.actions)) {
                    acc.push("Actions<div class=\"actions\">");
                    for (i = 0; i < object.actions; i += 1) {
                        acc.push("<span></span>");
                    }
                    acc.push("</div>");
                }
                el.setHTML(acc.join(""));
                if (acc.length === 0) {
                    el.hide();
                } else {
                    el.show();
                }
            }
            if (this.findObject("Player")) {
                updateUI.call(this, this.findObject("Player"), cb.one(".player-ui"));
            }
            if (this.findObject("Enemy")) {
                updateUI.call(this, this.findObject("Enemy"), cb.one(".enemy-ui"));
            }
        }

    }, {
        ATTRS: {
            label: {
                type: "string"
            },
            objects: {
                type: "array",
                _inputex: {
                    useButtons: true,
                    elementType: {
                        type: "group",
                        fields: [{
                                name: "id",
                                label: "Template",
                                type: "select",
                                choices: ["Player", "Enemy", "Bloc1", "Bloc2", "Bloc3"]
                            }, {
                                name: "x",
                                type: "number",
                                label: "x"
                            }, {
                                name: "y",
                                type: "number",
                                label: "y"
                            }, {
                                name: "direction",
                                label: "direction",
                                type: "select",
                                choices: [{value: 1, label: "up"},
                                    {value: 2, label: "right"},
                                    {value: 3, label: "bottom"},
                                    {value: 4, label: "left"}]
                            }, {
                                name: "collides",
                                label: "collides",
                                type: "boolean"
                            }
//                            ,{
//                                name: "type",
//                                label: "type"
//                            }, {
//                                name: "actions",
//                                label: "Actions available",
//                                type: "number"
//                            }
                        ]
                    }
                }

            },
            arguments: {
                type: "array",
                value: [],
                _inputex: {
                    useButtons: true
                }
            },
            api: {
                type: "array",
                value: [],
                _inputex: {
                    useButtons: true,
                    sortable: true,
                    elementType: {
                        type: "group",
                        fields: [{
                                name: "name"
                            }]
                    }
                }

            },
            maxTurns: {
                type: "string",
                format: "Integer",
                validator: function(s) {
                    return (parseInt(s) ? parseInt(s) : 1);
                },
                _inputex: {
                    label: "Max turns"
                }
            },
            winningCondition: {
                type: "string",
                format: "text",
                _inputex: {
                    _type: "ace"
                }
            },
            onStart: {
                type: "string",
                format: "text",
                optional: true,
                _inputex: {
                    _type: "ace"
                }
            },
            onTurn: {
                type: "string",
                format: "text",
                optional: true,
                _inputex: {
                    _type: "ace"
                }
            },
            onWin: {
                type: "string",
                optional: true,
                _inputex: {
                    _type: "ace"
                }
            },
            map: {
                type: "array",
                value: [[{x: 0, y: 0}]],
                validator: Y.Lang.isArray,
                _inputex: {
                    _type: "proggamemap",
                    useButtons: true
                }
            },
            mapObjects: {
                validator: Y.Lang.isArray,
                type: "array",
                "transient": true,
                _inputex: {
                    type: "hidden",
                    useButtons: true,
                    elementType: {
                        type: "object"
                    }
                }
            }
        }
    });

    Y.namespace('Wegas').ProgGameLevel = ProgGameLevel;
});
