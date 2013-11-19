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
        RUN_BUTTON_LABEL: "<div class='proggame-play'><span>RUN</span><span> CODE</span></div>",
        STOP_BUTTON_LABEL: "<span class='proggame-stop'>STOP</span>",
        NEXT_BUTTON_LABEL: "<span class='proggame-next'>NEXT</span>",
        DEBUG_BUTTON_LABEL: "<span class='proggame-playpause'></span>",
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
                //+ '<div class="ai"><h1>Enemy A.I.</h1></div>'
                + '<div class="debugger"><h1>Log</h1></div>'
                + '</div>'
                + '</div>'

                + '<div class="code"><h1>Main</h1><div class="code-content"></div></div>'

                + '</div>',
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.currentState = "idle";
            this.objects = this.get("objects");

            this.currentBreakpointLine = -1;
            this.currentBreakpointStep = -1;
        },
        renderUI: function() {
            var i, cb = this.get(CONTENTBOX),
                    METHODTOTEXT = {
                say: "say(text: String)"
            }, api = this.get("api");
            this.aceField = new Y.inputEx.AceField({//                          // Render ace editor
                parentEl: cb.one(".code-content"),
                name: 'text',
                type: 'ace',
                height: "170px",
                language: "javascript",
                theme: "twilight",
//                value: "//Put your code here...\nfunction move () {\n    var y,\n    x;\n\n}\nvar test;\ntest.x = 0;"
                //value: "move();\nmove();"
                value: "for (var i=0; i<10; i++) {\n    move();\n}"
            });
            this.aceField.editor.on("guttermousedown", function(e) {     // Add breakpoints on click support
                var target = e.domEvent.target;
                if (target.className.indexOf("ace_gutter-cell") === -1)
                    return;
//                if (!this.aceField.editor.isFocused())
//                    return;
//                if (e.clientX > 25 + target.getBoundingClientRect().left)
//                    return;
                var row = e.getDocumentPosition().row,
                        session = e.editor.getSession();
                if (!session.getBreakpoints()[row]) {
                    session.setBreakpoint(row);
                } else {
                    session.clearBreakpoint(row);
                }
                e.stop();
                // Break points that move on line add: https://github.com/MikeRatcliffe/Acebug/blob/master/chrome/content/ace++/startup.js#L66-104
            });

            cb.one(".topcenter h1").setHTML(this.get("label"));                 // Display label
            //var enemy = this.findObject("Enemy");                             // Display enemy IA
            //cb.one(".ai").append(Y.Wegas.Helper.nl2br((enemy && enemy.ai) || "<center><i>empty</i></center>"));
            //cb.one(".arguments").setHTML(this.get("arguments").join(", "));   // Display function arguements

            var acc = ["<h1>API</h1>"];
            for (i = 0; i < api.length; i += 1) {
                acc.push((METHODTOTEXT[api[i].name] || api[i].name + "()") + "<br />");
            }
            Y.all(".api").setHTML(acc.join("")); // All so it does not crash if widget is not present

            var params = this.toObject(); // @fixme here proggamedipslay parameters should be in a single attre
            delete params.plugins;
            this.display = new Y.Wegas.ProgGameDisplay(params);
            this.display.render(cb.one(".terrain"));
            this.runButton = new Y.Wegas.Button({
                label: this.RUN_BUTTON_LABEL
            });
            this.runButton.render(cb.one(".buttons"));
//            this.stopButton = new Y.Wegas.Button({
//                label: "s",
//                render: cb.one(".buttons")
//            });
            this.resetUI();
            this.setState("idle");
        },
        bindUI: function() {
            this.handlers.response = Y.Wegas.Facade.VariableDescriptor.after("update",
                    this.syncUI, this); // If data changes, refresh

            this.runButton.on("click", function() {
                if (this.currentState === "running") {
                    this.setState("idle");
                } else {
                    this.setState("running");
                }
            }, this);
            this.display.after('commandExecuted', this.consumeCommand, this);
            this.after('commandExecuted', this.consumeCommand, this);

            Y.later(100, this, function() {
//                this.runButton.fire("click");
            });
            Y.later(10000, this, this.doIdleAnimation, [], true);               // While in idle mode, launch idle animation every 10 secs
            Y.later(100, this, this.doIdleAnimation);
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
            if (this.panel) {
                this.panel.destroy();
            }
        },
        setState: function(nextState) {
            Y.log("setState(" + nextState + ")", "info", "Wegas.ProgGameLevel");
            switch (nextState) {
                case "breaking":
                    this.runButton.set("label", this.DEBUG_BUTTON_LABEL);
                    break;

                case "idle" :
                    this.runButton.set("label", this.RUN_BUTTON_LABEL);
                    this.commandsStack = null;
                    this.aceField.session.removeGutterDecoration(this.currentBreakpointLine, "proggame-currentline");
                    this.currentBreakpointLine = -1;
                    this.currentBreakpointStep = -1;
                    break;

                case "running":
                    this.runButton.set("label", this.STOP_BUTTON_LABEL);
                    //this.run();
                    if (this.currentState === "idle") {
                        this.resetUI();
                    }
                    this.debug();
                    break;

            }
            this.currentState = nextState;
        },
        run: function() {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: "run("
                            + "function (name) {with(this) {" + this.aceField.getValue() + "\n}}, "
                            + Y.JSON.stringify(this.toObject()) + ");"
                },
                on: {
                    success: Y.bind(this.onServerReply, this),
                    failure: Y.bind(function() {
                        this.setState("idle");
                        alert("Your script contains an error.");
                    }, this)
                }
            });
        },
        debug: function() {
            Y.log("debug()", "info", "Wegas.ProgGameLevel");
            this.aceField.session.removeGutterDecoration(this.currentBreakpointLine, "proggame-currentline");

            var ins = new Y.Wegas.JSInstrument(),
                    code = ins.instrument(this.aceField.getValue()),
                    breakpoints = Y.Object.keys(this.aceField.editor.getSession().getBreakpoints());

            Y.log("instrumented code: " + code + ", current step: " + this.currentBreakpointStep + ", breakpoints: " + Y.JSON.stringify(breakpoints), "info", "Wegas.ProgGameLevel");

            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: "debug("
                            + "function (name) {with(this) {" + code + "\n}}, "
                            + Y.JSON.stringify(this.toObject()) + ", "
                            //+"[0, 1], "
                            + Y.JSON.stringify(breakpoints) + ", " +
                            this.currentBreakpointStep + "); "
                },
                on: {
                    success: Y.bind(this.onServerReply, this),
                    failure: Y.bind(function() {
                        this.setState("idle");
                        alert("Your script contains an error.");
                    }, this)
                }
            });
        },
        resetUI: function() {
            Y.log("resetUI()", "info", "Wegas.ProgGameDisplay");
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
            Y.log("onServerReply(" + e.response.entity + ")", "info", "Wegas.ProgGameLevel");
            this.commandsStack = Y.JSON.parse(e.response.entity);
            var i;
            for (i = 0; i < this.commandsStack.length; i += 1) {
                //  Y.log("command: " + this.commandsStack[i].type + ", " + this.commandsStack[i] + ", " + this.commandsStack[i].text);
            }

            this.consumeCommand();
        },
        findObject: function(id) {
            return Y.Array.find(this.objects, function(o) {
                return o.id === id;
            });
        },
        doIdleAnimation: function() {
            var texts = ["HELP! HELP!!! SOMEBODY HERE? PLEASE HELP ME!",
                "PLEASE HELP ME!", "WHY ME? TELL ME WHY?", "WOULD ANYBODY BE KIND ENOUGH AS TO GET ME OUT OF HERE?"];

            if (this.currentState === "idle") {
                var enemy = this.display.getEntity("Enemy");
                enemy.say(texts[Math.floor(Math.random() * (texts.length))]);
                enemy.shakeHands(3);
            }
        },
        consumeCommand: function() {
            if (this.commandsStack && this.commandsStack.length > 0) {
                var command = this.commandsStack.shift();
                //Y.log("consumeCommand" + ", " + command.type + ", " + command);
                switch (command.type) {

                    case "move":
                    case "fire":
                        //Y.mix(this.findObject(command.id), // Update target object cfg
                        //        command.object, true);
                        //this.syncFrontUI();
                        break;

                    case "updated":
                        Y.mix(this.findObject(command.object.id), // Update target object cfg
                                command.object, true);
                        this.syncFrontUI();
                        this.consumeCommand();
                        break;

                    case "gameWon":
                        var panel = this.getPanel({
                            bodyContent: "You won!",
                            buttons: {
                                footer: [{
                                        name: 'proceed',
                                        label: 'Next level',
                                        action: Y.bind(function() {
                                            panel.exit();
                                            this.doNextLevel();
                                        }, this)
                                    }]
                            }
                        });
                        //this.showMessage("info", "You won! You can proceed to next level!");
                        //this.runButton.set("label", this.NEXT_BUTTON_LABEL);
                        //this.runButton.detachAll("click");
                        //this.runButton.on("click", this.doNextLevel, this);
                        break;

                    case "log":
                        this.get("contentBox").one(".debugger").append(command.text + "<br />");
                        Y.later(100, this, this.consumeCommand);
                        //this.fire("commandExecuted");
                        break;

                    case "breakpoint":
                        Y.log("Breakpoint reached: " + command.line, "info");

                        this.currentBreakpointLine = command.line;
                        this.currentBreakpointStep = command.step;
                        this.aceField.session.addGutterDecoration(command.line, "proggame-currentline");
                        this.setState("breaking");
                        break;

                    default:
                        break;
                }

                this.display.execute(command); // Forware the command to the display

            } else if (this.commandsStack) {
                this.setState("idle");
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
            if (this.findObject("Player")) {
                this.updateUI(this.findObject("Player"), cb.one(".player-ui"));
            }
            if (this.findObject("Enemy")) {
                this.updateUI(this.findObject("Enemy"), cb.one(".enemy-ui"));
            }
        },
        updateUI: function(object, el) {
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
        },
        getPanel: function(cfg) {
            return new Y.Wegas.Panel(Y.mix(cfg, {
                modal: true,
                centered: true,
                visible: true,
                zIndex: 1000,
                width: 500,
                render: true
                        //height: Y.DOM.winHeight() - 250,
            }));
        },
        /*
         * @override
         */
        showMessage: function(level, message) {
            this.getPanel({
                bodyContent: message
            });
            //this.getPanel().setStdModContent("body", message).show()._uiSetFillHeight(this.get("fillHeight")).centered();       // Center the panel
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
                    sortable: "true",
                    elementType: {
                        type: "contextgroup",
                        contextKey: "components",
                        fields: [{
                                name: "Trap",
                                type: "group",
                                fields: [
                                    {
                                        name: "id",
                                        label: "ID",
                                        type: "string",
                                        value: "Trap"
                                    }, {
                                        name: "x",
                                        type: "number",
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: "number",
                                        label: "y"
                                    }, {
                                        name: "enabled",
                                        label: "Active by default",
                                        type: "boolean",
                                        value: true
                                    }, {
                                        name: "components",
                                        type: "uneditable",
                                        value: "Trap"
                                    }

                                ]
                            }, {
                                name: "PC",
                                type: "group",
                                fields: [
                                    {
                                        name: "id",
                                        label: "ID",
                                        type: "string",
                                        value: "Player"
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
                                    }, {
                                        name: "components",
                                        type: "uneditable",
                                        value: "PC"
                                    }
                                ]
                            }, {
                                name: "NPC",
                                type: "group",
                                fields: [
                                    {
                                        name: "id",
                                        label: "ID",
                                        type: "string",
                                        value: "Enemy"
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
                                    }, {
                                        name: "components",
                                        type: "uneditable",
                                        value: "NPC"
                                    }
                                ]
                            }, {
                                name: "Panel",
                                type: "group",
                                fields: [
                                    {
                                        name: "id",
                                        type: "string",
                                        label: "ID",
                                        value: "Panel"
                                    }, {
                                        name: "value",
                                        label: "Value",
                                        type: "text",
                                        value: "'Hello World !'"
                                    }, {
                                        name: "x",
                                        type: "number",
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: "number",
                                        label: "y"
                                    }, {
                                        name: "collides",
                                        label: "collides",
                                        type: "boolean"
                                    }, {
                                        name: "components",
                                        type: "uneditable",
                                        value: "Panel"
                                    }
                                ]
                            }, {
                                name: "Door",
                                type: "group",
                                fields: [
                                    {
                                        name: "id",
                                        label: "ID",
                                        type: "string",
                                        value: "Trap"
                                    }, {
                                        name: "x",
                                        type: "number",
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: "number",
                                        label: "y"
                                    }, {
                                        name: "open",
                                        label: "Open by default",
                                        type: "boolean",
                                        value: true
                                    }, {
                                        name: "components",
                                        type: "uneditable",
                                        value: "Trap"
                                    }

                                ]
                            }, {
                                name: "Controller",
                                type: "group",
                                fields: [
                                    {
                                        name: "id",
                                        label: "ID",
                                        type: "string",
                                        value: "Controller"
                                    }, {
                                        name: "x",
                                        type: "number",
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: "number",
                                        label: "y"
                                    }, {
                                        name: "enabled",
                                        label: "Enabled by default",
                                        type: "boolean",
                                        value: false
                                    }, {
                                        name: "components",
                                        type: "uneditable",
                                        value: "Controller"
                                    }

                                ]
                            }]
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
                value: "comparePos(find('Player'), find('Enemy'))",
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
            onAction: {
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
                value: [
                    [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}],
                    [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}],
                    [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 1}, {x: 0, y: 1}, {x: 0, y: 1}, {x: 0, y: 0}],
                    [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}],
                    [{x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}, {x: 0, y: 0}]
                ],
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
                value: [{
                        id: "Enemy",
                        components: "NPC",
                        direction: 4,
                        x: 5,
                        y: 2,
                        collides: false
                    }, {
                        id: "Player",
                        components: "PC",
                        direction: 2,
                        x: 0,
                        y: 2
                    }],
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
