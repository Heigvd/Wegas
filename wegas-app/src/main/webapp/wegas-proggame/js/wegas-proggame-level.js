/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-proggame-level', function (Y) {
    "use strict";
    var CONTENTBOX = "contentBox", HIDDEN = "hidden", ARRAY = "array",
            NUMBER = "number", STRING = "string", NUMBER = "number", BOOLEAN = "boolean",
            TEXT = "text", ACE = "ace", CLICK = "click", ID = "id",
            LABEL = "label", GROUP = "group", _X = "x", _Y = "y", INFO = "info",
            STATE = "state", IDLE = "idle", PROGGAMELEVEL = "Wegas.ProgGameLevel",
            RUN_BUTTON_LABEL = "<span class='proggame-play'></span>",
            STOP_BUTTON_LABEL = "<span class='proggame-stop'></span>",
            DEBUG_BUTTON_LABEL = "<span class='proggame-playpause'></span>",
            SMALLSTOP_BUTTON_LABEL = "<span class='proggame-stop-small'></span>",
            Wegas = Y.Wegas, ProgGameLevel;
    /**
     *  The level display class controls script input, ia, debugger and
     *  terrain display.
     */

    var showInfo = {}; //Is used to count how many times the player enters the same level 
    ProgGameLevel = Y.Base.create("wegas-proggame-level", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        // *** Fields *** //
        CONTENT_TEMPLATE: '<div>'
                + '<div class="proggame-title"><h1></h1><h2></h2><div class="proggame-help" title="Level information"></div>'
                + '<div class="proggame-level" title="Back to level selection"></div></div>'
                + '<div class="proggame-lefttab"></div>'
                + '<div class="proggame-view">'
                + '<div class="message"></div>'
                + '<div class="ui">'
                + '<div class="terrain-ui player-ui"></div>'
                + '<div class="terrain-ui enemy-ui"></div>'

                + '<div class="proggame-levelend" style="display:none">'
                + '<div class="proggame-levelend-star proggame-levelend-star-1"></div>'
                + '<div class="proggame-levelend-star proggame-levelend-star-2"></div>'
                + '<div class="proggame-levelend-star proggame-levelend-star-3"></div>'
                + '<div class="proggame-levelend-money">100</div>'
                + '<div class="proggame-levelend-restart">TRY AGAIN</div>'
                + '<div class="proggame-levelend-nextlevel">NEXT LEVEL</div>'
                + '</div>'

                + '<div class="terrain"></div>'
                + '</div>'
                + '<div class="movable">'
                + '<div class="movable2">'
                + '<div class="barre"></div>'
                + '<div class="proggame-buttons"></div>'
                + '<div class="proggame-debugger"></div>'
                + '<div class="code"></div>'
                + '</div>'
                + '</div>'
                + '</div>',
        // *** Lifecycle Methods *** //
        initializer: function () {
            this.handlers = {};
            this.currentBreakpointLine = -1;
            this.currentBreakpointStep = -1;
            this.watches = [];
        },
        renderUI: function () {
            var cb = this.get(CONTENTBOX),
                    label = this.get(LABEL).split("-");
            cb.one(".proggame-title h1").setHTML(label[0]); // Display level name
            cb.one(".proggame-title h2").setHTML(label[1]); // Display level name

            this.display = new Wegas.ProgGameDisplay(Y.mix(this.toObject(), {// Render canvas display widget
                plugins: []                                                  // @fixme here proggamedipslay parameters should be in a separate attr               
            }, true)).render(cb.one(".terrain"));
            this.editorTabView = new Y.TabView().render(cb.one(".code")); // Render the tabview for scripts
            this.mainEditorTab = this.addEditorTab("Main", this.get("defaultCode")); // Add the "Main" tabview, which containes the code that will be executed

            if (ProgGameLevel.main) {
                this.mainEditorTab.aceField.setValue(ProgGameLevel.main);
            }

            this.runButton = new Wegas.Button({//                               // Render run button
                cssClass: "proggame-runbutton",
                tooltip: "Run code (Shift+Enter)"
            }).render(cb.one(".proggame-buttons"));
            this.stopButton = new Wegas.Button({//                              // Render stop button
                label: SMALLSTOP_BUTTON_LABEL,
                visible: false,
                cssClass: "proggame-smallbutton"
            }).render(cb.one(".proggame-buttons"));
            this.renderDebugTabView(); // Render debug treeview
            this.renderApiTabView(); // Render api and files treeview
            this.resetUI(); // Reset the interface
   
                var resize = new Y.Resize({
                    node: '.movable',
                    handles: 't'
                });
                resize.on('resize:resize', function (event) {
                    this.mainEditorTab.aceField.editor.resize();
                }, this);
        
        },
        bindUI: function () {
            var cb = this.get(CONTENTBOX);
            this.runButton.on(CLICK, this.onRunClick, this); // Run button click event
            this.handlers.shiftEnter = Y.one("body").on("key", this.onRunClick, "enter+shift", this); // Shift + enter event 

            this.stopButton.on(CLICK, function () {
                this.set(STATE, IDLE);
            }, this);
            this.on("stateChange", function (e) {                                // State machine transitions implementation
                Y.log("stateChange(" + e.newVal + ")", INFO, PROGGAMELEVEL);
                if (e.newVal === e.prevVal) {
                    return;
                }
                switch (e.newVal) {
                    case "breaking":
                        this.runButton.set(LABEL, DEBUG_BUTTON_LABEL);
                        break;
                    case IDLE :
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
                        if (e.prevVal === IDLE) {
                            this.resetUI();
                        }
                        this.debug();
                        break;
                }
            });
            this.set(STATE, IDLE); // Game is in idle state by default

            if (this.get("intro") && !Y.one(".editor-preview") && typeof showInfo.count === 'undefined' && Wegas.Facade.Variable.script.localEval("Variable.find(gameModel,\"currentLevel\").getValue(self)") === Wegas.Facade.Variable.script.localEval("Variable.find(gameModel,\"maxLevel\").getValue(self)")) {
                this.showMessage(INFO, this.get("intro")); // Display introduction text at startup               
                showInfo.count = 0; //If the player enters this lvl for the first time, initiaze the variable
            }
            showInfo.count++; //After the first time, the info page will not bw shown

            cb.one(".proggame-help").on(CLICK, function () {                     // When help button is clicked,
                this.showMessage(INFO, this.get("intro")); // redisplay the introduction
            }, this);
            cb.one(".proggame-level").on(CLICK, function () {                    // When level button is clicked,
//                this.plug(Y.Plugin.OpenPageAction, {
//                    subpageId: 4,
//                    targetPageLoaderId: "maindisplayarea"
//                }); 
                this.plug(Y.Plugin.ExecuteScriptAction, {
                    onClick: {
                        "@class": "Script",
                        content: "Variable.find(gameModel, \"currentLevel\").setValue(self, 4)"
                    }
                });
            }, this);
            //this.plug(Y.Plugin.OpenPageAction, {//                              // Whenever level is finished,
            //    subpageId: 2,
            //    targetEvent: "gameWon",
            //    targetPageLoaderId: "maindisplayarea"                           // display the page 2 which shows the last level
            //});

            this.display.after('commandExecuted', this.consumeCommand, this); // When a command is executed, continue stack evaluation
            this.after('commandExecuted', this.consumeCommand, this); // idem

            this.idleHandler = Y.later(10000, this, this.doIdleAnimation, [], true); // While in idle mode, launch idle animation every 10 secs
            Y.later(100, this, this.doIdleAnimation);
            cb.delegate(CLICK, function () {                                     // End level screen: restart button
                this.doNextLevel(function () {
                    this.resetUI();
                    this.mainEditorTab.aceField.setValue(this.get("defaultCode"));
                    this.set(STATE, IDLE);
                }, true);
            }, ".proggame-levelend-restart", this);
            cb.delegate(CLICK, function () {                                     // End level screen: next level button:
                this.doNextLevel(function () {
                    this.mainEditorTab.aceField.setValue("");
                    this.fire("gameWon"); // trigger open page plugin
                }, false);
            }, ".proggame-levelend-nextlevel", this);
            //this.handlers.response = Wegas.Facade.Variable.after("update", this.syncUI, this); // If data changes, refresh
        },
        syncUI: function () {
            this.display.syncUI(); // Sync the canvas
            this.syncFrontUI(); // Sync the on screen display

            this.disableBreakpoint = Wegas.Facade.Variable.script.localEval("Variable.find(gameModel, \"inventory\").getProperty(self, \"debugger\") != \"true\"");
        },
        destructor: function () {
            ProgGameLevel.main = this.mainEditorTab.aceField.getValue(); // Save the actual edtion field to a static var

            this.display.destroy();
            this.runButton.destroy();
            this.stopButton.destroy();
            this.debugTabView.destroy();
            this.apiTabView.destroy();
            this.idleHandler.cancel();
            Y.Object.each(this.handlers, function (h) {
                h.detach();
            });
            this.editorTabView.destroy();
        },
        /**
         * Override to prevent the serialization of the openpage action we
         * created programatically.
         *
         * @returns {unresolved}
         */
        toJSON: function () {
            var ret = Wegas.Editable.prototype.toJSON.apply(this, arguments);
            ret.plugins = Y.Array.reject(ret.plugins || [], function (i) {
                return i.fn === "OpenPageAction";
            });
            return ret;
        },
        onRunClick: function (e) {                                               // On run button click,
            e.halt(true);
            if (this.get(STATE) === "run" || this.get(STATE) === "debugrun") {
                this.set(STATE, IDLE); // toggle between idle
            } else {
                this.set(STATE, "debugrun"); // and run mode
                //this.set(STATE, "run");
            }
        },
        run: function () {
            this.sendRunRequest(this.mainEditorTab.aceField.getValue());
        },
        debug: function () {
            var code = this.instrument(this.mainEditorTab.aceField.getValue()),
                    breakpoints = Y.Object.keys(this.mainEditorTab.aceField.editor.getSession().getBreakpoints());
            Y.log("Sending request: current step: " + this.currentBreakpointStep
                    + ", breakpoints: " + Y.JSON.stringify(breakpoints)
                    + "\ninstrumented code: \n" + code, INFO, PROGGAMELEVEL);
            this.sendRunRequest(code, {
                debug: true,
                watches: this.watches, //                                       // Watched values
                breakpoints: breakpoints, // //                                 // breakpoints
                startStep: this.currentBreakpointStep                           // The running step reached during last evaluation
            });
        },
        reRun: function () {
            Y.log("reRun()", INFO, PROGGAMELEVEL);
            var code = this.instrument(this.mainEditorTab.aceField.getValue()), // Fetch instrumented code
                    breakpoints = Y.Object.keys(this.mainEditorTab.aceField.editor.getSession().getBreakpoints()); // and breakpoints

            Y.log("instrumented code: " + code + ", current step: " + this.currentBreakpointStep + ", breakpoints: " + Y.JSON.stringify(breakpoints), INFO, PROGGAMELEVEL);
            this.sendRunRequest(code, {//                                       // Run instrumented code on the server
                debug: true,
                watches: this.watches, //                                       // Watched values
                breakpoints: breakpoints, //                                    // breakpoints
                startStep: this.currentBreakpointStep - 1,
                targetStep: this.currentBreakpointStep
            });
        },
        instrument: function (code) {
            return Wegas.JSInstrument.instrument(code); // return instrumented value of the code
        },
        sendRunRequest: function (code, interpreterCfg) {
            interpreterCfg = interpreterCfg || {};
            Wegas.Facade.Variable.sendRequest({
                request: "/ProgGame/Run/" + Wegas.Facade.Game.get('currentPlayerId'),
                cfg: {
                    method: "POST",
                    data: "run("
                            + "function (name) {with(this) {" + code + "\n}}, "     // Player's code
                            + Y.JSON.stringify(this.toObject()) + ", "              // the current level
                            + Y.JSON.stringify(interpreterCfg) + ");"
                },
                on: {
                    success: Y.bind(this.onServerReply, this),
                    failure: Y.bind(function () {
                        this.set(STATE, IDLE);
                        alert("Your script contains an error.");
                    }, this)
                }
            });
        },
        resetUI: function () {
            Y.log("resetUI()", INFO, "Wegas.ProgGameDisplay");
            this.commandsStack = null;
            this.display.execute({//                                            // Reset the display to default
                type: 'resetLevel',
                objects: Y.clone(this.get("objects"))
            });
            this.debugTabView.item(0).get("panelNode").setContent(""); // Empty log tab

            this.get(CONTENTBOX).one(".proggame-levelend").hide();
            this.get(CONTENTBOX).one(".terrain").show;
            this.syncFrontUI();
        },
        onServerReply: function (e) {
            Y.log("onServerReply(" + e.response.entity + ")", INFO, PROGGAMELEVEL);
            this.commandsStack = Y.JSON.parse(e.response.entity);
            this.consumeCommand();
        },
        findObject: function (id) {
            return Y.Array.find(this.get("objects"), function (o) {
                return o.id === id;
            });
        },
        doIdleAnimation: function () {
            var texts = this.get("invites");
            if (texts.length === 0) {
                texts = ["HELP! HELP!!! SOMEBODY HERE? PLEASE HELP ME!",
                    "PLEASE HELP ME!", "WHY ME? TELL ME WHY?", "WOULD ANYBODY BE KIND ENOUGH AS TO GET ME OUT OF HERE?"];
            }

            if (this.get(STATE) === IDLE) {
                var enemy = this.display.getEntity("Enemy");
                enemy.say(texts[Math.floor(Math.random() * texts.length)], 3500, false, true);
                enemy.wave(7);
            }
        },
        doLevelEndAnimation: function () {
            var cb = this.get(CONTENTBOX), counter = 0, money = 100,
                    timer = Y.later(20, this, function () {
                        cb.one(".proggame-levelend-money").setContent(counter);
                        counter++;
                        if (counter > money) {
                            timer.cancel();
                        }
                    }, null, true);
            cb.one(".proggame-levelend").show();
            cb.one(".terrain").hide();
            cb.all(".proggame-levelend-staractive").removeClass("proggame-levelend-staractive");
            Y.later(500, this, function () {
                cb.one(".proggame-levelend-star-1").addClass("proggame-levelend-staractive");
            });
            Y.later(1000, this, function () {
                cb.one(".proggame-levelend-star-2").addClass("proggame-levelend-staractive");
            });
            Y.later(1500, this, function () {
                cb.one(".proggame-levelend-star-3").addClass("proggame-levelend-staractive");
            });
        },
        consumeCommand: function () {
            if (this.commandsStack && this.commandsStack.length > 0) {
                var command = this.commandsStack.shift();
                //Y.log("consumeCommand" + ", " + command.type + ", " + command);
                switch (command.type) {
                    case "updated":
                        Y.mix(this.findObject(command.object.id),
                                command.object, true); // Update target object cfg
                        this.syncFrontUI();
                        this.consumeCommand();
                        break;
                    case "gameWon":
                        Y.later(2500, this, function () {                        // After shake hands animation is over,
                            this.doLevelEndAnimation(); // display level end screen
                        });
                        break;
                    case "log":
                        this.debugTabView.item(0).get("panelNode").append(command.text + "<br />");
                        Y.later(100, this, this.consumeCommand);
                        break;
                    case "line":
                        this.setCurrentLine(command.line);
                        this.consumeCommand();
                        break;
                    case "breakpoint":
                        Y.log("Breakpoint reached at line: " + command.line + ", step: " + command.step, INFO, PROGGAMELEVEL);
                        this.mainEditorTab.set("selected", 1);
                        if (command.line !== this.currentBreakpointLine) {      // May occur on rerun
                            this.setCurrentLine(command.line);
                        }
                        this.currentBreakpointLine = command.line;
                        this.currentBreakpointStep = command.step;
                        this.updateDebugTreeview(command.scope);
                        this.set(STATE, "breaking");
                        break;
                    default:
                        break;
                }

                this.display.execute(command); // Forward the command to the display

            } else if (this.commandsStack) {
                this.set(STATE, IDLE);
            }
        },
        setCurrentLine: function (line) {
            var session = this.mainEditorTab.aceField.session;
            if (this.marker) {
                session.removeGutterDecoration(this.cLine, "proggame-currentgutterline");
                session.removeMarker(this.marker);
                this.marker = null;
            }
            if (line) {
                this.cLine = line;
                var Range = require('ace/range').Range;
                this.marker = session.addMarker(new Range(line, 0, line, 200), "proggame-currentline", TEXT);
                session.addGutterDecoration(line, "proggame-currentgutterline");
            }
        },
        doNextLevel: function (fn, retry) {
            var content;
            if (Wegas.Facade.Variable.script.localEval("Variable.find(gameModel,\"currentLevel\").getValue(self)") < Wegas.Facade.Variable.script.localEval("Variable.find(gameModel,\"maxLevel\").getValue(self)")) {
                content = this.get("onWin") + ";Variable.find(gameModel, \"money\").add(self, 0);"; //player don't win points if he already did the lvl
            } else {
                content = this.get("onWin") + ";Variable.find(gameModel, \"money\").add(self, 100);";
                delete showInfo.count; //reset the count for the next lvl
            }
            content += "maxLevel.value = Math.max(maxLevel.value, currentLevel.value);";
            if (retry) {
                content += 'Variable.find(gameModel, "currentLevel").setValue(self, ' + this.get("root").get("@pageId") + ')';
            }
            Wegas.Facade.Variable.script.run(content, {
                on: {
                    success: Y.bind(fn, this)
                }
            });
        },
        addEditorTab: function (label, code, file) {
            var _file = file,
                    saveTimer = new Wegas.Timer(),
                    tab = this.editorTabView.add({//                                // Render tab
                        label: label
                    }).item(0),
                    aceField = new Y.inputEx.AceField({//                           // Render ace editor
                        parentEl: tab.get("panelNode"),
                        name: TEXT,
                        type: ACE,
                        height: "85%",
                        language: "javascript",
                        theme: "twilight",
                        value: code
                    });
            tab.set("selected", 1);
            tab.aceField = aceField; // Set up a reference to the ace field
            tab.saveTimer = saveTimer;
            tab.before("destroy", function () {
                this.aceField.destroy();
                this.saveTimer.destroy();
            });
            aceField.session.on("change", Y.bind(function () {                   // Every time the code is changed is entered
                if (this.get(STATE) === "breaking") {                           // stop debug session
                    this.set(STATE, IDLE);
                }
                saveTimer.reset();
            }, this));
            if (_file) {                                                        // If there is a file (i.e. not in the main tab)
                saveTimer.on("timeOut", function () {                            // Every time save teim time outs,
                    _file.set("body", aceField.getValue());
                    Wegas.Facade.Variable.sendRequest({//             // Save the file
                        request: "/Inbox/Message/" + _file.get(ID),
                        cfg: {
                            updateCache: false,
                            method: "PUT",
                            data: _file
                        }
                    });
                });
            }

            aceField.editor.on("guttermousedown", Y.bind(function (e) {          // Add breakpoints on gutter click
                if (e.domEvent.target.className.indexOf("ace_gutter-cell") === -1
                        || this.disableBreakpoint) {                                // Check if breakpoint has been bought from the shop
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
            return tab;
        },
        renderDebugTabView: function () {
            this.debugTabView = new Y.TabView({//                               // Render the tabview for logs and watches treeview
                children: [{
                        label: "Log"
                    }, {
                        label: "Watches",
                        plugins: [{
                                fn: "ConditionalDisable",
                                cfg: {
                                    condition: {
                                        "@class": "Script",
                                        content: "Variable.find(gameModel, \"inventory\").getProperty(self, \"watches\") != \"true\"",
                                        language: "JavaScript"
                                    }
                                }
                            }],
                        children: [{
                                type: "Button",
                                label: "Add watch",
                                on: {
                                    click: Y.bind(function () {
                                        var watch = prompt("Expression");
                                        this.watches.push(watch);
                                        if (this.get(STATE) === "breaking") {   // If an evaluation is on going
                                            this.reRun(); // rerun script until current step to get new
                                        } else {
                                            this.variableTreeView.add({
                                                label: watch + ": null",
                                                iconCSS: ""
                                            });
                                        }
                                    }, this)
                                }
                            }, {//                                              // Watches treeview
                                type: "TreeView"
                            }]
                    }]
            }).render(this.get(CONTENTBOX).one(".proggame-debugger"));
            this.variableTreeView = this.debugTabView.item(1).witem(1);
            this.updateDebugTreeview({});
        },
        renderApiTabView: function () {
            var node, packages = {};
            Y.Array.each(this.get("api"), function (i) {                         // Map api to a treeview structure
                node = ProgGameLevel.API[i] || {
                    label: i + "()"
                };
                node.data = i;
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
            if (Wegas.Facade.Variable.script.localEval("Variable.find(gameModel, \"inventory\").getProperty(self, \"fileLibrary\") === \"true\"")) {
                packages.indlude = ProgGameLevel.API.include;
            }

            this.apiTabView = new Y.TabView({//                                 // Render the tabview for files and api
                children: [{
                        label: "API",
                        children: [{
                                type: "TreeViewWidget",
                                cssClass: "proggame-api",
                                children: Y.Object.values(packages)
                            }]
                    }, {
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
                                        content: "Variable.find(gameModel, \"inventory\").getProperty(self, \"filelibrary\") != \"true\"",
                                        language: "JavaScript"
                                    }
                                }
                            }]
                    }]
            }).render(this.get(CONTENTBOX).one(".proggame-lefttab"));
            this.apiTabView.item(0).witem(0).on("treeleaf:click", function (e) { // When api is clicked, insert function in editor
                var toInsert = e.target.get("data");
                this.editorTabView.get("selection").aceField.editor.insert(toInsert + "();\n");
                e.halt(true);
            }, this);
            this.apiTabView.item(1).witem(0).on("openFile", function (e) {       // Every time a file is opened,
                var tab;
                this.editorTabView.each(function (t) {
                    if (t.get(LABEL) === e.file.get("subject")) {
                        tab = t;
                    }
                });
                if (tab) {                                                      // If the file is already opened,
                    tab.set("selected", 1); // display it.
                } else {                                                        // Otherwise,
                    Wegas.Facade.Variable.sendRequest({// retrieve the file content from the server
                        request: "/Inbox/Message/" + e.file.get(ID) + "?view=Extended",
                        cfg: {
                            updateCache: false
                        },
                        on: {
                            success: Y.bind(function (e) {
                                var file = e.response.entity,
                                        tab = this.addEditorTab(file.get("subject"), file.get("body"), file); // and display it in a new tab
                                tab.plug(Y.Plugin.Removeable);
                            }, this)
                        }
                    });
                }
            }, this);
        },
        updateDebugTreeview: function (object) {
            var watches = {};
            Y.Array.each(this.watches, function (i) {                            // Set default value to undefined
                watches[i] = undefined;
            });
            Y.mix(watches, object, true);
            function genItems(o, label) {
                if (Y.Lang.isObject(o)) {
                    var children = [];
                    Y.Object.each(o, function (o, key) {
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
                        label: label + ": Array[" + o.length + "]",
                        children: Y.Array.map(o, genItems),
                        iconCSS: ""
                    };
                } else {
                    return {
                        label: label + ": " + o,
                        iconCSS: ""
                    };
                }
            }
            watches = genItems(watches).children; // Generate tree items and remove level 0 (do not show a tree node for the context)

            //Y.Array.each(watches, function(i) {                               // First level nodes are editables
            //    i.editable = false;
            //});
            this.variableTreeView.destroyAll(); // Update treeview (set("children", items) does not seem to work)
            this.variableTreeView.add(watches);
        },
        /*
         * @override
         */
        showMessage: function (level, message) {
            var panel = this.getPanel({
                content: "<div>" + message + "</div><button class='yui3-button proggame-button'>Continuer</button>"
            });
            Y.later(50, this, function () {                                      // Hide panel anywhere user clicks
                Y.one("body").once(CLICK, function () {
                    panel.destroy();
                    this.show();
                    if ("" + this.get("root").get("@pageId") === "11") {
                        this.showTutorial();
                    }
                }, this);
            });
        },
        getPanel: function (cfg) {
            var panel = new Wegas.Panel(Y.mix(cfg, {
                modal: true,
                centered: false,
                x: 100,
                y: 85,
                zIndex: 1000,
                width: "962px",
                height: 709,
                buttons: {}
            })).render();
            this.hide();
            panel.get("boundingBox").addClass("proggame-panel");
            return panel;
        },
        showTutorial: function () {
            var panel = new Wegas.Panel({
                modal: true,
                centered: false,
                zIndex: 1000,
                buttons: {}
            }).render();
            panel.get("boundingBox").addClass("proggame-tutorial");
            Y.one(".yui3-widget-mask").setStyle("opacity", 0.3);
            Y.one("body").append("<div class='proggame-tuto-transparentmask'></div>");
            this.currentTutoPanel = 0;
            this.panel = panel;
            this.showNextTutorialPanel();
        },
        showNextTutorialPanel: function () {
            var cfg = ProgGameLevel.TUTORIAL[this.currentTutoPanel];
            this.panel.setAttrs(cfg);
            Y.all(cfg.highlight).addClass("proggame-tuto-highlight");
            Y.one("body").once(CLICK, function () {                              // Anywhere user clicks,
                Y.all(cfg.highlight).removeClass("proggame-tuto-highlight"); // Remove current highlight
                this.currentTutoPanel += 1;
                if (this.currentTutoPanel === ProgGameLevel.TUTORIAL.length) {  // If there are no more panels to display,
                    Y.all(".proggame-tuto-transparentmask").remove(true); // remove panel
                    Y.one(".yui3-widget-mask").setStyle("opacity", 0);
                    this.panel.destroy();
                } else {
                    this.showNextTutorialPanel(); // Otherwise show next panel
                }
            }, this);
        },
        syncFrontUI: function () {
            var cb = this.get(CONTENTBOX);
            if (this.findObject("Player")) {
                this.updateUI(this.findObject("Player"), cb.one(".player-ui"));
            }
            if (this.findObject("Enemy")) {
                this.updateUI(this.findObject("Enemy"), cb.one(".enemy-ui"));
            }
        },
        updateUI: function (object, el) {
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
    }, {
        ATTRS: {
            intro: {
                type: STRING,
                format: "html",
                optional: true,
                _inputex: {
                    label: "Intro text"
                }
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
                    _type: "proggamemap"
                }
            },
            objects: {
                type: ARRAY,
                _inputex: {
                    sortable: true,
                    elementType: {
                        type: "contextgroup",
                        contextKey: "components",
                        fields: [{
                                name: "Trap",
                                type: GROUP,
                                fields: [{
                                        name: ID,
                                        label: "ID",
                                        value: "Trap"
                                    }, {
                                        name: _X,
                                        type: NUMBER,
                                        label: _X
                                    }, {
                                        name: _Y,
                                        type: NUMBER,
                                        label: _Y
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
                                type: GROUP,
                                fields: [{
                                        name: ID,
                                        label: "ID",
                                        value: "Player"
                                    }, {
                                        name: _X,
                                        type: NUMBER,
                                        label: _X
                                    }, {
                                        name: _Y,
                                        type: NUMBER,
                                        label: _Y
                                    }, {
                                        name: "direction",
                                        label: "direction",
                                        type: "select",
                                        choices: [
                                            {value: 2, label: "right"},
                                            {value: 1, label: "down"},
                                            {value: 3, label: "up"},
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
                                type: GROUP,
                                fields: [{
                                        name: ID,
                                        label: "ID",
                                        value: "Enemy"
                                    }, {
                                        name: _X,
                                        type: NUMBER,
                                        label: _X
                                    }, {
                                        name: _Y,
                                        type: NUMBER,
                                        label: _Y
                                    }, {
                                        name: "direction",
                                        label: "direction",
                                        type: "select",
                                        choices: [{value: 1, label: "down"},
                                            {value: 2, label: "right"},
                                            {value: 3, label: "up"},
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
                                type: GROUP,
                                fields: [{
                                        name: ID,
                                        label: "ID",
                                        value: "Panel"
                                    }, {
                                        name: "value",
                                        label: "Value",
                                        type: TEXT,
                                        value: "'Hello World !'"
                                    }, {
                                        name: _X,
                                        type: NUMBER,
                                        label: _X
                                    }, {
                                        name: _Y,
                                        type: NUMBER,
                                        label: _Y
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
                                type: GROUP,
                                fields: [{
                                        name: ID,
                                        label: "ID",
                                        value: "Door"
                                    }, {
                                        name: _X,
                                        type: NUMBER,
                                        label: _X
                                    }, {
                                        name: _Y,
                                        type: NUMBER,
                                        label: _Y
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
                                type: GROUP,
                                fields: [{
                                        name: ID,
                                        label: "ID",
                                        value: "Controller"
                                    }, {
                                        name: _X,
                                        type: NUMBER,
                                        label: _X
                                    }, {
                                        name: _Y,
                                        type: NUMBER,
                                        label: _Y
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
                value: []
            },
            winningCondition: {
                type: STRING,
                value: "comparePos(find('Player'), find('Enemy'))",
                _inputex: {
                    _type: ACE
                }
            },
            onStart: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: ACE
                }
            },
            onAction: {
                type: STRING,
                format: TEXT,
                optional: true,
                _inputex: {
                    _type: ACE
                }
            },
            onWin: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: ACE
                }
            },
            defaultCode: {
                type: STRING,
                optional: true,
                value: "//Put your code here...\n",
                _inputex: {
                    label: "Player's starting code",
                    _type: ACE
                }
            },
            invites: {
                type: ARRAY,
                value: []
            },
            maxTurns: {
                type: STRING,
                value: 1,
                _inputex: {
                    label: "Max turns",
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            }
            //arguments: {
            //    type: ARRAY,
            //    value: []
            //}
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
                label: "PI:Number"
            },
            "Math.floor": {
                label: "floor():Number",
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
                label: "round(x:Number):Number",
                tooltip: "Math.round(x:Number):Number\n\n"
                        + "If the fractional portion of number is .5 or greater, the argument is rounded to the next higher integer. If the fractional portion of number is less than .5, the argument is rounded to the next lower integer.\n"
                        + "Because round is a static method of Math, you always use it as Math.round(), rather than as a method of a Math object you created.\n\n"
                        //+ "The Math.round() function returns the value of a number rounded to the nearest integer.\n\n"
                        + "Parameters\n"
                        + "x:Number - The number you want to round\n"
                        + "Returns\n"
                        + "Number - the value of x rounded to the nearest integer"
            },
            include: {
                label: "include(name:String)",
                tooltip: "include(name:String)\n\n"
                        + "Allows to include a file from your file library. This way you can reuse your code multiple times."
            }
        },
        TUTORIAL: [{
                height: 105,
                width: 460,
                x: 402,
                y: 390,
                highlight: ".code",
                bodyContent: "<div class='proggame-tuto-arrowbottom' style='float: left;'></div><div>L'éditeur de code vous permet de contrôler votre avatar.<br /><br /></div><button class='yui3-button proggame-button'>Continuer</button>"
            }, {
                height: 110,
                width: 460,
                x: 462,
                y: 550,
                highlight: ".proggame-buttons",
                bodyContent: "<div class='proggame-tuto-arrowright'></div><div>Pour exécuter votre code, cliquez sur la flèche verte.<br /><br /></div><button class='yui3-button proggame-button'>Continuer</button>"
            }, {
                height: 105,
                width: 460,
                x: 550,
                y: 320,
//                highlight: ".yui3-resize-handle yui3-resize-handle-t",
                bodyContent: "<div class='proggame-tuto-arrowbottom' style='float: left;'></div><div>L'éditeur de code peut être agrandi en tirant sur cette barre<br /><br /></div><button class='yui3-button proggame-button'>Continuer</button>"
            },
            {
                height: 115,
                width: 600,
                x: 212,
                y: 230,
                highlight: ".proggame-lefttab",
                bodyContent: "<div class='proggame-tuto-arrowleft'></div><div>Vous pouvez ajouter des instructions en cliquant directement dessus dans l'<b>API</b> (Application Programming Interface).<br /><br /></div><button class='yui3-button proggame-button'>Continuer</button>"
            }, {
                height: 115,
                width: 340,
                x: 256,
                y: 87,
                highlight: ".proggame-help",
                bodyContent: "<div class='proggame-tuto-arrowleft'></div><div>Pour revoir les objectifs du niveau, cliquez sur le bouton <b>Information</b>.<br /><br /></div><button class='yui3-button proggame-button'>Continuer</button>"
            }, {
                height: 190,
                width: 360,
                x: 613,
                y: 54,
                highlight: ".proggame-button-courses",
                bodyContent: "<div class='proggame-tuto-arrowtop'></div><div>Vous recevez la théorie nécessaire pour chaque niveau dans la partie théorie.<br /><br /></div><button class='yui3-button proggame-button'>Continuer</button>"
            }, {
                height: 190,
                width: 360,
                x: 808,
                y: 54,
                highlight: ".proggame-button-shop",
                bodyContent: "<div class='proggame-tuto-arrowtop'></div><div>Vous pouvez rejouer les anciens niveaux en cliquant sur la carte<br /><br /></div><button class='yui3-button proggame-button'>Continuer</button>"
            }]
    });
    Wegas.ProgGameLevel = ProgGameLevel;
});
