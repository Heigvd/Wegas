/// <reference lib="dom"/>
/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global ace */
/**
 * @typedef SourceLocation
 * @property {{line: number, column:number}} start
 * @property {{line: number, column:number}} end
 */
YUI.add('pact-level', function(Y) {
    'use strict';
    var CONTENTBOX = 'contentBox',
        HIDDEN = 'hidden',
        ARRAY = 'array',
        NUMBER = 'number',
        STRING = 'string',
        TEXT = 'text',
        CLICK = 'click',
        ID = 'id',
        LABEL = 'label',
        INFO = 'info',
        STATE = 'state',
        IDLE = 'idle',
        PROGGAMELEVEL = 'Wegas.ProgGameLevel',
        RUN_BUTTON_LABEL = "<span class='proggame-play'></span>",
        STOP_BUTTON_LABEL = "<span class='proggame-stop'></span>",
        DEBUG_BUTTON_LABEL = "<span class='proggame-playpause'></span>",
        SMALLSTOP_BUTTON_LABEL = "<span class='proggame-stop-small'></span>",
        HISTORY_INBOX = 'history',
        COUNTERS_OBJECT = 'counters',
        CURRENT_LEVEL = 'currentLevel',
        MAX_LEVEL = 'maxLevel',
        LEVEL_LIMIT = 'levelLimit',
        LEVEL_LIMIT_REACHED =
            "Il faut attendre l'autorisation d'aller plus loin dans le jeu.",
        Wegas = Y.Wegas,
        Promise = Y.Promise,
        ProgGameLevel,
        currentLevel;
    /**
     * Serialize a function and executs it on the server.
     * Batching all calls made in the same loop.
     * In case of an error, everything fails.
     *
     * @see Y.Wegas.Facade.Variable.script.serializeFn
     * @template Arguments
     * @template ReturnValue
     * @param {(...args:Arguments[]) => ReturnValue} fn function to execute on server
     * @param {...Arguments} _args additional arguments passed to the function
     * @returns {PromiseLike<ReturnValue>} server return value;
     */
    var batchRemoteCall = (function() {
        // Private vars
        var calls = [];
        var cbs = [];
        var errorCbs = [];
        var to = null;

        return function batch(fn, _args) {
            var args = arguments;
            return new Promise(function(resolve, reject) {
                calls.push(
                    Y.Wegas.Facade.Variable.script.serializeFn.apply(null, args)
                );
                cbs.push(resolve);
                errorCbs.push(reject);
                clearTimeout(to);
                to = setTimeout(function() {
                    var newCalls = calls;
                    calls = [];
                    var newCbs = cbs;
                    cbs = [];
                    var newErrorCbs = errorCbs;
                    errorCbs = [];
                    Y.Wegas.Facade.Variable.script.remoteEval(
                        '[' + newCalls.join(',') + ']',
                        {
                            on: {
                                success: function(res) {
                                    newCbs.forEach(function(cb, i) {
                                        cb(res.response.entities[i]);
                                    });
                                },
                                failure: function(res) {
                                    newErrorCbs.forEach(function(cb) {
                                        cb(res.response.results.events);
                                    });
                                },
                            },
                        }
                    );
                }, 0);
            });
        };
    })();
    /**
     * Create a webworker with simulation code.
     */
    function createRunner() {
        return new Worker('wegas-pact/js/worker.js');
    }
    /**
     * @param {any} obj
     */
    function isEmptyObj(obj) {
        if (obj == null) return true;
        if (typeof obj !== 'object') return false;
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) return false;
        }
        return true; // [] {}
    }
    /**
     *  The level display class controls script input, ia, debugger and
     *  terrain display.
     */
    ProgGameLevel = Y.Base.create(
        'pact-level',
        Y.Widget,
        [Y.WidgetChild, Wegas.Widget, Wegas.Editable],
        {
            // *** Fields *** //
            CONTENT_TEMPLATE:
                '<div class="flex row">' +
                '    <div class="flex column">' +
                '        <div class="proggame-title">' +
                '            <h1></h1>' +
                '            <h2></h2>' +
                '            <span' +
                '                class="proggame-help fa fa-info-circle fa-2x"' +
                '                title="Level information"' +
                '            ></span>' +
                '        </div>' +
                '        <div class="proggame-lefttab pact-panel"></div>' +
                '    </div>' +
                '    <div class="proggame-view flex column grow">' +
                '        <div class="proggame-levelend" style="display:none">' +
                '            <div class="flex row">' +
                '                <div class="proggame-levelend-star proggame-levelend-star-1"></div>' +
                '                <div class="proggame-levelend-star proggame-levelend-star-2"></div>' +
                '                <div class="proggame-levelend-star proggame-levelend-star-3"></div>' +
                '            </div>' +
                '            <div class="flex row">' +
                '                <div class="proggame-levelend-restart">TRY AGAIN</div>' +
                '                <div class="proggame-levelend-nextlevel">NEXT LEVEL</div>' +
                '            </div>' +
                '        </div>' +
                '        <div class="play flex column grow">' +
                '            <div class="terrain"></div>' +
                // '            <div class="barre"></div>' +
                '            <div class="editor flex row grow">' +
                '                <div class="code grow pact-panel"></div>' +
                '                <div class="proggame-buttons"></div>' +
                '                <div class="proggame-debugger pact-panel"></div>' +
                '            </div>' +
                '        </div>' +
                '    </div>' +
                '</div>',

            getInstance: function(name) {
                var v = Y.Wegas.Facade.Variable.cache.find('name', name);
                if (!v) {
                    alert(
                        'Erreur interne: la variable "' +
                            name +
                            '" n\'existe pas'
                    );
                    return null;
                } else {
                    return v.getInstance();
                }
            },

            // *** Lifecycle Methods *** //
            /**
             * @constructor
             */
            initializer: function() {
                this.handlers = [];
                this.currentBreakpointLine = -1;
                this.currentBreakpointStep = -1;
                this.watches = [];
                // New activity tracking variables:
                this.previousCode = ProgGameLevel.previousCode || '';
                this.currentCode = '';
                this.feedback = '';
                this.isModifiedCode = false;
                this.isRuntimeException = false;
                this.isSuccessful = false;
                this.runner = createRunner();
                // New persistent tracking variables:
                this.history = this.getInstance(HISTORY_INBOX);
                this.counters =
                    this.getInstance(COUNTERS_OBJECT).get('properties') || null;
            },
            renderUI: function() {
                var cb = this.get(CONTENTBOX),
                    label = this.get(LABEL).split('-');
                cb.one('.proggame-title h1').setHTML(label[0]); // Display level name
                cb.one('.proggame-title h2').setHTML(label[1]); // Display level name
                this.display = new Wegas.ProgGameDisplay(
                    Y.mix(
                        this.toObject(),
                        {
                            // Render canvas display widget
                            plugins: [], // @fixme here proggamedipslay parameters should be in a separate attr
                        },
                        true
                    )
                ).render(cb.one('.terrain'));
                this.editorTabView = new Y.TabView().render(cb.one('.code')); // Render the tabview for scripts
                var defaultCode = this.get('defaultCode');
                this.mainEditorTab = this.addEditorTab(
                    'Code',
                    defaultCode + (defaultCode.length === 0 || defaultCode.charAt(defaultCode.length-1) === "\n" ? '' : "\n")
                );
                var ace = this.editorTabView
                    .get('selection')
                    .aceField;
                // Set insertion point after the default text, i.e. at the end of the code:
                ace.navigateFileEnd();
                ace.focus();
                Y.later(0, this, function() {
                    ace.clearSelection();
                });
                // Add the "Main" tabview, which containes the code that will be executed
                if (ProgGameLevel.main) {
                    this.mainEditorTab.aceField.setValue(ProgGameLevel.main);
                }

                this.runButton = new Wegas.Button({
                    //                               // Render run button
                    cssClass: 'proggame-runbutton',
                    tooltip: 'Run code (Shift+Enter)',
                }).render(cb.one('.proggame-buttons'));
                this.stopButton = new Wegas.Button({
                    //                              // Render stop button
                    label: SMALLSTOP_BUTTON_LABEL,
                    visible: false,
                    cssClass: 'proggame-smallbutton',
                }).render(cb.one('.proggame-buttons'));
                this.renderDebugTabView(); // Render debug treeview
                this.renderApiTabView(); // Render api and files treeview
                this.resetUI(); // Reset the interface

                // var resize = new Y.Resize({
                //     node: '.movable',
                //     handles: 't',
                // });
                // resize.plug(Y.Plugin.ResizeConstrained, {
                //     minHeight: 250,
                //     maxHeight: 450,
                // });
                // resize.on(
                //     'resize:resize',
                //     function() {
                //         this.mainEditorTab.aceField.editor.resize();
                //     },
                //     this
                // );
                // this._resizeHandle = resize;
            },
            bindUI: function() {
                var cb = this.get(CONTENTBOX),
                    scriptFacade = Wegas.Facade.Variable.script;
                this.runButton.on(CLICK, this.onRunClick, this); // Run button click event
                this.handlers.push(
                    Y.one('body').on(
                        'key',
                        this.onRunClick,
                        'enter+shift',
                        this
                    )
                ); // Shift + enter event

                this.stopButton.on(
                    CLICK,
                    function() {
                        this.set(STATE, IDLE);
                    },
                    this
                );
                this.on('stateChange', function(e) {
                    // State machine transitions implementation
                    Y.log('stateChange(' + e.newVal + ')', INFO, PROGGAMELEVEL);
                    if (e.newVal === e.prevVal) {
                        return;
                    }
                    switch (e.newVal) {
                        case 'breaking':
                            this.runButton.set(LABEL, DEBUG_BUTTON_LABEL);
                            break;
                        case IDLE:
                            this.runButton.set(LABEL, RUN_BUTTON_LABEL);
                            this.commandsStack = null;
                            this.highlight(null);
                            this.currentBreakpointLine = -1;
                            this.currentBreakpointStep = -1;
                            break;
                        case 'run':
                            this.runButton.set(LABEL, STOP_BUTTON_LABEL);
                            this.resetUI();
                            this.run();
                            break;
                        case 'debugrun':
                            this.runButton.set(LABEL, STOP_BUTTON_LABEL);
                            if (e.prevVal === IDLE) {
                                this.resetUI();
                            }
                            this.debug();
                            break;
                    }
                });
                this.set(STATE, IDLE); // Game is in idle state by default

                if (
                    this.get('intro') &&
                    currentLevel !==
                        scriptFacade.localEval(
                            'Variable.find(gameModel,"currentLevel").getValue(self)'
                        ) &&
                    scriptFacade.localEval(
                        'Variable.find(gameModel,"currentLevel").getValue(self)'
                    ) ===
                        scriptFacade.localEval(
                            'Variable.find(gameModel,"maxLevel").getValue(self)'
                        )
                ) {
                    this.showMessage(INFO, this.get('intro')); // Display introduction text at startup
                }
                currentLevel = scriptFacade.localEval(
                    'Variable.find(gameModel,"currentLevel").getValue(self)'
                );
                this.initCounters();

                this.handlers.push(
                    cb.one('.proggame-help').on(
                        CLICK,
                        function() {
                            // When help button is clicked,
                            this.showMessage(INFO, this.get('intro')); // redisplay the introduction
                        },
                        this
                    )
                );

                this.display.after(
                    'commandExecuted',
                    this.consumeCommand,
                    this
                ); // When a command is executed, continue stack evaluation
                //this.after('commandExecuted', this.consumeCommand, this); // idem

                this.idleHandler = Y.later(
                    10000,
                    this,
                    this.doIdleAnimation,
                    [],
                    true
                ); // While in idle mode, launch idle animation every 10 secs
                cb.delegate(
                    CLICK,
                    function() {
                        // End level screen: restart button
                        this.resetUI();
                        this.set(STATE, IDLE);
                    },
                    '.proggame-levelend-restart',
                    this
                );
                cb.delegate(
                    CLICK,
                    function() {
                        var levelLimit = scriptFacade.localEval(
                            'Variable.find(gameModel, "' +
                                LEVEL_LIMIT +
                                '").getValue(self)'
                        );

                        if (currentLevel >= levelLimit) {
                            alert(LEVEL_LIMIT_REACHED);
                            // Y.Wegas.Alerts.showNotification(LEVEL_LIMIT_REACHED, { iconCss: 'fa fa-clock' });
                        } else {
                            // End level screen: next level button:
                            this.doNextLevel(
                                function() {
                                    this.mainEditorTab.aceField.setValue('');
                                    this.previousCode = '';
                                    this.fire('gameWon'); // trigger open page plugin
                                }.bind(this)
                            );
                        }
                    },
                    '.proggame-levelend-nextlevel',
                    this
                );
                //            this.handlers.response = Wegas.Facade.Variable.after("update", this.syncUI, this); // If data changes, refresh
            },
            syncUI: function() {
                this.display.syncUI(); // Sync the canvas

                this.disableBreakpoint = Wegas.Facade.Variable.script.localEval(
                    'Variable.find(gameModel, "inventory").getProperty(self, "debugger") != "true"'
                );
            },
            destructor: function() {
                ProgGameLevel.main = this.mainEditorTab.aceField.getValue(); // Save the actual edtion field to a static var
                ProgGameLevel.previousCode = this.previousCode;
                // this._resizeHandle.destroy();
                this.display.destroy();
                this.runButton.destroy();
                this.stopButton.destroy();
                this.debugTabView.destroy();
                this.apiTabView.destroy();
                this.idleHandler && this.idleHandler.cancel();
                Y.Array.each(this.handlers, function(h) {
                    h.detach();
                });
                this.editorTabView.destroy();
                this.runner.terminate();
            },
            initCounters: function() {
                if (
                    isEmptyObj(this.counters) ||
                    isEmptyObj(this.counters[currentLevel])
                ) {
                    this.counters[currentLevel] = {
                        submissions: 0,
                        successful: 0,
                        incomplete: 0,
                        exceptions: 0,
                    };
                }
                for (var key in this.counters) {
                    if (typeof this.counters[key] === 'string') {
                        this.counters[key] = JSON.parse(this.counters[key]);
                    }
                }

                return this.counters[currentLevel];
            },
            // Returns the highest level where the player has submitted some code at least once
            getHighestAttemptedLevel: function() {
                var len = this.counters.length;
                if (len === 1) return currentLevel;
                var max = currentLevel;
                for (var key in this.counters) {
                    if (key > max && this.counters[key].submissions !== 0) {
                        max = key;
                    }
                }
                return max;
            },
            onRunClick: function(e) {
                // On run button click,
                e.halt(true);
                if (
                    this.get(STATE) === 'run' ||
                    this.get(STATE) === 'debugrun'
                ) {
                    this.set(STATE, IDLE); // toggle between idle
                } else {
                    if (
                        Y.Object.keys(
                            this.mainEditorTab.aceField
                                .getSession()
                                .getBreakpoints()
                        ).length ||
                        this.get(STATE) === 'breaking'
                    ) {
                        this.set(STATE, 'debugrun'); // and run mode
                    } else {
                        this.set(STATE, 'run');
                    }
                }
            },
            run: function() {
                this.sendRunRequest(this.mainEditorTab.aceField.getValue(), {
                    callLine: true,
                });
            },
            debug: function() {
                var code = this.instrument(
                        this.mainEditorTab.aceField.getValue()
                    ),
                    breakpoints = Y.Object.keys(
                        this.mainEditorTab.aceField
                            .getSession()
                            .getBreakpoints()
                    );
                Y.log(
                    'Sending request: current step: ' +
                        this.currentBreakpointStep +
                        ', breakpoints: ' +
                        Y.JSON.stringify(breakpoints) +
                        '\ninstrumented code: \n' +
                        code,
                    INFO,
                    PROGGAMELEVEL
                );
                this.sendRunRequest(code, {
                    debug: true,
                    watches: this.watches, //                                       // Watched values
                    breakpoints: breakpoints, // //                                 // breakpoints
                    startStep: this.currentBreakpointStep, // The running step reached during last evaluation
                });
            },
            reRun: function() {
                Y.log('reRun()', INFO, PROGGAMELEVEL);
                var code = this.instrument(
                        this.mainEditorTab.aceField.getValue()
                    ), // Fetch instrumented code
                    breakpoints = Y.Object.keys(
                        this.mainEditorTab.aceField
                            .getSession()
                            .getBreakpoints()
                    ); // and breakpoints

                Y.log(
                    'instrumented code: ' +
                        code +
                        ', current step: ' +
                        this.currentBreakpointStep +
                        ', breakpoints: ' +
                        Y.JSON.stringify(breakpoints),
                    INFO,
                    PROGGAMELEVEL
                );
                this.sendRunRequest(code, {
                    //                                       // Run instrumented code on the server
                    debug: true,
                    watches: this.watches, //                                       // Watched values
                    breakpoints: breakpoints, //                                    // breakpoints
                    startStep: this.currentBreakpointStep - 1,
                    targetStep: this.currentBreakpointStep,
                });
            },
            prepareExecution: function() {
                this.feedback = '';
                this.currentCode = this.mainEditorTab.aceField
                    .getValue()
                    .trim();
                this.isModifiedCode = this.currentCode !== this.previousCode;
                this.isRuntimeException = false;
                this.isSuccessful = false;
            },
            doPersist: function() {
                var msgSubject = Y.JSON.stringify(
                        (!this.isSuccessful || this.isRuntimeException
                            ? "<span style='color:red'>"
                            : "<span style='color:green'>") +
                            'Exercice ' +
                            (this.isRuntimeException
                                ? 'ÉCHOUÉ avec EXCEPTION'
                                : this.isSuccessful
                                ? 'RÉUSSI'
                                : 'ÉCHOUÉ') +
                            '</span>'
                    ),
                    msgDate = 'Level ' + (currentLevel / 10).toFixed(1),
                    msgBody =
                        (this.isRuntimeException
                            ? '<b>Exception :</b> ' +
                              Y.Wegas.Helper.htmlEntities(this.feedback) +
                              '<br>&nbsp;<br>'
                            : '') +
                        '<b>Code soumis :</b><br><pre>' +
                        Y.Wegas.Helper.htmlEntities(this.currentCode) +
                        '</pre>';

                batchRemoteCall(
                    function(HISTORY_INBOX, msgDate, msgSubject, msgBody) {
                        Variable.find(
                            gameModel,
                            HISTORY_INBOX
                        ).sendDatedMessage(
                            self,
                            '',
                            msgDate,
                            msgSubject,
                            msgBody,
                            []
                        );
                    },
                    HISTORY_INBOX,
                    msgDate,
                    msgSubject,
                    msgBody
                ).catch(function() {
                    alert(
                        'Erreur interne: Impossible de sauvegarder ' +
                            HISTORY_INBOX +
                            ' ! \n' +
                            'Recharger la page dans le navigateur si ce problème se reproduit'
                    );
                });

                if (this.getHighestAttemptedLevel() > currentLevel) {
                    Y.log(
                        "*** We're NOT persisting counters for this lower level"
                    );
                    return;
                }

                var currCounters = this.counters[currentLevel];

                currCounters.submissions++;
                if (this.isSuccessful) {
                    currCounters.successful++;
                } else if (this.isRuntimeException) {
                    currCounters.exceptions++;
                } else {
                    currCounters.incomplete++;
                }

                batchRemoteCall(
                    function(currentLevel, currCounters, COUNTERS_OBJECT) {
                        Variable.find(gameModel, COUNTERS_OBJECT).setProperty(
                            self,
                            String(currentLevel),
                            JSON.stringify(currCounters)
                        );
                    },
                    currentLevel,
                    currCounters,
                    COUNTERS_OBJECT
                ).catch(function() {
                    alert(
                        "Erreur interne: Impossible de sauvegarder les compteurs d'exécutions ! \n" +
                            'Recharger la page dans le navigateur si ce problème se reproduit'
                    );
                });
            },
            persistExecution: function() {
                if (this.isModifiedCode) {
                    this.previousCode = this.currentCode;
                    this.doPersist();
                }
            },
            instrument: function(code) {
                return Wegas.JSInstrument.instrument(code); // return instrumented value of the code
            },
            sendRunRequest: function(code, interpreterCfg) {
                interpreterCfg = interpreterCfg || {};
                this.prepareExecution();
                var to = setTimeout(
                    function() {
                        this.runner.terminate();
                        this.runner = createRunner();
                        this.onReply(
                            [
                                'timeout',
                                // Don't tell how much CPU is available, as it's not related to the duration of the animation:
                                "Ce code s'exécute depuis trop longtemps. Il contient probablement une boucle infinie.",
                            ],
                            code
                        );
                    }.bind(this),
                    3e3
                );
                this.runner.onmessage = function(m) {
                    clearTimeout(to);
                    this.onReply(m.data, code);
                }.bind(this);
                this.runner.postMessage([
                    code, // Player's code
                    this.toObject(),
                    interpreterCfg,
                ]);
                return;
            },
            resetUI: function() {
                Y.log('resetUI()', INFO, 'Wegas.ProgGameDisplay');
                this.commandsStack = null;
                this.display.execute({
                    //                                            // Reset the display to default
                    type: 'resetLevel',
                    objects: Y.clone(this.get('objects')),
                });
                this.debugTabView
                    .item(0)
                    .get('panelNode')
                    .setContent(''); // Empty log tab

                this.get(CONTENTBOX)
                    .one('.proggame-levelend')
                    .hide();
                this.get(CONTENTBOX)
                    .one('.play')
                    .show();
            },
            // Returns true iff the given command stack ends with a 'gameWon':
            getExecutionOutcome: function(arr) {
                for (var i = arr.length - 1; i >= 0; i--) {
                    var currType = arr[i].type;
                    if (currType === 'gameWon') {
                        return true;
                    } else if (currType === 'gameLost') {
                        return false;
                    }
                }
                return false;
            },
            /**
             * @param {['success', {type:string, [key:string]:any}[]] |
             *  ['parseError', string, SourceLocation?] |
             *  ['runtimeError', string, SourceLocation] |
             *  ['timeout', string]
             * } result
             * @param {string} code
             */
            onReply: function(result, code) {
                Y.log(
                    'onReply(' + Y.JSON.stringify(result) + ')',
                    INFO,
                    PROGGAMELEVEL
                );
                var level = Y.Wegas.Facade.Variable.cache
                    .find('name', 'currentLevel')
                    .get('value');
                switch (result[0]) {
                    case 'success':
                        var commands = result[1];

                        var success = commands.some(
                            /**
                             * @param {{ type: string; }} c
                             */
                            function(c) {
                                return c.type === 'gameWon';
                            }
                        );
                        batchRemoteCall(
                            function(code, level, success) {
                                /* global Log, Action */
                                var stmts = [
                                    Log.level(code, level, true, success),
                                ];
                                if (success) {
                                    stmts.push(
                                        Log.statement(
                                            'completed',
                                            'level',
                                            level
                                        )
                                    );
                                }
                                Log.post(stmts);
                                if (success) {
                                    Action.completeLevel(level);
                                }
                            },
                            code,
                            level,
                            success
                        );
                        this.commandsStack = commands;
                        this.isRuntimeException = false;
                        this.isSuccessful = this.getExecutionOutcome(
                            this.commandsStack
                        );
                        this.persistExecution();
                        this.consumeCommand();
                        return;
                    case 'parseError':
                        this.isRuntimeException = false;
                        this.isSuccessful = false;
                        this.feedback = result[1];
                        break;
                    case 'runtimeError':
                        this.isRuntimeException = true;
                        this.isSuccessful = false;
                        this.feedback = result[1];
                        break;
                    case 'timeout':
                        this.isRuntimeException = true;
                        this.isSuccessful = false;
                        this.feedback = result[1];
                        break;
                }
                this.set('state', IDLE);
                this.highlight(result[2], true);
                batchRemoteCall(
                    function(code, level) {
                        Log.post(Log.level(code, level, false, false));
                    },
                    code,
                    level
                );

                this.persistExecution();
                this.set('error', this.feedback);
                Y.Wegas.Alerts.showNotification(
                    'Your script contains an error.',
                    { timeout: 1e3 }
                );
            },
            findObject: function(id) {
                return Y.Array.find(this.get('objects'), function(o) {
                    return o.id === id;
                });
            },
            doIdleAnimation: function() {
                var texts = this.get('invites');
                if (texts.length === 0) {
                    texts = [
                        "Bonjour ? Il y a quelqu'un ? Moi, je suis là !",
                        'Tape le bon code pour me rejoindre !',
                        "Y a-t-il quelqu'un pour me tenir compagnie ?",
                    ];
                }

                if (this.get(STATE) === IDLE) {
                    var enemy =
                        this.display.getEntity('Enemy') ||
                        this.display.getEntity('NPC');
                    enemy.say(
                        texts[Math.floor(Math.random() * texts.length)],
                        3500,
                        false,
                        true
                    );
                    enemy.wave(7);
                }
            },
            doLevelEndAnimation: function() {
                var cb = this.get(CONTENTBOX);
                cb.one('.proggame-levelend').show();
                cb.one('.play').hide();
                cb.all('.proggame-levelend-staractive').removeClass(
                    'proggame-levelend-staractive'
                );
                Y.later(500, this, function() {
                    cb.one('.proggame-levelend-star-1').addClass(
                        'proggame-levelend-staractive'
                    );
                });
                Y.later(1000, this, function() {
                    cb.one('.proggame-levelend-star-2').addClass(
                        'proggame-levelend-staractive'
                    );
                });
                Y.later(1500, this, function() {
                    cb.one('.proggame-levelend-star-3').addClass(
                        'proggame-levelend-staractive'
                    );
                });
            },
            consumeCommand: function() {
                if (this.commandsStack && this.commandsStack.length > 0) {
                    var command = this.commandsStack.shift();
                    //Y.log("consumeCommand" + ", " + command.type + ", " + command);
                    switch (command.type) {
                        case 'updated':
                            Y.mix(
                                this.findObject(command.object.id),
                                command.object,
                                true
                            ); // Update target object cfg
                            this.consumeCommand();
                            break;
                        case 'gameWon':
                            Y.later(2500, this, function() {
                                // After shake hands animation is over,
                                this.doLevelEndAnimation(); // display level end screen
                            });
                            break;
                        case 'gameLost':
                            this.consumeCommand();
                            this.focusCode();
                            break;
                        case 'log':
                            this.debugTabView
                                .item(0)
                                .get('panelNode')
                                .append(command.text + '<br>');
                            Y.later(100, this, this.consumeCommand);
                            break;
                        case 'line':
                            this.highlight(command.line);
                            this.consumeCommand();
                            break;
                        case 'breakpoint':
                            Y.log(
                                'Breakpoint reached at line: ' +
                                    command.line +
                                    ', step: ' +
                                    command.step,
                                INFO,
                                PROGGAMELEVEL
                            );
                            this.mainEditorTab.set('selected', 1);
                            if (command.line !== this.currentBreakpointLine) {
                                // May occur on rerun
                                this.highlight(command.line);
                            }
                            this.currentBreakpointLine = command.line;
                            this.currentBreakpointStep = command.step;
                            this.updateDebugTreeview(command.scope);
                            this.set(STATE, 'breaking');
                            break;
                        default:
                            this.display.execute(command); // Forward the command to the display
                    }
                } else if (this.commandsStack) {
                    this.set(STATE, IDLE);
                }
            },
            /**
             * @param {number|SourceLocation} loc
             */
            highlight: function(loc, error) {
                var session = this.mainEditorTab.aceField.session;
                /*global require */
                var Range = require('ace/range').Range;
                if (this.marker) {
                    session.removeGutterDecoration(
                        this.cLine,
                        'proggame-currentgutterline'
                    );
                    session.removeMarker(this.marker);
                    this.marker = null;
                }
                if (typeof loc === 'number') {
                    loc = loc - 1; // 0 based
                    this.cLine = loc;
                    this.marker = session.addMarker(
                        new Range(loc, 0, loc, 200),
                        'proggame-currentline' + (error ? '-error' : ''),
                        TEXT
                    );
                    session.addGutterDecoration(
                        loc,
                        'proggame-currentgutterline'
                    );
                } else if (loc != null && typeof loc === 'object') {
                    this.marker = session.addMarker(
                        new Range(
                            loc.start.line - 1,
                            loc.start.column,
                            loc.end.line - 1,
                            loc.end.column
                        ),
                        'proggame-currentline' + (error ? '-error' : ''),
                        TEXT
                    );
                }
            },
            doNextLevel: function(fn) {
                var content = 'Action.changeLevel(' + this.get('onWin') + ')';
                Wegas.Facade.Variable.script.run(content, {
                    on: {
                        success: fn,
                    },
                });
            },
            addEditorTab: function(label, code, file) {
                var _file = file,
                    saveTimer = new Wegas.Timer(),
                    tab = this.editorTabView
                        .add({
                            //                                // Render tab
                            label: label,
                            children: [{ type: 'Text' }],
                        })
                        .item(0),
                    aceField = ace.edit(tab.get('panelNode').getDOMNode());
                aceField.setTheme('ace/theme/tomorrow_night_blue');
                aceField.getSession().setMode('ace/mode/javascript');
                aceField.getSession().setValue(code);
                aceField.getSession().on(
                    'change',
                    function() {
                        this.highlight(null);
                    }.bind(this)
                );
                aceField.commands.removeCommand('showSettingsMenu'); // remove Settings panel.
                tab.set('selected', 1);
                tab.aceField = aceField; // Set up a reference to the ace field
                tab.saveTimer = saveTimer;
                tab.before('destroy', function() {
                    this.aceField.session.$stopWorker();
                    this.aceField.destroy();
                    this.aceField = null;
                    this.saveTimer.destroy();
                });
                aceField.session.on(
                    'change',
                    Y.bind(function() {
                        // Every time the code is changed is entered
                        if (this.get(STATE) === 'breaking') {
                            // stop debug session
                            this.set(STATE, IDLE);
                        }
                        saveTimer.reset();
                    }, this)
                );
                if (_file) {
                    // If there is a file (i.e. not in the main tab)
                    saveTimer.on('timeOut', function() {
                        // Every time save teim time outs,
                        _file.set('body', aceField.getValue());
                        Wegas.Facade.Variable.sendRequest({
                            //             // Save the file
                            request: '/Inbox/Message/' + _file.get(ID),
                            cfg: {
                                updateCache: false,
                                method: 'PUT',
                                data: _file,
                            },
                        });
                    });
                }

                aceField.on(
                    'guttermousedown',
                    Y.bind(function(e) {
                        // Add breakpoints on gutter click
                        if (
                            e.domEvent.target.className.indexOf(
                                'ace_gutter-cell'
                            ) === -1 ||
                            this.disableBreakpoint
                        ) {
                            // Check if breakpoint has been bought from the shop
                            return;
                        }
                        if (tab.get(LABEL) !== 'Code') {
                            // Breakpoints are not implemented in files yet
                            alert(
                                'Breakpoints are only available in the Main code'
                            );
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
                    }, this)
                );
                return tab;
            },
            renderDebugTabView: function() {
                this.debugTabView = new Y.TabView({
                    //                               // Render the tabview for logs and watches treeview
                    children: [
                        {
                            label: 'Log',
                        },
                        {
                            label: 'Watches',
                            plugins: [
                                {
                                    fn: 'ConditionalDisable',
                                    cfg: {
                                        condition: {
                                            '@class': 'Script',
                                            content:
                                                'Variable.find(gameModel, "inventory").getProperty(self, "watches") != "true"',
                                            language: 'JavaScript',
                                        },
                                    },
                                },
                            ],
                            children: [
                                {
                                    type: 'Button',
                                    label: 'Add watch',
                                    on: {
                                        click: Y.bind(function() {
                                            var watch = prompt('Expression');
                                            if (!watch) {
                                                return;
                                            }
                                            this.watches.push(watch);
                                            if (
                                                this.get(STATE) === 'breaking'
                                            ) {
                                                // If an evaluation is on going
                                                this.reRun(); // rerun script until current step to get new
                                            } else {
                                                this.variableTreeView.add({
                                                    label: watch + ': null',
                                                    iconCSS: '',
                                                });
                                            }
                                        }, this),
                                    },
                                },
                                {
                                    //                                              // Watches treeview
                                    type: 'TreeView',
                                },
                            ],
                        },
                    ],
                }).render(this.get(CONTENTBOX).one('.proggame-debugger'));
                this.variableTreeView = this.debugTabView.item(1).witem(1);
                this.updateDebugTreeview({});
            },
            renderApiTabView: function() {
                var node,
                    packages = {};
                Y.Array.each(this.get('api'), function(i) {
                    // Map api to a treeview structure
                    //                node = ProgGameLevel.API[i] || {
                    //                    label: i + "()"
                    //                };
                    if (!ProgGameLevel.API[i]) {
                        node = {
                            label: i + '()',
                        };
                    } else {
                        node = {
                            label:
                                "<span class='api-tooltip'>?<div><div class='api-tooltip-content'>" +
                                ProgGameLevel.API[i].tooltip +
                                '</div></div></span>' +
                                ProgGameLevel.API[i].label,
                        };
                    }
                    //                if (!ProgGameLevel.API[i]) {
                    //                    node = {
                    //                        label: i + "()"
                    //                    };
                    //                } else {
                    //                    node = {
                    //                        label: "<span class='span'>?</span>" + "<span class = 'label'>" + ProgGameLevel.API[i].label + "</span>"
                    //                    };
                    //                }
                    node.data = i;
                    if (node.pkg) {
                        if (!packages[node.pkg]) {
                            packages[node.pkg] = {
                                type: 'TreeNode',
                                label: node.pkg,
                                collapsed: false,
                                children: [],
                            };
                        }
                        packages[node.pkg].children.push(node);
                    } else {
                        packages[node.label] = node;
                    }
                });
                if (
                    Wegas.Facade.Variable.script.localEval(
                        'Variable.find(gameModel, "inventory").getProperty(self, "fileLibrary") === "true"'
                    )
                ) {
                    packages.indlude = ProgGameLevel.API.include;
                }

                this.apiTabView = new Y.TabView({
                    //                                 // Render the tabview for files and api
                    children: [
                        {
                            label: 'API',
                            children: [
                                {
                                    type: 'TreeViewWidget',
                                    cssClass: 'proggame-api',
                                    children: Y.Object.values(packages),
                                },
                            ],
                        },
                        {
                            label: 'Files',
                            children: [
                                {
                                    type: 'ScriptFiles',
                                    variable: {
                                        name: 'files',
                                    },
                                },
                            ],
                            plugins: [
                                {
                                    fn: 'ConditionalDisable',
                                    cfg: {
                                        condition: {
                                            '@class': 'Script',
                                            content:
                                                'Variable.find(gameModel, "inventory").getProperty(self, "filelibrary") != "true"',
                                            language: 'JavaScript',
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                }).render(this.get(CONTENTBOX).one('.proggame-lefttab'));
                this.apiTabView
                    .item(0)
                    .witem(0)
                    .on(
                        'treeleaf:click',
                        function(e) {
                            // When api is clicked, insert function in editor
                            var toInsert = e.target.get('data');
                            this.editorTabView
                                .get('selection')
                                .aceField
                                .insert(toInsert + '();\n');
                            this.focusCode();
                            e.halt(true);
                        },
                        this
                    );
                this.apiTabView
                    .item(1)
                    .witem(0)
                    .on(
                        'openFile',
                        function(e) {
                            // Every time a file is opened,
                            var tab;
                            this.editorTabView.each(function(t) {
                                if (t.get(LABEL) === e.file.get('subject')) {
                                    tab = t;
                                }
                            });
                            if (tab) {
                                // If the file is already opened,
                                tab.set('selected', 1); // display it.
                            } else {
                                // Otherwise,
                                Wegas.Facade.Variable.sendRequest({
                                    // retrieve the file content from the server
                                    request:
                                        '/Inbox/Message/' +
                                        e.file.get(ID) +
                                        '?view=Extended',
                                    cfg: {
                                        updateCache: false,
                                    },
                                    on: {
                                        success: Y.bind(function(e) {
                                            var file = e.response.entity,
                                                tab = this.addEditorTab(
                                                    file.get('subject'),
                                                    file.get('body'),
                                                    file
                                                ); // and display it in a new tab
                                            tab.plug(Y.Plugin.Removeable);
                                        }, this),
                                    },
                                });
                            }
                        },
                        this
                    );
            },
            updateDebugTreeview: function(object) {
                var watches = {};
                Y.Array.each(this.watches, function(i) {
                    // Set default value to undefined
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
                            type: 'TreeNode',
                            label: label + ': Object',
                            children: children,
                            iconCSS: '',
                        };
                    } else if (Y.Lang.isArray(o)) {
                        return {
                            type: 'TreeNode',
                            label: label + ': Array[' + o.length + ']',
                            children: Y.Array.map(o, genItems),
                            iconCSS: '',
                        };
                    } else {
                        return {
                            label: label + ': ' + o,
                            iconCSS: '',
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
            showMessage: function(level, message) {
                var BOUNDING_BOX = 'boundingBox',
                    target = this.get(BOUNDING_BOX)
                        .one('.proggame-help')
                        .get('region'),
                    panel = this.getPanel({
                        content:
                            '<div>' +
                            message +
                            "</div><button class='yui3-button proggame-button'>Continuer</button>",
                    });

                panel
                    .get(BOUNDING_BOX)
                    .setStyles({
                        transformOrigin: 'top left',
                        transform: 'scale(0.01)',
                        opacity: 0.2,
                        top: Math.round(target.top) + 10 + 'px',
                        left: Math.round(target.left) + 10 + 'px',
                    })
                    .transition({
                        duration: 0.3,
                        top: panel.get('x') + 'px', // panel default value
                        left: panel.get('y') + 'px',
                        transform: 'scale(1)',
                        opacity: 1,
                    });

                Y.later(50, this, function() {
                    // Hide panel anywhere user clicks
                    Y.one('body').once(
                        CLICK,
                        function() {
                            //this.show();
                            panel.get(BOUNDING_BOX).transition(
                                {
                                    duration: 0.3,
                                    top: Math.round(target.top) + 10 + 'px',
                                    left: Math.round(target.left) + 10 + 'px',
                                    transform: 'scale(0.01)',
                                    opacity: 0.2,
                                },
                                Y.bind(function() {
                                    panel.destroy();
                                    //this.show();
                                    if (
                                        '' + this.get('root').get('@pageId') ===
                                        '11'
                                    ) {
                                        this.showTutorial();
                                    } else {
                                        this.focusCode();
                                    }
                                }, this)
                            );
                        },
                        this
                    );
                });
            },
            getPanel: function(cfg) {
                var panel = new Wegas.Panel(
                    Y.mix(cfg, {
                        modal: true,
                        centered: false,
                        x: 100,
                        y: 85,
                        width: '962px',
                        height: 709,
                        buttons: {},
                    })
                ).render();
                // this.hide();
                panel.get('boundingBox').addClass('proggame-panel');
                return panel;
            },
            showTutorial: function() {
                Y.Wegas.Tutorial(ProgGameLevel.TUTORIAL, {
                    next: 'Continuer',
                    skip: 'Ignorer le tutoriel',
                }).then(function() {
                    this.focusCode();
                }.bind(this));
            },
            focusCode: function() {
                var ace = this.editorTabView
                    .get('selection')
                    .aceField;
                ace.focus();
            }
        },
        {
            ATTRS: {
                intro: {
                    type: STRING,
                    optional: true,
                    view: {
                        type: 'html',
                        label: 'Intro text',
                    },
                },
                state: {
                    transient: true,
                },
                error: {
                    transient: true,
                    setter: function(v) {
                        this.debugTabView
                            .item(0)
                            .get('panelNode')
                            .append(
                                "<div class='script-error'>" +
                                    Y.Wegas.Helper.htmlEntities(v) +
                                    '</div>'
                            );
                    },
                },
                label: {
                    type: STRING,
                    index: -1,
                    view: {
                        label: 'Label',
                    },
                },
                map: {
                    type: ARRAY,
                    items: {
                        type: ARRAY,
                        view: {
                            label: true,
                            description: 'Path',
                            horizontal: true,
                            highlight: true,
                        },
                        items: {
                            type: 'object',
                            view: { label: true },
                            properties: {
                                x: {
                                    type: NUMBER,
                                    value: 0,
                                    view: { type: HIDDEN },
                                },
                                y: {
                                    type: NUMBER,
                                    value: 0,
                                    view: {
                                        type: 'boolean',
                                        layout: 'inlineShort',
                                    },
                                },
                            },
                        },
                    },
                    value: [
                        [
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                        ],
                        [
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                        ],
                        [
                            { x: 0, y: 0 },
                            { x: 0, y: 1 },
                            { x: 0, y: 1 },
                            { x: 0, y: 1 },
                            { x: 0, y: 1 },
                            { x: 0, y: 0 },
                        ],
                        [
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                        ],
                        [
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                            { x: 0, y: 0 },
                        ],
                    ],
                    validator: Y.Lang.isArray,
                    view: {
                        type: 'matrix',
                        label: 'Map matrix',
                        valueToBool: function(v) {
                            return Boolean(v.y);
                        },
                        boolToValue: function(b) {
                            return { x: 0, y: Number(b) };
                        },
                    },
                },
                objects: {
                    type: ARRAY,
                    view: {
                        label: 'Objects',
                        description: 'Order defines evaluation order',
                        sortable: true,
                        highlight: true,
                        choices: [
                            {
                                label: 'Trap',
                                value: {
                                    components: 'Trap',
                                    id: 'Trap',
                                    enabled: true,
                                },
                            },
                            {
                                label: 'NPC',
                                value: {
                                    components: 'NPC',
                                    id: 'NPC',
                                    direction: 4,
                                    collides: false,
                                    ai: '',
                                },
                            },
                            {
                                label: 'Player',
                                value: {
                                    components: 'PC',
                                    id: 'Player',
                                    direction: 2,
                                    collides: false,
                                },
                            },
                            {
                                label: 'Panel',
                                value: {
                                    components: 'Panel',
                                    id: 'Panel',
                                    value: 'Hello, World!',
                                    collides: false,
                                },
                            },
                            {
                                label: 'Door',
                                value: {
                                    components: 'Door',
                                    id: 'Door',
                                    open: false,
                                },
                                // doesn't work
                                // },{
                                // label: "Controller",
                                // value: {
                                //     components:"Controller",
                                //     id: "Controller",
                                //     enabled: false
                                // }
                            },
                        ],
                    },
                    items: {
                        type: 'object',
                        properties: {
                            components: {
                                type: 'string',
                                required: true,
                                view: {
                                    label: 'Component',
                                    required: true,
                                    type: 'uneditable',
                                },
                            },
                            id: {
                                type: STRING,
                                required: true,
                                view: {
                                    label: 'Id',
                                    description:
                                        'MUST be unique accross current map',
                                },
                            },
                            x: {
                                type: NUMBER,
                                required: true,
                                view: { label: 'X' },
                            },
                            y: {
                                type: NUMBER,
                                required: true,
                                view: { label: 'Y' },
                            },
                            // enabled:{
                            //     type:BOOLEAN,
                            //     view:{
                            //         label: "Active by default",
                            //         description: "only for traps"
                            //     }
                            // }
                        },
                        patternProperties: {
                            '^direction$': {
                                type: NUMBER,
                                view: {
                                    label: 'direction',
                                    type: 'select',
                                    choices: [
                                        {
                                            value: 2,
                                            label: 'right',
                                        },
                                        {
                                            value: 1,
                                            label: 'down',
                                        },
                                        {
                                            value: 3,
                                            label: 'up',
                                        },
                                        {
                                            value: 4,
                                            label: 'left',
                                        },
                                    ],
                                },
                            },
                            '^collides$': {
                                view: { type: 'hidden' },
                            },
                            '^ai$': {
                                view: {
                                    type: 'jseditor',
                                    label: 'AI',
                                    description:
                                        "Has access to the API (and 'this', see serverscript, to cheat a bit)",
                                },
                            },
                        },
                        additionalProperties: {
                            view: {
                                label: true,
                            },
                        },
                    },
                },
                api: {
                    type: ARRAY,
                    value: [],
                    uniqueItems: true,
                    view: {
                        label: 'API',
                    },
                    items: {
                        type: STRING,
                        view: {
                            type: 'select',
                            choices: function() {
                                return Object.keys(ProgGameLevel.API);
                            },
                        },
                    },
                },
                winningCondition: {
                    type: STRING,
                    value: "comparePos(find('Player'), find('NPC'))",
                    view: {
                        type: 'jseditor',
                        label: 'Winning Condition',
                    },
                },
                onStart: {
                    type: STRING,
                    optional: true,
                    view: {
                        type: 'jseditor',
                        label: 'On Start',
                    },
                },
                onAction: {
                    type: STRING,
                    view: {
                        type: 'jseditor',
                        label: 'On Action',
                    },
                },
                onWin: {
                    type: STRING,
                    view: {
                        type: 'pageselect',
                        label: 'Next Level',
                    },
                    getter: function(v) {
                        var r;
                        if (
                            typeof v === 'string' &&
                            (r = v.match(
                                /Variable.find\(gameModel, "currentLevel"\).setValue\(self, (\d+)\)/
                            ))
                        ) {
                            // old version
                            return r[1];
                        }
                        return v;
                    },
                },
                defaultCode: {
                    type: STRING,
                    value: '//Put your code here...',
                    view: {
                        type: 'jseditor',
                        label: 'Code input placeholder',
                    },
                },
                invites: {
                    type: ARRAY,
                    value: [],
                    view: {
                        label: 'Invites',
                        description: 'Make NPC yell',
                        className: 'wegas-advanced-feature',
                    },
                },
                maxTurns: {
                    type: NUMBER,
                    value: 1,
                    getter: function(v) {
                        return Number(v);
                    },
                    view: {
                        label: 'Max turns',
                        className: 'wegas-advanced-feature',
                    },
                },
                //arguments: {
                //    type: ARRAY,
                //    value: []
                //}
            },
            API: {
                say: {
                    label: 'say(text:String)',
                    tooltip:
                        'say(text: String)\n' +
                        'Your avatar will loudly say the content of the text parameter.\n\n' +
                        'Parameters\ntext:String - The text you want to say out loud',
                },
                read: {
                    label: 'read():Number',
                    tooltip:
                        'read():Number\n' +
                        'Your avatar will read any panel on the same case as he is and return it.\n\n' +
                        'Returns\nNumber - The text on the panel',
                },
                move: {
                    label: 'move()',
                    tooltip:
                        'move()\n' +
                        'Using this function, your avatar will move one tile\nin the direction he is currently facing.',
                },
                left: {
                    label: 'left()',
                    tooltip:
                        'left()\n' +
                        'Your avatar turns to the left without moving.',
                },
                right: {
                    label: 'right()',
                    tooltip:
                        'right()\n' +
                        'Your avatar turns to the right without moving.',
                },
                npc: {
                    label: 'npc&lt;T&gt;(fn:()=>T):T',
                    tooltip:
                        'Ask NPC to execute the given function, it returns the value the function returns.\n\n' +
                        'Parameters\nfn - The function to execute',
                },
                'Math.PI': {
                    pkg: 'Math',
                    tooltip:
                        'Math:PI:Number\n\nConstant containing the value of PI (approx. 3.14)',
                    label: 'PI:Number',
                },
                'Math.floor': {
                    label: 'floor():Number',
                    pkg: 'Math',
                    tooltip:
                        'Math.floor():Number\n' +
                        'The floor() method rounds a number DOWNWARDS to the nearest integer, and returns the result.\n\n' +
                        'Parameters\nx:Number - The number you want to round\n' +
                        'Returns\nNumber - The nearest integer when rounding downwards',
                    //tooltipHTML: "The floor() method rounds a number DOWNWARDS to the nearest integer, and returns the result.<br><br>"
                    //        + "<b>Parameters</b><br>x:Number - The number you want to round"
                    //        + "<b>Returns</b><br>Number - The nearest integer when rounding downwards",
                },
                'Math.round': {
                    pkg: 'Math',
                    label: 'round(x:Number):Number',
                    tooltip:
                        'Math.round(x:Number):Number\n\n' +
                        'If the fractional portion of number is .5 or greater, the argument is rounded to the next higher integer. If the fractional portion of number is less than .5, the argument is rounded to the next lower integer.\n' +
                        'Because round is a static method of Math, you always use it as Math.round(), rather than as a method of a Math object you created.\n\n' +
                        //+ "The Math.round() function returns the value of a number rounded to the nearest integer.\n\n"+
                        'Parameters\n' +
                        'x:Number - The number you want to round\n' +
                        'Returns\n' +
                        'Number - the value of x rounded to the nearest integer',
                },
                include: {
                    label: 'include(name:String)',
                    tooltip:
                        'include(name:String)\n\n' +
                        'Allows to include a file from your file library. This way you can reuse your code multiple times.',
                },
            },
            TUTORIAL: [
                {
                    node: '.code',
                    html:
                        "<div>L'éditeur de code vous permet de contrôler votre avatar.</div>",
                },
                {
                    node: '.proggame-buttons',
                    html:
                        '<div>Pour exécuter votre code, cliquez sur la flèche verte.</div>',
                },
                {
                    node: '.proggame-lefttab',
                    html:
                        "<div>L'<b>API</b>(Application Programming Interface) expose les instructions que vous avez à disposition.<br><br>" +
                        'Le <b>?</b> donne des informations supplémentaires pour chaque instruction<br><br>' +
                        'Vous pouvez ajouter des instructions en cliquant directement dessus.</div>',
                },
                {
                    node: '.proggame-help',
                    html:
                        "<div>Pour revoir les objectifs du niveau, cliquez sur le bouton d'information <b>i</b>.</div>",
                },
                {
                    node: '.proggame-button-theory',
                    html:
                        '<div>Vous recevrez la théorie nécessaire pour chaque niveau dans la partie théorie.</div>',
                },
                {
                    node: '.proggame-button-play',
                    html:
                        '<div>Vous pouvez rejouer les anciens niveaux en cliquant sur la carte</div>',
                },
            ],
        }
    );
    Wegas.ProgGameLevel = ProgGameLevel;
});
