/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**co
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-proggame-level', function(Y) {
    "use strict";
    var CONTENTBOX = 'contentBox', HIDDEN = "hidden", ARRAY = "array",
            NUMBER = "number", STRING = "string", NUMBER = "number", BOOLEAN = "boolean",
            LABEL = "label",
            RUN_BUTTON_LABEL = "<span class='proggame-play'></span>",
            STOP_BUTTON_LABEL = "<span class='proggame-stop'></span>",
            NEXT_BUTTON_LABEL = "<span class='proggame-next'></span>",
            DEBUG_BUTTON_LABEL = "<span class='proggame-playpause'></span>",
            SMALLSTOP_BUTTON_LABEL = "<span class='proggame-stop-small'></span>",
            Wegas = Y.Wegas,
            ProgGameLevel;
    /**
     *  The level display class, with script input, ia, debugger and
     *  terrain display.
     */
    ProgGameLevel = Y.Base.create("wegas-proggame-level", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        // *** Fields *** //
        CONTENT_TEMPLATE: '<div>'
                + '<div class="proggame-title"><h1></h1><h2></h2><div class="proggame-help"></div></div>'
                + '<div class="proggame-lefttab"></div>'
                + '<div class="proggame-view">'
                + '<div class="message"></div>'
                + '<div class="ui">'
                + '<div class="terrain-ui player-ui"></div>'
                + '<div class="terrain-ui enemy-ui"></div>'
                + '</div>'
                + '<div class="terrain"></div>'
                + '</div>'
                + '<div class="proggame-buttons"></div>'
                + '<div class="proggame-debugger"></div>'
                + '<div class="code"></div>'
                + '</div>',
        // *** Lifecycle Methods *** //
        initializer: function() {
            this.handlers = {};
            this.currentBreakpointLine = -1;
            this.currentBreakpointStep = -1;
            this.watches = [];
        },
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                    label = this.get(LABEL).split("-");

            cb.one(".proggame-title h1").setHTML(label[0]);                   // Display level name
            cb.one(".proggame-title h2").setHTML(label[1]);                   // Display level name

            this.display = new Y.Wegas.ProgGameDisplay(Y.mix(this.toObject(), {// Render canvas display widget
                plugins: [], // @fixme here proggamedipslay parameters should be in a separate attr
                render: cb.one(".terrain")
            }, true));

            this.editorTabView = new Y.TabView({//                              // Render the tabview for scripts
                render: cb.one(".code")
            });
            this.mainEditorTab = this.addEditorTab("Main", this.get("defaultCode"));// Add the "Main" tabview, which containes the code that will be executed

            this.runButton = new Y.Wegas.Button({//                             // Render run button
                cssClass: "proggame-runbutton",
                tooltip: "Run code (Shift+Enter)",
                render: cb.one(".proggame-buttons")
            });

            this.stopButton = new Y.Wegas.Button({//                             // Render stop button
                label: SMALLSTOP_BUTTON_LABEL,
                //disabled: true,
                visible: false,
                cssClass: "proggame-smallbutton",
                render: cb.one(".proggame-buttons")
            });

            this.renderDebugTabView();                                          // Render debug treeview
            this.renderApiTabView();                                            // Render api and files treeview
            this.resetUI();                                                     // Reset the interface
        },
        bindUI: function() {
            this.runButton.on("click", this.onRunClick, this);                  // Run button click event
            this.handlers.shiftEnter = Y.one("body").on("key", this.onRunClick, "enter+shift", this);// Shift + enter event 

            this.on("stateChange", function(e) {                                // State machine transitions implementation
                Y.log("stateChange(" + e.newVal + ")", "info", "Wegas.ProgGameLevel");
                if (e.newVal === e.prevVal) {
                    return;
                }
                switch (e.newVal) {
                    case "breaking":
                        this.runButton.set(LABEL, DEBUG_BUTTON_LABEL);
                        break;

                    case "idle" :
                        this.runButton.set(LABEL, RUN_BUTTON_LABEL);
                        this.commandsStack = null;
                        this.setCurrentLine(null);
                        this.currentBreakpointLine = -1;
                        this.currentBreakpointStep = -1;
                        break;

                    case "run":
                        this.runButton.set(LABEL, STOP_BUTTON_LABEL);
                        this.resetUI();
                        this.run();
                        break;

                    case "debugrun":
                        this.runButton.set(LABEL, STOP_BUTTON_LABEL);
                        if (e.prevVal === "idle") {
                            this.resetUI();
                        }
                        this.debug();
                        break;
                }
            });
            this.set("state", "idle");                                          // Game is in idle state by default

            this.showMessage("info", this.get("intro"));
            this.get("contentBox").one(".proggame-help").on('click', function(e) {// When help button is clicked,
                this.showMessage("info", this.get("intro"));                    // redisplay the popup
            }, this);

            this.plug(Y.Plugin.OpenPageAction, {//                              // Whenever level is finished,
                subpageId: 2,
                targetEvent: "gameWon",
                targetPageLoaderId: "maindisplayarea"                           // display the page  2 which shows the last level
            });

            this.stopButton.on("click", function() {
                this.set("state", "idle");
            }, this);

            this.display.after('commandExecuted', this.consumeCommand, this);   // When a command is executed, continue stack evaluation
            this.after('commandExecuted', this.consumeCommand, this);           // idem

            this.idleHandler = Y.later(10000, this, this.doIdleAnimation, [], true);// While in idle mode, launch idle animation every 10 secs
            Y.later(100, this, this.doIdleAnimation);

            //this.handlers.response = Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this); // If data changes, refresh
        },
        syncUI: function() {
            this.display.syncUI();                                              // Sync the canvas
            this.syncFrontUI();                                                 // Sync the on screen display

            Wegas.Facade.VariableDescriptor.script.eval("VariableDescriptorFacade.find(gameModel, \"inventory\").getProperty(self, \"debugger\") != \"true\"",
                    Y.bind(function(result) {                                   //Check if breakpoint has been bought from the shop
                this.disableBreakpoint = result;
            }, this));
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
            this.apiTabView.destroy();
            this.idleHandler.cancel();
        },
        /**
         * Override to prevent the serialization of the openpage action we
         * created programatically.
         *
         * @returns {unresolved}
         */
        toJSON: function() {
            var ret = Wegas.Editable.prototype.toJSON.apply(this, arguments);

            ret.plugins = Y.Array.reject(ret.plugins || [], function(i) {
                return i.fn === "OpenPageAction";
            });
            return ret;
        },
        onRunClick: function(e) {                                               // On run button click,
            e.halt(true);
            if (this.get("state") === "run" || this.get("state") === "debugrun") {
                this.set("state", "idle");                                          // toggle between idle
            } else {
                this.set("state", "debugrun");                                      // and run mode
                //this.set("state", "run");
            }
        },
        run: function() {
            this.sendRunRequest(this.mainEditorTab.aceField.getValue());
        },
        debug: function() {
            Y.log("debug()", "info", "Wegas.ProgGameLevel");

            var code = this.instrument(this.mainEditorTab.aceField.getValue()),
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
        reRun: function() {
            Y.log("reRun()", "info", "Wegas.ProgGameLevel");

            var code = this.instrument(this.mainEditorTab.aceField.getValue()), // Fetch instrumented code
                    breakpoints = Y.Object.keys(this.mainEditorTab.aceField.editor.getSession().getBreakpoints()); // and breakpoints

            Y.log("instrumented code: " + code + ", current step: " + this.currentBreakpointStep + ", breakpoints: " + Y.JSON.stringify(breakpoints), "info", "Wegas.ProgGameLevel");

            this.sendRunRequest(code, {
                debug: true,
                watches: this.watches, // Watched values
                breakpoints: breakpoints, // breakpoints
                startStep: this.currentBreakpointStep - 1,
                targetStep: this.currentBreakpointStep
                        //recordCommands: false
            });
        },
        instrument: function(code) {
            var ins = new Wegas.JSInstrument();                                 // Instantiate js instrumenter
            return ins.instrument(code);                                        // return instrumented value of the code
        },
        sendRunRequest: function(code, interpreterCfg) {
            interpreterCfg = interpreterCfg || {};
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
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
                        this.set("state", "idle");
                        alert("Your script contains an error.");
                    }, this)
                }
            });
        },
        resetUI: function() {
            Y.log("resetUI()", "info", "Wegas.ProgGameDisplay");
            this.commandsStack = null;

            this.display.execute({// Reset the display to default
                type: 'resetLevel',
                objects: Y.clone(this.get("objects"))
            });

            //this.debugTabView.item(0).set("content", "");                     // Empty log tab
            this.debugTabView.item(0).get("panelNode").setContent("");          // Empty log tab
            this.syncFrontUI();
        },
        onServerReply: function(e) {
            Y.log("onServerReply(" + e.response.entity + ")", "info", "Wegas.ProgGameLevel");
            this.commandsStack = Y.JSON.parse(e.response.entity);
            this.consumeCommand();
        },
        findObject: function(id) {
            return Y.Array.find(this.get("objects"), function(o) {
                return o.id === id;
            });
        },
        doIdleAnimation: function() {
            var texts = this.get("invites");

            if (texts.length === 0) {
                texts = ["HELP! HELP!!! SOMEBODY HERE? PLEASE HELP ME!",
                    "PLEASE HELP ME!", "WHY ME? TELL ME WHY?", "WOULD ANYBODY BE KIND ENOUGH AS TO GET ME OUT OF HERE?"];
            }

            if (this.get("state") === "idle") {
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
                        Y.later(3500, this, function() {
                            var panel = this.getPanel({
                                bodyContent: "<div><b>LEVEL FINISHED!</b> <br /><br />You have won 100 gold.</div><button class='yui3-button proggame-button'>Next level</button>"
                            });
                            Y.later(50, this, function() {                          // Hide panel anywhere user clicks
                                Y.one("body").once("click", function() {
                                    panel.destroy();
                                    //panel.exit();
                                    this.doNextLevel();
                                }, this);
                            });
                        });
                        break;

                    case "log":
                        this.debugTabView.item(0).get("panelNode").append(command.text + "<br />");
                        Y.later(100, this, this.consumeCommand);
                        //this.fire("commandExecuted");
                        break;

                    case "line":
                        this.setCurrentLine(command.line);
                        this.consumeCommand();
                        break;

                    case "breakpoint":
                        Y.log("Breakpoint reached at line: " + command.line + ", step: " + command.step, "info", "Wegas.ProgGameLevel");

                        this.mainEditorTab.set("selected", 1);
                        if (command.line !== this.currentBreakpointLine) {      // May occur on rerun
                            this.setCurrentLine(command.line);
                        }
                        this.currentBreakpointLine = command.line;
                        this.currentBreakpointStep = command.step;

                        this.updateDebugTreeview(command.scope);
                        this.set("state", "breaking");
                        break;

                    default:
                        break;
                }

                this.display.execute(command);                                  // Forward the command to the display

            } else if (this.commandsStack) {
                this.set("state", "idle");
            }
        },
        setCurrentLine: function(line) {
            if (this.marker) {
                this.mainEditorTab.aceField.session.removeGutterDecoration(this.cLine, "proggame-currentgutterline");
                this.mainEditorTab.aceField.session.removeMarker(this.marker);
                this.marker = null;
            }
            if (line) {
                this.cLine = line;
                var Range = require('ace/range').Range;
                this.marker = this.mainEditorTab.aceField.session.addMarker(new Range(line, 0, line, 200), "proggame-currentline", "text");
                this.mainEditorTab.aceField.session.addGutterDecoration(line, "proggame-currentgutterline");
            }
        },
        doNextLevel: function() {
            Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/ProgGame/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    data: this.get("onWin") + ";VariableDescriptorFacade.find(gameModel, \"money\").add(self, 100);"
                },
                on: {
                    success: Y.bind(function() {
                        this.fire("gameWon");
                    }, this)
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
        addEditorTab: function(label, code, file) {
            var _file = file,
                    saveTimer = new Y.Wegas.Timer(),
                    tab = this.editorTabView.add({
                label: label
            }).item(0),
                    aceField = new Y.inputEx.AceField({//                          // Render ace editor
                parentEl: tab.get("panelNode"),
                name: 'text',
                type: 'ace',
                height: "140px",
                language: "javascript",
                theme: "twilight",
                value: code
            });
            tab.set("selected", 1);

            aceField.session.on("change", Y.bind(function() {                   // Every time the code is changed is entered
                if (this.get("state") === "breaking") {                         // stop debug session
                    this.set("state", "idle");
                }
                if (_file) {
                    saveTimer.reset();
                }
            }, this));

            saveTimer.on("timeOut", function() {
                _file.set("body", aceField.getValue());
                Y.Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/Inbox/Message/" + _file.get("id"),
                    cfg: {
                        updateCache: false,
                        method: "PUT",
                        data: _file
                    }
                });
            });

            aceField.editor.on("guttermousedown", Y.bind(function(e) {          // Add breakpoints on gutter click
                if (e.domEvent.target.className.indexOf("ace_gutter-cell") === -1)
                    return;

                if (this.disableBreakpoint) {                                   // Check if breakpoint has been bought from the shop
                    return;
                }

                if (tab.get(LABEL) !== "Main") {                                // Breakpoints are not implemented in files yet
                    alert("Breakpoints are only available in the Main code");
                    return;
                }

                var row = e.getDocumentPosition().row,
                        session = e.editor.getSession();
                if (!session.getBreakpoints()[row]) {
                    session.setBreakpoint(row);
                } else {
                    session.clearBreakpoint(row);
                }
                e.stop();
                // Breakpoints that move on line add
                // https://github.com/MikeRatcliffe/Acebug/blob/master/chrome/content/ace++/startup.js#L66-104
            }, this));

            tab.aceField = aceField;                                            // Set up a reference to the ace field
            return tab;
        },
        renderDebugTabView: function() {
            var cb = this.get(CONTENTBOX), panelNode;

            this.debugTabView = new Y.TabView({//                               // Render the tabview for logs and variable treeview
                children: [{
                        label: "Log"
                    }, {
                        label: "Watches",
                        plugins: [{
                                fn: "ConditionalDisable",
                                cfg: {
                                    condition: {
                                        "@class": "Script",
                                        content: "VariableDescriptorFacade.find(gameModel, \"inventory\").getProperty(self, \"watches\") != \"true\"",
                                        language: "JavaScript"
                                    }
                                }
                            }]
                    }],
                render: cb.one(".proggame-debugger")
            });
            panelNode = this.debugTabView.item(1).get("panelNode");
            this.addWatchButton = new Wegas.Button({
                label: "Add watch",
                render: panelNode
            });
            this.addWatchButton.on("click", function() {
                var watch = prompt("Expression");
                this.watches.push(watch);
                if (this.get("state") === "breaking") {                         // If an evaluation is on going
                    this.reRun();                                               // rerun script until current step to get new
                } else {
                    this.variableTreeView.add({
                        label: watch + ": null",
                        iconCSS: ""
                    });
                }
                //this.updateDebugTreeview();
            }, this);
            this.variableTreeView = new Y.TreeView({
                render: panelNode                                               // Render the variable treeview
            });
            this.updateDebugTreeview({});
        },
        renderApiTabView: function() {
            var cb = this.get(CONTENTBOX), packages = {}, node, apiTreeView;

            this.apiTabView = new Y.TabView({//                           // Render the tabview for files and api
                children: [{
                        type: "Tab",
                        label: "API",
                        children: [{
                                type: "TreeViewWidget",
                                cssClass: "proggame-api"
                            }]
                    }, {
                        type: "Tab",
                        label: "Files",
                        children: [{
                                type: "ScriptFiles",
                                variable: {
                                    name: "files"
                                }
                            }],
                        plugins: [{
                                fn: "ConditionalDisable",
                                cfg: {
                                    condition: {
                                        "@class": "Script",
                                        content: "VariableDescriptorFacade.find(gameModel, \"inventory\").getProperty(self, \"filelibrary\") != \"true\"",
                                        language: "JavaScript"
                                    }
                                }
                            }]
                    }],
                render: cb.one(".proggame-lefttab")
            });
            apiTreeView = this.apiTabView.item(0).witem(0);

            Y.Array.each(this.get("api"), function(i) {                         // Map api to a tree structure
                node = Wegas.ProgGameLevel.API[i] || {
                    label: i + "()"
                };
                if (node.pkg) {
                    if (!packages[node.pkg]) {
                        packages[node.pkg] = {
                            type: "TreeNode",
                            label: node.pkg,
                            collapsed: false,
                            children: []
                        };
                    }
                    packages[node.pkg].children.push(node);
                } else {
                    packages[node.label] = node;
                }
            });
            apiTreeView.treeView.destroyAll();
            apiTreeView.treeView.add(Y.Object.values(packages));

            apiTreeView.on("treeleaf:click", function(e) { // When api is clicked
                var toInsert = e.target.get("label").replace(/([^\(]*).*/gi, "$1");
                this.editorTabView.get("selection").aceField.editor.insert(toInsert + "();\n");
                e.halt(true);
                //panel.exit();
                //this.show();
            }, this);
            //this.updateDebugTreeview({});

            this.apiTabView.item(1).witem(0).on("openFile", function(e) {       // Every time a file is opened,
                var tab;
                this.editorTabView.each(function(t) {
                    if (t.get(LABEL) === e.file.get("subject")) {
                        tab = t;
                    }
                });

                if (tab) {                                                      // If the file is already opened,
                    tab.set("selected", 1);                                     // display it.
                } else {                                                        // Otherwise,
                    Wegas.Facade.VariableDescriptor.sendRequest({//             // retrieve the content body from the server
                        request: "/Inbox/Message/" + e.file.get("id") + "?view=Extended",
                        cfg: {
                            updateCache: false
                        },
                        on: {
                            success: Y.bind(function(e) {
                                var file = e.response.entity,
                                        tab = this.addEditorTab(file.get("subject"), file.get("body"), file);// and display it in a new tab
                                tab.plug(Y.Plugin.Removeable);
                            }, this)
                        }
                    });
                }
            }, this);
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
                        iconCSS: ""
                    };
                } else if (Y.Lang.isArray(o)) {
                    return {
                        type: "TreeNode",
                        //label: label + ": Array[" + o + "]"
                        label: label + ": Array[" + o.length + "]",
                        children: Y.Array.map(o, genItems),
                        iconCSS: ""

                    };
                } else {
                    return {
                        label: label + ":" + o,
                        iconCSS: ""
                    };
                }
            }
            watches = genItems(watches).children;                               // Generate tree items and remove level 0 (do not show a tree node for the context)

            //Y.Array.each(watches, function(i) {                                 // First level nodes are editables
            //    i.editable = false;
            //});
            this.variableTreeView.destroyAll();                                 // Update treeview (set("children", items) does not seem to work)
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
        /*
         * @override
         */
        showMessage: function(level, message) {
            var panel = this.getPanel({
                bodyContent: "<div>" + message + "</div><button class='yui3-button proggame-button'>Continue</button>"
            });
            Y.later(50, this, function() {                                      // Hide panel anywhere user clicks
                Y.one("body").once("click", function() {
                    panel.destroy();
                    //panel.exit();
                    this.show();
                }, this);
            });
        },
        getPanel: function(cfg) {
            var panel = new Wegas.Panel(Y.mix(cfg, {
                modal: true,
                centered: false,
                x: 100,
                y: 85,
                zIndex: 1000,
                width: "962px",
                height: 709,
                render: true,
                buttons: []
                        //focusOn: []
                        //hideOn: [{
                        //        eventName: 'click',
                        //        node: Y.one('body')
                        //    }],
            }));
            this.hide();
            panel.get("boundingBox").addClass("proggame-panel");
            return panel;
        }
    }, {
        ATTRS: {
            intro: {
                type: "string",
                format: "html",
                optional: true,
                _inputex: {
                    label: "Intro text"
                }
            },
            visible: {
                value: false
            },
            state: {
                "transient": true
            },
            label: {
                type: STRING,
                _inputex: {
                    index: -1
                }
            },
            objects: {
                type: ARRAY,
                _inputex: {
                    useButtons: true,
                    sortable: "true",
                    elementType: {
                        type: "contextgroup",
                        contextKey: "components",
                        fields: [{
                                name: "Trap",
                                type: "group",
                                fields: [{
                                        name: "id",
                                        label: "ID",
                                        value: "Trap"
                                    }, {
                                        name: "x",
                                        type: NUMBER,
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: NUMBER,
                                        label: "y"
                                    }, {
                                        name: "enabled",
                                        label: "Active by default",
                                        type: BOOLEAN,
                                        value: true
                                    }, {
                                        name: "components",
                                        type: HIDDEN,
                                        value: "Trap"
                                    }]
                            }, {
                                name: "PC",
                                type: "group",
                                fields: [{
                                        name: "id",
                                        label: "ID",
                                        type: STRING,
                                        value: "Player"
                                    }, {
                                        name: "x",
                                        type: NUMBER,
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: NUMBER,
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
                                        type: HIDDEN
                                    }, {
                                        name: "components",
                                        type: HIDDEN,
                                        value: "PC"
                                    }]
                            }, {
                                name: "NPC",
                                type: "group",
                                fields: [{
                                        name: "id",
                                        label: "ID",
                                        type: STRING,
                                        value: "Enemy"
                                    }, {
                                        name: "x",
                                        type: NUMBER,
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: NUMBER,
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
                                        type: BOOLEAN
                                    }, {
                                        name: "components",
                                        type: HIDDEN,
                                        value: "NPC"
                                    }]
                            }, {
                                name: "Panel",
                                type: "group",
                                fields: [{
                                        name: "id",
                                        type: STRING,
                                        label: "ID",
                                        value: "Panel"
                                    }, {
                                        name: "value",
                                        label: "Value",
                                        type: "text",
                                        value: "'Hello World !'"
                                    }, {
                                        name: "x",
                                        type: NUMBER,
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: NUMBER,
                                        label: "y"
                                    }, {
                                        name: "collides",
                                        label: "collides",
                                        value: false,
                                        type: HIDDEN
                                    }, {
                                        name: "components",
                                        type: HIDDEN,
                                        value: "Panel"
                                    }]
                            }, {
                                name: "Door",
                                type: "group",
                                fields: [{
                                        name: "id",
                                        label: "ID",
                                        type: STRING,
                                        value: "Door"
                                    }, {
                                        name: "x",
                                        type: NUMBER,
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: NUMBER,
                                        label: "y"
                                    }, {
                                        name: "open",
                                        label: "Open by default",
                                        type: BOOLEAN,
                                        value: false
                                    }, {
                                        name: "components",
                                        type: HIDDEN,
                                        value: "Door"
                                    }]
                            }, {
                                name: "Controller",
                                type: "group",
                                fields: [{
                                        name: "id",
                                        label: "ID",
                                        type: STRING,
                                        value: "Controller"
                                    }, {
                                        name: "x",
                                        type: NUMBER,
                                        label: "x"
                                    }, {
                                        name: "y",
                                        type: NUMBER,
                                        label: "y"
                                    }, {
                                        name: "enabled",
                                        label: "Enabled by default",
                                        type: BOOLEAN,
                                        value: false
                                    }, {
                                        name: "components",
                                        type: HIDDEN,
                                        value: "Controller"
                                    }]
                            }]
                    }

                }
            },
            api: {
                type: ARRAY,
                value: [],
                _inputex: {
                    useButtons: true
                }
            },
            winningCondition: {
                type: STRING,
                value: "comparePos(find('Player'), find('Enemy'))",
                _inputex: {
                    _type: "ace"
                }
            },
            onStart: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: "ace"
                }
            },
            onAction: {
                type: STRING,
                format: "text",
                optional: true,
                _inputex: {
                    _type: "ace"
                }
            },
            onWin: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: "ace"
                }
            },
            defaultCode: {
                type: STRING,
                optional: true,
                value: "//Put your code here...\n",
                _inputex: {
                    label: "Player's starting code",
                    _type: "ace"
                }
            },
            map: {
                type: ARRAY,
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
                type: ARRAY,
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
                    type: HIDDEN,
                    useButtons: true,
                    elementType: {
                        type: "object"
                    }
                }
            },
            invites: {
                type: ARRAY,
                value: []
            },
            maxTurns: {
                type: STRING,
                value: 1,
                //format: "Integer",
                //validator: function(s) {
                //    return (parseInt(s) ? parseInt(s) : 1);
                //},
                _inputex: {
                    label: "Max turns",
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            }
            //arguments: {
            //    type: ARRAY,
            //    value: [],
            //    _inputex: {
            //        useButtons: true
            //    }
            //},
            //onTurn: {
            //    type: STRING,
            //    format: "text",
            //    optional: true,
            //    _inputex: {
            //        _type: "ace"
            //    }
            //},
        },
        API: {
            say: {
                label: "say(text:String)",
                tooltip: "say(text: String)\n\n"
                        + "Your avatar will loudly say the content of the text parameter.\n\n"
                        + "Parameters\ntext:String - The text you want to say out lout"
            },
            read: {
                label: "read():Number",
                tooltip: "read():Number\n\n"
                        + "Your avatar will read any panel on the same case as he is and return it.\n\n"
                        + "Returns\nNumber - The text on the panel"

            },
            move: {
                label: "move()",
                tooltip: "move()\n\n"
                        + "Using this function, your avatar will move one tile  in the direction he is currently facing."
            },
            left: {
                label: "left()",
                tooltip: "left()\n\n"
                        + "Your avatar turns to the left without moving."
            },
            right: {
                label: "right()",
                tooltip: "right()\n\n"
                        + "Your avatar turns to the left without moving."
            },
            "Math.PI": {
                pkg: "Math",
                tooltip: "Math:PI:Number\n\nContante containing the value of PI (approx. 3.14)",
                label: "Math.PI:Number"
            },
            "Math.floor": {
                label: "Math.floor():Number",
                pkg: "Math",
                tooltip: "Math.floor():Number\n\n"
                        + "The floor() method rounds a number DOWNWARDS to the nearest integer, and returns the result.\n\n"
                        + "Parameters\nx:Number - The number you want to round\n"
                        + "Returns\nNumber - The nearest integer when rounding downwards"
                        //tooltipHTML: "The floor() method rounds a number DOWNWARDS to the nearest integer, and returns the result.<br /><br />"
                        //        + "<b>Parameters</b><br />x:Number - The number you want to round"
                        //        + "<b>Returns</b><br />Number - The nearest integer when rounding downwards",

            },
            "Math.round": {
                pkg: "Math",
                label: "Math.round(x:Number):Number",
                tooltip: "Math.round(x:Number):Number\n\n"
                        + "If the fractional portion of number is .5 or greater, the argument is rounded to the next higher integer. If the fractional portion of number is less than .5, the argument is rounded to the next lower integer.\n"
                        + "Because round is a static method of Math, you always use it as Math.round(), rather than as a method of a Math object you created.\n\n"
                        //+ "The Math.round() function returns the value of a number rounded to the nearest integer.\n\n"
                        + "Parameters\n"
                        + "x:Number - The number you want to round\n"
                        + "Returns\n"
                        + "Number - the value of x rounded to the nearest integer"
            }
        }
    });
    Y.namespace('Wegas').ProgGameLevel = ProgGameLevel;
});
