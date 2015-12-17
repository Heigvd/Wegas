/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 */
/*global YUI*/
YUI.add("wegas-statemachine-entities", function(Y) {
    "use strict";

    var STRING = "string",
        HIDDEN = "hidden",
        SELF = "self",
        BOOLEAN = "boolean",
        NUMBER = "number",
        BUTTON = "Button",
        SCRIPT = "script",
        TEXT = "text",
        STATES = "states",
        ID = "id",
        HTML = "html",
        Wegas = Y.Wegas,
        persistence = Wegas.persistence;

    /*
     * FSMInstance Entity
     */
    persistence.FSMInstance = Y.Base.create("FSMInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "FSMInstance"
            },
            currentStateId: {
                value: 1,
                type: NUMBER,
                _inputex: {
                    label: "Current state id"
                }
            },
            currentState: {
                "transient": true,
                type: STRING
            },
            enabled: {
                type: BOOLEAN,
                value: true,
                _inputex: {
                    label: 'Active'
                }
            },
            transitionHistory: {
                value: [],
                type: "uneditable",
                _inputex: {
                    label: "Transition History"
                //,
                //elementType:{
                //    type:NUMBER,
                //    readonly:true
                //}
                }
            }
        },
        EDITORNAME: "State Machine"
    });
    /*
     * FSMDescriptor Entity
     */
    persistence.FSMDescriptor = Y.Base.create("FSMDescriptor", persistence.VariableDescriptor, [], {
        // *** Lifecycle methods *** //
        /**
         * Find a transition by it's id
         * @param {Integer} id The queried transition's id
         * @return {Transition|null} the transition if it exists
         */
        getTransitionById: function(id) {
            var i, t,
                states = this.get(STATES),
                trs;
            for (i in states) {
                if (states.hasOwnProperty(i)) {
                    trs = states[i].get("transitions");
                    for (t in trs) {
                        if (+trs[t].get(ID) === +id) {
                            return trs[t];
                        }
                    }
                }
            }
            return null;
        },
        /**
         *  Succession of State - transition representing the path
         *  for current user.
         *  @return {Array} An array containing alternatively state/transition.
         */
        getFullHistory: function(transitionHistory) {
            var i,
                trH = transitionHistory || this.getInstance().get("transitionHistory"),
                fullHistory = [],
                tmpTransition = null;

            fullHistory.push(this.getState(this.getInitialStateId()));
            for (i = 0; i < trH.length; i += 1) {
                tmpTransition = this.getTransitionById(trH[i]);
                fullHistory.push(tmpTransition);
                fullHistory.push(this.getState(tmpTransition.get("nextStateId")));
            }
            return fullHistory;
        },
        // *** Private methods *** //
        getCurrentState: function() {
            return this.getInstance().get("currentState");
        },
        getInitialStateId: function() {
            return this.get("defaultInstance").get("currentStateId");
        },
        setInitialStateId: function(initialStateId) {
            this.get("defaultInstance").set("currentStateId", initialStateId);
        },
        getState: function(identifier) {
            return this.get(STATES)[identifier];
        },
        getIconCss: function() {
            return "fa fa-sitemap fa-rotate-270";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "FSMDescriptor"
            },
            defaultInstance: {
                valueFn: function() {
                    return new persistence.FSMInstance();
                },
                validator: function(o) {
                    return o instanceof persistence.FSMInstance;
                },
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'FSMInstance'
                        }
                    },
                    id: {
                        type: NUMBER,
                        optional: true, // The id is optional for entities that have not been persisted
                        _inputex: {
                            _type: HIDDEN
                        }
                    },
                    currentStateId: {
                        type: NUMBER,
                        _inputex: {
                            label: "Default state id",
                            wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                            value: 1
                        }
                    },
                    enabled: {
                        type: BOOLEAN,
                        value: true,
                        _inputex: {
                            label: 'Active by default'
                        }
                    }
                }
            },
            states: {
                valueFn: function() {
                    return {
                        1: new persistence.State({})
                    };
                },
                writeOnce: "initOnly",
                _inputex: {
                    _type: HIDDEN
                }
            }
        },
        EDITORNAME: "State Machine",
        EDITMENU: [{
            type: "EditEntityButton",
            plugins: [{
                fn: "EditFSMAction"
            }]
        }, {
            type: BUTTON,
            label: "Copy",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "DeleteFSMButton"
        }, {
            type: BUTTON,
            label: "Export",
            plugins: [{
                fn: "WidgetMenu",
                cfg: {
                    children: [{
                        type: "PrintButton",
                        label: "Html"
                    }, {
                        type: "PrintButton",
                        label: "Html (Players document)",
                        mode: "player"
                    }, {
                        type: "PrintButton",
                        label: "Pdf",
                        outputType: "pdf"
                    }, {
                        type: "PrintButton",
                        label: "Pdf (Players document)",
                        outputType: "pdf",
                        mode: "player"
                    }, {
                        type: "OpenEntityButton",
                        label: "Json",
                        url: "rest/Export/GameModel/VariableDescriptor/{id}"
                    }]
                }
            }]
        }
        ],
        METHODS: {
            enable: {
                label: "activate",
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            disable: {
                label: "desactivate",
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            isEnabled: {
                label: "is active",
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }],
                returns: BOOLEAN,
                localEval: function(self) {
                    return this.getInstance(self).get("enabled");
                }
            },
            isDisabled: {
                label: "is inactive",
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }],
                returns: BOOLEAN,
                localEval: function(self) {
                    return !this.getInstance(self).get("enabled");
                }
            }
        }
    });
    /*
     * State Entity
     */
    persistence.State = Y.Base.create("State", persistence.Entity, [], {
        // *** Lifecycle methods *** //
        initializer: function() {}

    // *** Private methods *** //
    }, {
        ATTRS: {
            "@class": {
                value: "State"
            },
            label: {
                type: STRING,
                "transient": false,
                optional: true,
                _inputex: {
                    label: "Name"
                }
            },
            onEnterEvent: {
                optional: true,
                _inputex: {
                    _type: "script",
                    label: "On enter impact"
                }
            },
            transitions: {
                value: []
            },
            editorPosition: {
                valueFn: function() {
                    return new persistence.Coordinate({
                        x: 30,
                        y: 30
                    });
                }
            }
        }
    });
    /*
     * TransitionDescriptor Entity
     */
    persistence.Transition = Y.Base.create("Transition", persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "Transition",
                _inputex: {
                    _type: HIDDEN
                }
            },
            triggerCondition: {
                optional: true,
                _inputex: {
                    _type: SCRIPT,
                    label: 'Condition',
                    expects: "condition"
                }
            },
            preStateImpact: {
                optional: true,
                _inputex: {
                    _type: SCRIPT,
                    label: 'Impact'
                }
            },
            nextStateId: {
                _inputex: {
                    _type: HIDDEN
                }
            },
            index: {
                type: NUMBER,
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                    value: 0
                }
            }
        }
    });
    /**************************/
    /******** TRIGGER *********/
    /**************************/

    /*
     * TriggerDescriptor Entity
     */
    persistence.TriggerDescriptor = Y.Base.create("TriggerDescriptor", persistence.FSMDescriptor, [], {
        getIconCss: function() {
            return "fa fa-cogs";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "TriggerDescriptor"
            },
            defaultInstance: {
                valueFn: function() {
                    return new persistence.TriggerInstance();
                },
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'TriggerInstance'
                        }
                    },
                    currentStateId: {
                        type: NUMBER,
                        optional: true,
                        _inputex: {
                            label: 'Initial state id',
                            _type: HIDDEN
                        }
                    },
                    enabled: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default'
                        }
                    }
                }
            },
            disableSelf: {
                type: BOOLEAN,
                value: true,
                _inputex: {
                    label: 'Disable itself',
                    description: 'Disable once triggered.<br> May be rearmed afterwards',
                    index: 1
                }
            },
            oneShot: {
                type: BOOLEAN,
                value: false,
                _inputex: {
                    label: 'Only once',
                    description: 'Allowed to trigger only once',
                    index: 2
                }
            },
            triggerEvent: {
                optional: true,
                _inputex: {
                    _type: SCRIPT,
                    label: 'Condition',
                    expects: "condition",
                    index: 3
                }
            },
            postTriggerEvent: {
                _inputex: {
                    _type: SCRIPT,
                    label: 'Impact',
                    index: 4
                }
            },
            states: {
                "transient": true
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: BUTTON,
            label: "Copy",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "DeleteEntityButton"
        }]
    });
    /*
     * TriggerInstance Entity
     */
    persistence.TriggerInstance = Y.Base.create("TriggerInstance", persistence.FSMInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "TriggerInstance"
            },
            currentStateId: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Trigger state",
                    disabled: true
                }
            }
        }
    });
    /**********************************/
    /******** DIALOGUE ENTITY *********/
    /**********************************/

    /**
     * DialogueDescriptor Entity
     */
    persistence.DialogueDescriptor = Y.Base.create("DialogueDescriptor", persistence.FSMDescriptor, [], {
        /**
         * Triggers a Dialogue Transition programmatically
         * @param {Transition} transition - the transition object to trigger.
         * @param {Object} callbacks - {success:Function|String, failure:Function|String} - the callback functions to
         *     execute.
         */
        doTransition: function(transition, callbacks) {
            var request;
            if (transition instanceof persistence.DialogueTransition) {
                if (!this.get(ID) || !transition.get(ID)) {
                    Y.error("Trying to call an unpersisted transition",
                        new Error("Calling a detached entity"),
                        "Y.Wegas.persistence.DialogueDescriptor");
                    return false;
                }
                request = "/StateMachine/" + this.get(ID) +
                    "/Player/" + Wegas.Facade.Game.get('currentPlayerId') +
                    "/Do/" + transition.get(ID);
                try {
                    Wegas.Facade.Variable.sendRequest({
                        request: request,
                        on: callbacks
                    });
                } catch (e) {
                    //TODO : that
                }
                return true;

            } else {
                return false;
            }
        },
        getIconCss: function() {
            return "fa fa-comments-o";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "DialogueDescriptor"
            },
            title: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Label",
                    description: "Displayed to players",
                    index: -1
                }
            },
            states: {
                valueFn: function() {
                    return {
                        1: new persistence.DialogueState({})
                    };
                },
                writeOnce: "initOnly",
                _inputex: {
                    _type: HIDDEN
                }
            }
        },
        EDITORNAME: "Dialog",
        EDITMENU: [{
            type: "EditEntityButton",
            plugins: [{
                fn: "EditFSMAction",
                cfg: {
                    viewerCfg: {
                        availableStates: [ /*"State",*/ "DialogueState"],
                        availableTransitions: [ /*"Transition",*/ "DialogueTransition"]
                    }
                }
            }]
        }, {
            type: BUTTON,
            label: "Copy",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "DeleteFSMButton"
        }]
    });

    /**
     * DialogueTransition Entity
     */
    persistence.DialogueTransition = Y.Base.create("DialogueTransition", persistence.Transition, [], {}, {
        EDITORNAME: "Choice",
        ATTRS: {
            "@class": {
                value: "DialogueTransition"
            },
            actionText: {
                type: STRING,
                format: HTML,
                value: null,
                optional: true,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                },
                _inputex: {
                    index: -1,
                    label: "Text"
                }
            },
            index: {
                type: NUMBER,
                _inputex: {
                    value: 0
                }
            }
        }
    });

    /**
     * DialogueState Entity
     */
    persistence.DialogueState = Y.Base.create("DialogueState", persistence.State, [], {
        /*
         *
         */
        getAvailableActions: function(callback) {
            var i,
                transitions = this.get("transitions"),
                availableActions = [];
            for (i in transitions) {
                if (transitions[i] instanceof persistence.DialogueTransition) {
                    if (!transitions[i].get("triggerCondition")) {
                        availableActions.push(transitions[i]);
                    } else {
                        availableActions.push(
                            transitions[i].get("triggerCondition").localEval()
                                .then(Y.bind(function(transition, res) {
                                    if (res) {
                                        return transition;
                                    }
                                    return false;
                                }, null, transitions[i])));
                    }
                }
            }
            Y.Promise.all(availableActions).then(function(transitions) {
                callback(Y.Array.filter(transitions, function(element) {
                    return !!element;
                }));
            });
        },
        /**
         * Get an array of texts from the state's text, split by a token
         * @param {String} token The token to split by
         */
        getTexts: function(token) {
            return this.get(TEXT).split(token);
        },
        /**
         * Set the text with an array and a token
         *
         * @param {Array} a Strings to join
         * @param {String} token Token to join the array
         */
        setText: function(a, token) {
            this.set(TEXT, a.join(token));
        }
    }, {
        EDITORNAME: "server text",
        ATTRS: {
            "@class": {
                value: "DialogueState"
            },
            text: {
                type: STRING,
                format: HTML,
                value: null,
                optional: true,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                },
                _inputex: {
                    index: -1
                }
            },
            label: {
                _inputex: {
                    _type: HIDDEN
                }
            }
        }
    });
    /**
     * Coordinate embeddable mapper
     **/
    persistence.Coordinate = Y.Base.create("Coordinate", persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "Coordinate"
            },
            x: {
                value: null
            },
            y: {
                value: null
            }
        }
    });
});
