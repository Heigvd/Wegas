/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 */
/*global YUI, I18n*/
YUI.add("wegas-statemachine-entities", function(Y) {
    "use strict";

    var STRING = "string",
        HIDDEN = "hidden",
        SELF = "self",
        BOOLEAN = "boolean",
        NUMBER = "number",
        NULL = "null",
        ARRAY = "array",
        OBJECT = "object",
        BUTTON = "Button",
        SCRIPT = "script",
        TEXT = "text",
        STATES = "states",
        ID = "id",
        HTML = "html",
        SELFARG = {
            type: 'identifier',
            value: SELF,
            view: {type: HIDDEN}
        },
        Wegas = Y.Wegas,
        persistence = Wegas.persistence,
        VERSION_ATTR_DEF,
        IDATTRDEF;

    VERSION_ATTR_DEF = {
        type: NUMBER,
        view: {
            label: 'Version',
            type: "uneditable",
            className: "wegas-advanced-feature"
                //_type: HIDDEN
        }
    };

    IDATTRDEF = {
        type: NUMBER,
        view: {
            label: 'Id',
            type: HIDDEN
        }
    };


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
                view: {
                    label: "Current state id",
                    className: "wegas-advanced-feature"
                }
            },
            currentState: {
                "transient": true,
                type: STRING
            },
            enabled: {
                type: BOOLEAN,
                value: true,
                view: {
                    label: 'Active'
                }
            },
            transitionHistory: {
                value: [],
                type: ARRAY,
                view: {
                    label: "Transition History",
                    disabled: true,
                },
                items: {
                    type: "number",
                    view: {
                        disabled: true
                    }
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
                        value: 'FSMInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    descriptorId: {
                        view: {
                            type: HIDDEN
                        }
                    },
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    currentStateId: {
                        type: NUMBER,
                        value: 1,
                        view: {
                            label: "Current state id",
                            className: "wegas-advanced-feature"
                        }
                    },
                    enabled: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            label: 'Active by default'
                        }
                    },
                    transitionHistory: {
                        type: ARRAY,
                        value: [],
                        view: {
                            type: HIDDEN
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
                //writeOnce: "initOnly",
                view: {
                    type: HIDDEN
                },
                maxWritableVisibility: "PRIVATE"
            }
        },
        EDITORNAME: "State Machine",
        EDITMENU: {
            editBtn: {
                index: -1,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: "EditEntityButton",
                    plugins: [{
                            fn: "EditFSMAction"
                        }
                    ]
                }
            }
        },
        METHODS: {
            enable: {
                label: "activate",
                arguments: [SELFARG]
            },
            disable: {
                label: "deactivate",
                arguments: [SELFARG]
            },
            isEnabled: {
                label: "is active",
                arguments: [SELFARG],
                returns: BOOLEAN,
                localEval: function(self) {
                    return this.getInstance(self).get("enabled");
                }
            },
            isDisabled: {
                label: "is inactive",
                arguments: [SELFARG],
                returns: BOOLEAN,
                localEval: function(self) {
                    return !this.getInstance(self).get("enabled");
                }
            },
            wentThroughState: {
                label: "went through state",
                returns: BOOLEAN,
                arguments: [
                    SELFARG,
                    {
                        type: NUMBER,
                        view: {
                            type: "entityarrayfieldselect",
                            returnAttr: "index",
                            field: "states"
                        }
                    }
                ]
            },
            notWentThroughState: {
                label: "did not went through state",
                returns: BOOLEAN,
                arguments: [
                    SELFARG,
                    {
                        type: NUMBER,
                        view: {
                            type: "entityarrayfieldselect",
                            returnAttr: "index",
                            field: "states"
                        }
                    }
                ]
            }
        }
    });
    /*
     * State Entity
     */
    persistence.State = Y.Base.create("State", persistence.Entity, [], {
        // *** Lifecycle methods *** //
        initializer: function() {
        },
        getEditorLabel: function() {
            return "#" + this.get("index") + ": " + this.get("label");
        }
        // *** Private methods *** //
    }, {
        ATTRS: {
            "@class": {
                value: "State"
            },
            stateMachineId: IDATTRDEF,
            version: VERSION_ATTR_DEF,
            label: {
                type: [NULL, STRING],
                "transient": false,
                view: {
                    label: "Label"
                }
            },
            index: {
                type: [NULL, NUMBER],
                "transient": true,
                view: {
                    label: "hidden"
                }
            },
            onEnterEvent: {
                type: [NULL, OBJECT],
                properties: {
                    "@class": {type: "string", value: "Script", view: {type: HIDDEN}},
                    content: {
                        type: STRING
                    }
                },
                view: {
                    label: "On enter impact",
                    type: SCRIPT
                }
            },
            transitions: {
                type: ARRAY,
                value: [],
                view: {type: HIDDEN}
            },
            editorPosition: {
                valueFn: function() {
                    return new persistence.Coordinate({
                        x: 30,
                        y: 30
                    });
                },
                view: {
                    label: 'Box position',
                    className: 'wegas-advanced-feature'
                },
                properties: {
                    "@class": {
                        type: STRING,
                        value: "Coordinate",
                        view: {type: HIDDEN}
                    }
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
            },
            triggerCondition: {
                type: [NULL, OBJECT],
                properties: {
                    "@class": {type: STRING, value: "Script"},
                    content: {
                        type: STRING
                    }
                },
                view: {
                    type: 'scriptcondition',
                    label: 'Conditions'
                }
            },
            version: VERSION_ATTR_DEF,
            stateId: IDATTRDEF,
            stateMachineId: IDATTRDEF,
            preStateImpact: {
                type: [NULL, OBJECT],
                properties: {
                    "@class": {type: "string", value: "Script", view: {type: HIDDEN}},
                    content: {
                        type: STRING
                    }
                },
                view: {
                    label: 'Impacts',
                    type: SCRIPT
                }
            },
            nextStateId: {
                type: NUMBER,
                view: {
                    type: HIDDEN
                }
            },
            index: {
                type: NUMBER,
                value: 0,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Index'
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
                        value: 'TriggerInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    currentStateId: {
                        type: NUMBER,
                        view: {
                            label: 'Initial state id',
                            type: HIDDEN
                        }
                    },
                    descriptorId: {
                        type: NUMBER,
                        view: {type: HIDDEN}
                    },
                    id: IDATTRDEF,
                    enabled: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            label: 'Active by default'
                        }
                    },
                    transitionHistory: {
                        value: [],
                        type: ARRAY,
                        view: {type: HIDDEN}
                    }
                }
            },
            disableSelf: {
                type: BOOLEAN,
                value: true,
                index: 1,
                view: {
                    label: 'Disable itself',
                    description: 'Disable once triggered. May be rearmed afterwards'
                }
            },
            oneShot: {
                type: BOOLEAN,
                value: false,
                index: 2,
                view: {
                    label: 'Only once',
                    description: 'Allowed to trigger only once',
                }
            },
            triggerEvent: {
                type: [NULL, OBJECT],
                index: 3,
                properties: {
                    "@class": {type: STRING, value: "Script"},
                    content: {
                        type: STRING
                    }
                },
                view: {
                    type: 'scriptcondition',
                    label: 'Conditions'
                }
            },
            postTriggerEvent: {
                type: ["null", OBJECT],
                properties: {
                    "@class": {type: "string", value: "Script", view: {type: HIDDEN}},
                    content: {
                        type: STRING,
                        value: ""
                    }
                },
                index: 4,
                view: {
                    type: SCRIPT,
                    label: 'Impacts'
                }
            },
            states: {
                "transient": true
            }
        },
        EDITMENU: {
            editBtn: {
                index: -1,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: "EditEntityButton"
                }
            }
        }
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
                type: NUMBER,
                view: {
                    type: HIDDEN
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
            states: {
                valueFn: function() {
                    return {
                        1: new persistence.DialogueState({})
                    };
                }
                /*writeOnce: "initOnly",*/
            }
        },
        EDITORNAME: "Dialog",
        EDITMENU: {
            editBtn: {
                index: -1,
                maxVisibility: "INTERNAL",
                cfg: {
                    type: "EditEntityButton",
                    plugins: [{
                            fn: "EditFSMAction",
                            cfg: {
                                viewerCfg: {
                                    availableStates: [/*"State",*/ "DialogueState"],
                                    availableTransitions: [/*"Transition",*/ "DialogueTransition"]
                                }
                            }
                        }]
                }
            }
        }
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
            actionText: Y.Wegas.Helper.getTranslationAttr({
                label: "Text",
                index: -1,
                type: HTML
            })
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
                }).sort(function(a, b) {
                    return a.get("index") - b.get("index");
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
        },
        getEditorLabel: function() {
            return "#" + this.get("index");
        }
    }, {
        EDITORNAME: "server text",
        ATTRS: {
            "@class": {
                value: "DialogueState"
            },
            version: VERSION_ATTR_DEF,

            text: Y.Wegas.Helper.getTranslationAttr({
                label: "Text",
                index: -1,
                type: HTML
            }),
            label: {
                view: {
                    type: HIDDEN
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
