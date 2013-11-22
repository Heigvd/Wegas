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
    var CONTENTBOX = 'contentBox',
            RUN_BUTTON_LABEL = "<div class='proggame-play'><span>RUN</span><span> CODE</span></div>",
            STOP_BUTTON_LABEL = "<span class='proggame-stop'>STOP</span>",
            NEXT_BUTTON_LABEL = "<span class='proggame-next'>NEXT</span>",
            DEBUG_BUTTON_LABEL = "<span class='proggame-playpause'></span>",
            SMALLSTOP_BUTTON_LABEL = "<span class='proggame-stop-small'>STOP</span>",
            ProgGameLevel;
    /**
     *  The level display class, with script input, ia, debugger and
     *  terrain display.
     *
     */
    ProgGameLevel = Y.Base.create("wegas-proggame-level", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        // *** Fields *** //
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
                + '<div class="debugger"></div>'
                + '</div>'
                + '</div>'

                + '<div class="code"></div>'

                + '</div>',
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.objects = this.get("objects");

            this.currentBreakpointLine = -1;
            this.currentBreakpointStep = -1;
            this.watches = [];
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX);

            cb.one(".topcenter h1").setHTML(this.get("label"));                 // Display level name

            var params = this.toObject();
            delete params.plugins;                                              // @fixme here proggamedipslay parameters should be in a separate attr
            this.display = new Y.Wegas.ProgGameDisplay(params);                 // Render canvas display widget
            this.display.render(cb.one(".terrain"));

            this.editorTabView = new Y.TabView({//                              // Render the tabview for scripts
                render: cb.one(".code")
            });
            this.mainEditorTab = this.addEditorTab("Main");                     // Add the "Main" tabview, which containes the code that will be executed

            this.runButton = new Y.Wegas.Button({
                cssClass: "proggame-runbutton",
                tooltip: "Run my code"
            });                                                                 // Render run button
            this.runButton.render(cb.one(".buttons"));

            this.stopButton = new Y.Wegas.Button({
                label: SMALLSTOP_BUTTON_LABEL,
                //disabled: true,
//                visible: false,
                cssClass: "proggame-smallbutton",
                render: cb.one(".buttons")
            });                                                                 // Render stop button

            this.renderDebugTabView();                                          // Render debug treeview

            this.renderApi();                                                   // Add methods to api

            this.resetUI();
            this.setState("idle");
        },
        bindUI: function() {
            //this.handlers.response = Y.Wegas.Facade.VariableDescriptor.after("update",
            //        this.syncUI, this); // If data changes, refresh

            this.runButton.on("click", function() {                             // On run button click
                if (this.currentState === "run" || this.currentState === "debugrun") {// toggle between run and idle mode
                    this.setState("idle");
                } else {
                    this.setState("debugrun");
                    //this.setState("run");
                }
            }, this);

            this.handlers.fileOpen = Y.on("*:openFile", function(e) {           // Every time a file is opened,
                var tab;
                this.editorTabView.each(function(t) {
                    if (t.get("label") === e.file.get("subject")) {
                        tab = t;
                    }
                });
                if (tab) {                                                      // If the file is already opened,
                    tab.set("selected", 1);                                     // display it.
                } else {                                                        // Otherwise,
                    Y.Wegas.Facade.VariableDescriptor.sendRequest({//           // retrieve the content body from the server
                        request: "/Inbox/Message/" + e.file.get("id") + "?view=Extended",
                        cfg: {
                            updateCache: false
                        },
                        on: {
                            success: Y.bind(function(e) {
                                var file = e.response.entity,
                                        tab = this.addEditorTab(file.get("subject"), file.get("body"));// and display it in a new tab

                                tab.plug(Y.Plugin.Removeable);
                            }, this)
                        }
                    });
                }
            }, this);

            this.stopButton.on("click", function() {
                this.setState("idle");
            }, this);

            this.display.after('commandExecuted', this.consumeCommand, this);   // When a command is executed, continue stack evaluation
            this.after('commandExecuted', this.consumeCommand, this);

            this.idleHandler = Y.later(10000, this, this.doIdleAnimation, [], true);// While in idle mode, launch idle animation every 10 secs
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
            this.display.destroy();
            this.runButton.destroy();
            this.addWatchButton.destroy();
            this.variableTreeView.destroy();
            this.debugTabView.destroy();
            this.idleHandler.cancel();
        },
        setState: function(nextState) {
            Y.log("setState(" + nextState + ")", "info", "Wegas.ProgGameLevel");
            if (this.currentState === nextState) {
                return;
            }
            switch (nextState) {
                case "breaking":
                    this.runButton.set("label", DEBUG_BUTTON_LABEL);
                    break;

                case "idle" :
                    this.runButton.set("label", RUN_BUTTON_LABEL);
                    this.commandsStack = null;
                    this.mainEditorTab.aceField.session.removeGutterDecoration(this.currentBreakpointLine, "proggame-currentline");
                    this.currentBreakpointLine = -1;
                    this.currentBreakpointStep = -1;
                    break;

                case "run":
                    this.runButton.set("label", STOP_BUTTON_LABEL);
                    this.resetUI();
                    this.run();
                    break;

                case "debugrun":
                    this.runButton.set("label", STOP_BUTTON_LABEL);
                    if (this.currentState === "idle") {
                        this.resetUI();
                    }
                    this.debug();
                    break;
            }
            this.currentState = nextState;
        },
        run: function() {
            this.sendRunRequest(this.mainEditorTab.aceField.getValue());
        },
        debug: function() {
            Y.log("debug()", "info", "Wegas.ProgGameLevel");
            this.mainEditorTab.aceField.session.removeGutterDecoration(this.currentBreakpointLine, "proggame-currentline");

            var code = this.instrument(),
                    breakpoints = Y.Object.keys(this.mainEditorTab.aceField.editor.getSession().getBreakpoints());

            Y.log("Sending request: current step: " + this.currentBreakpointStep
                    + ", breakpoints: " + Y.JSON.stringify(breakpoints)
                    + "\ninstrumented code: \n" + code, "info", "Wegas.ProgGameLevel");

            this.sendRunRequest(code, {
                debug: true,
                watches: this.watches, // Watched values
                breakpoints: breakpoints, // breakpoints
                startStep: this.currentBreakpointStep                           // The running step reached during last evaluation
            });
        },
        instrument: function() {
            var ins = new Y.Wegas.JSInstrument();                               // Instantiate js instrumenter
            return ins.instrument(this.mainEditorTab.aceField.getValue());                    // return instrumented value of current player script
        },
        reRun: function() {
            Y.log("reRun()", "info", "Wegas.ProgGameLevel");

            var code = this.instrument(),
                    breakpoints = Y.Object.keys(this.mainEditorTab.aceField.editor.getSession().getBreakpoints());

            Y.log("instrumented code: " + code + ", current step: " + this.currentBreakpointStep + ", breakpoints: " + Y.JSON.stringify(breakpoints), "info", "Wegas.ProgGameLevel");

            this.sendRunRequest(code, {
                debug: true,
                watches: this.watches, // Watched values
                breakpoints: breakpoints, // breakpoints
                startStep: this.currentBreakpointStep - 1,
                targetStep: this.currentBreakpointStep
//                recordCommands: false
            });
        },
        sendRunRequest: function(code, interpreterCfg) {
            interpreterCfg = interpreterCfg || {};
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: "run("
                            + "function (name) {with(this) {" + code + "\n}}, " // Player's code
                            + Y.JSON.stringify(this.toObject()) + ", "          // the current level
                            + Y.JSON.stringify(interpreterCfg) + ");"
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
            //this.display.set("objects", this.objects);                         // Reset the display to default
            //this.display.syncUI();
            this.display.execute({
                type: 'resetLevel',
                objects: this.objects
            });
            this.debugTabView.item(0).set("content", "");                       // Empty log tab

            this.syncFrontUI();
        },
        onServerReply: function(e) {
            Y.log("onServerReply(" + e.response.entity + ")", "info", "Wegas.ProgGameLevel");
            this.commandsStack = Y.JSON.parse(e.response.entity);
            this.consumeCommand();
        },
        findObject: function(id) {
            return Y.Array.find(this.objects, function(o) {
                return o.id === id;
            });
        },
        doIdleAnimation: function() {
            var texts = this.get("idlePhrases");

            if (texts.length === 0) {
                texts = ["HELP! HELP!!! SOMEBODY HERE? PLEASE HELP ME!",
                    "PLEASE HELP ME!", "WHY ME? TELL ME WHY?", "WOULD ANYBODY BE KIND ENOUGH AS TO GET ME OUT OF HERE?"];
            }

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
                        break;

                    case "log":
                        this.debugTabView.item(0).get("panelNode").append(command.text + "<br />");
                        Y.later(100, this, this.consumeCommand);
                        //this.fire("commandExecuted");
                        break;

                    case "breakpoint":
                        Y.log("Breakpoint reached at line: " + command.line + ", step: " + command.step, "info", "Wegas.ProgGameLevel");

                        this.mainEditorTab.set("selected", 1);
                        if (command.line !== this.currentBreakpointLine) {      // May occure on rerun
                            this.mainEditorTab.aceField.session.addGutterDecoration(command.line, "proggame-currentline");
                        }
                        this.currentBreakpointLine = command.line;
                        this.currentBreakpointStep = command.step;

                        this.updateDebugTreeview(command.scope);
                        this.setState("breaking");
                        break;

                    default:
                        break;
                }

                this.display.execute(command);                                  // Forward the command to the display

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
        renderApi: function() {
            var i, api = this.get("api"), acc = [],
                    METHODTOTEXT = {
                say: "say(text: String)"
            };

            for (i = 0; i < api.length; i += 1) {
                acc.push((METHODTOTEXT[api[i].name] || api[i].name + "()") + "<br />");
            }
            Y.all(".api").setHTML(acc.join(""));                                // All so it does not crash if widget is not present
        },
        addEditorTab: function(label, code) {
            var tab = this.editorTabView.add({
                label: label
            }).item(0),
                    aceField = new Y.inputEx.AceField({//                          // Render ace editor
                parentEl: tab.get("panelNode"),
                name: 'text',
                type: 'ace',
                height: "170px",
                language: "javascript",
                theme: "twilight",
                value: "//Put your code here...\n"
                        //value: "function move () {\n    var y,\n    x;\n\n}\nvar test;\ntest.x = 0;"
                        //value: "move();\nmove();"
                        //value: "for (var i=0; i<10; i++) {\n    move();\n}"
                        //value: "var y = 0;\n x = 10;\n move;"
            });
            tab.set("selected", 1);

            aceField.session.on("change", Y.bind(function() {                   // Every time the code is changed is entered
                if (this.currentState === "breaking") {                         // stop debug session
                    this.setState("idle");
                }
            }, this));

            aceField.editor.on("guttermousedown", function(e) {                 // Add breakpoints on gutter click
                var target = e.domEvent.target;
                if (target.className.indexOf("ace_gutter-cell") === -1)
                    return;

                if (tab.get("label") !== "Main") {
                    alert("Breakpoints are only available in the Main code");
                    return;
                }
                //if (!this.aceField.editor.isFocused())
                //    return;
                //if (e.clientX > 25 + target.getBoundingClientRect().left)
                //    return;
                var row = e.getDocumentPosition().row,
                        session = e.editor.getSession();

                if (!session.getBreakpoints()[row]) {
                    session.setBreakpoint(row);
                } else {
                    session.clearBreakpoint(row);
                }
                e.stop();
                // Break points that move on line add
                // https://github.com/MikeRatcliffe/Acebug/blob/master/chrome/content/ace++/startup.js#L66-104
            });

            tab.aceField = aceField;                                            // Set up a reference to the ace field

            return tab;
        },
        renderDebugTabView: function() {
            var cb = this.get(CONTENTBOX), panelNode;

            this.debugTabView = new Y.TabView({//                               // Render the tabview for logs and variable treeview
                children: [{
                        label: "Log"
                    }, {
                        label: "Variables"
                    }],
                render: cb.one(".debugger")
            });
            panelNode = this.debugTabView.item(1).get("panelNode");
            this.addWatchButton = new Y.Wegas.Button({
                label: "Add watch",
                render: panelNode
            });
            this.addWatchButton.on("click", function() {
                var watch = prompt("Expression");
                this.watches.push(watch);
                if (this.currentState === "breaking") {                         // If an evaluation is on going
                    this.reRun();                                               // rerun script until current step to get new
                } else {
                    this.variableTreeView.add({
                        label: watch + ": null",
                        editable: true
                    });
                }
                //this.updateDebugTreeview();
            }, this);
            this.variableTreeView = new Y.TreeView({
                render: panelNode                                               // Render the variable treeview
            });
            this.updateDebugTreeview({});
        },
        updateDebugTreeview: function(object) {
            var watches = {};
            Y.Array.each(this.watches, function(i) {
                watches[i] = undefined;
            });
            Y.mix(watches, object, true);

            function genItems(o, label) {
                if (Y.Lang.isObject(o)) {
                    var children = [];
                    Y.Object.each(o, function(o, key) {
                        children.push(genItems(o, key));
                    });
                    return {
                        type: "TreeNode",
                        label: label + ": Object",
                        children: children,
                        editable: true
                    };
                } else if (Y.Lang.isArray(o)) {
                    return {
                        type: "TreeNode",
                        //label: label + ": Array[" + o + "]"
                        label: label + ": Array[" + o.length + "]",
                        children: Y.Array.map(o, genItems),
                        editable: true
                    };
                } else {
                    return {
                        editable: true,
                        label: label + ":" + o
                    };
                }
            }
            watches = genItems(watches).children;                               // Generate tree items and remove level 0 (do not show a tree node for the context)

            this.variableTreeView.removeAll();                                  // Update treeview (set("children", items) does not seem to work)
            this.variableTreeView.add(watches);
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
                //height: Y.DOM.winHeight() - 250,
                render: true
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
                value: 1,
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
            },
            idlePhrases: {
                type: "array",
                value: []
            }
        }
    });
    Y.namespace('Wegas').ProgGameLevel = ProgGameLevel;
});
