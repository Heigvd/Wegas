/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-mcq-entities', function (Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
    SELF = "self", BOOLEAN = "boolean", BUTTON = "Button", OBJECT = "object",
    HTML = "html", SCRIPT = "script",
    IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    },
    Wegas = Y.Wegas;

    /**
     * QuestionDescriptor mapper
     */
    Y.namespace("Wegas.persistence").QuestionDescriptor = Y.Base.create("QuestionDescriptor", Wegas.persistence.ListDescriptor, [], {
        getRepliesByStartTime: function (startTime) {
            return this.getInstance().getRepliesByStartTime(startTime);
        }
    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "QuestionDescriptor"
            },
            allowMultipleReplies: {
                value: false,
                type: BOOLEAN,
                _inputex: {
                    label: 'Allow multiple replies'
                }
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: "QuestionInstance"
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    }
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true
            },

            pictures: {
                optional: true,
                type: ARRAY,
                items: {
                    type: STRING,
                    optional: true,
                    _inputex: {
                        _type: "wegasurl",
                        label: ""
                    }
                },
                _inputex: {
                    useButtons: true
                }
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: BUTTON,
            label: "Add",
            plugins: [{
                "fn": "WidgetMenu",
                "cfg": {
                    "menuCfg": {
                        points: ["tl", "tr"]
                    },
                    "event": "mouseenter",
                    "children": [{
                        type: BUTTON,
                        label: "Add a choice",
                        plugins: [{
                            fn: "AddEntityChildAction",
                            cfg: {
                                targetClass: "SingleResultChoiceDescriptor"
                            }
                        }]
                    }, {
                        type: BUTTON,
                        label: "Add a choice with multiple results",
                        plugins: [{
                            fn: "AddEntityChildAction",
                            cfg: {
                                targetClass: "ChoiceDescriptor"
                            }
                        }]
                    }]
                }
            }]
        }, {
            type: BUTTON,
            label: "Duplicate",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "DeleteEntityButton"
        }],
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {
            activate: {
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            desactivate: {
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            isReplied: {
                label: "has been replied",
                returns: BOOLEAN,
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            isActive: {
                label: "is active",
                returns: BOOLEAN,
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            }
        }
    });

    /**
     * QuestionInstance mapper
     */
    Wegas.persistence.QuestionInstance = Y.Base.create("QuestionInstance", Wegas.persistence.VariableInstance, [], {
        getRepliesByStartTime: function (startTime) {
            var i, ret = [], replies = this.get("replies");
            for (i = 0; i < replies.length; i = i + 1) {
                if (replies[i].get("startTime") === startTime) {
                    ret.push(replies[i]);
                }
            }
            return ret;
        }
    }, {
        ATTRS: {
            "@class": {
                value: "QuestionInstance"
            },
            active: {
                value: true,
                type: BOOLEAN
            },
            unread: {
                value: true,
                type: BOOLEAN
            },
            replies: {
                value: [],
                type: ARRAY,
                _inputex: {
                    _type: HIDDEN
                }
            }
        }
    });

    /**
     * ChoiceDescriptor mapper
     */
    Wegas.persistence.ChoiceDescriptor = Y.Base.create("ChoiceDescriptor", Wegas.persistence.VariableDescriptor, [], {}, {
        ATTRS: {
            "@class": {
                value: "ChoiceDescriptor"
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true,
                _inputex: {
                    opts: {
                        height: '50px'
                    }
                }
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'ChoiceInstance'
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    },
                    currentResultId: {
                        type: STRING,
                        optional: true,
                        _inputex: {
                            _type: "entityarrayfieldselect",
                            label: "Default result"
                        }
                    }
                }
            },
            duration: {
                value: 1,
                type: STRING,
                optional: true,
                _inputex: {
                    description: "Only for crimesim evidences"
                }
            },
            cost: {
                type: STRING,
                optional: true,
                value: 0,
                _inputex: {
                    label: "Human resource consumption",
                    description: "Only for crimesim evidences"
                }
            },
            results: {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            }
        //impact: {
        //    _inputex: {
        //        _type: SCRIPT
        //    },
        //    optional: true
        //},
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: BUTTON,
            label: "Add result",
            plugins: [{
                fn: "EditEntityArrayFieldAction",
                cfg: {
                    targetClass: "Result",
                    method: "POST",
                    attributeKey: "results"
                }
            }]
        }, {
            type: BUTTON,
            label: "Duplicate",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "DeleteEntityButton"
        }],
        METHODS: {
            setCurrentResult: {
                label: "set current result",
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }, {
                    type: "entityarrayfieldselect"
                }]
            },
            activate: {
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            desactivate: {
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            isActive: {
                label: "is active",
                returns: BOOLEAN,
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            }
        }
    });

    /**
     * ChoiceDescriptor mapper
     */
    Wegas.persistence.SingleResultChoiceDescriptor = Y.Base.create("SingleResultChoiceDescriptor", Wegas.persistence.ChoiceDescriptor, [], {}, {
        ATTRS: {
            "@class": {
                value: "SingleResultChoiceDescriptor"
            },
            defaultInstance: {
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'ChoiceInstance'
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    },
                    currentResultId: {
                        type: STRING,
                        optional: true,
                        _inputex: {
                            _type: HIDDEN
                        }
                    }
                }
            },
            results: {
                type: ARRAY,
                value: [{
                    "@class": "Result"
                }],
                items: {
                    type: OBJECT,
                    optional: true,
                    properties: {
                        id: IDATTRDEF,
                        "@class": {
                            type: STRING,
                            _inputex: {
                                _type: HIDDEN
                            }
                        },
                        name: {
                            type: STRING,
                            optional: true,
                            _inputex: {
                                _type: HIDDEN
                            }
                        },
                        answer: {
                            type: STRING,
                            optional: true,
                            format: HTML
                        },
                        impact: {
                            optional: true,
                            _inputex: {
                                _type: SCRIPT
                            }
                        },
                        choiceDescriptorId: {
                            type: STRING,
                            optional: true,
                            _inputex: {
                                _type: HIDDEN
                            }
                        },
                        files: {
                            optional: true,
                            type: ARRAY,
                            items: {
                                type: STRING,
                                optional: false,
                                _inputex: {
                                    _type: "wegasurl",
                                    label: ""
                                }
                            },
                            _inputex: {
                                useButtons: true
                            }
                        }
                    }
                },
                _inputex: {
                    label: null,
                    listAddLabel: " ",
                    listRemoveLabel: " ",
                    wrapperClassName: "inputEx-fieldWrapper-nomargin"
                }
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: BUTTON,
            label: "Duplicate",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "DeleteEntityButton"
        }],
        METHODS: {
            activate: {
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            },
            desactivate: {
                arguments: [{
                    type: HIDDEN,
                    value: SELF
                }]
            }
        }
    });
    /**
     * MCQ Result mapper
     */
    Wegas.persistence.Result = Y.Base.create("Result", Wegas.persistence.Entity, [], {
        getChoiceDescriptor: function () {
            return Wegas.VariableDescriptorFacade.rest.findById(this.get("choiceDescriptorId"));
        }
    }, {
        ATTRS: {
            "@class": {
                value: "Result"
            },
            name: {
                type: STRING
            },
            answer: {
                type: STRING,
                format: HTML
            },
            impact: {
                _inputex: {
                    _type: SCRIPT
                }
            },
            choiceDescriptorId: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: HIDDEN
                }
            },
            files: {
                optional: true,
                type: ARRAY,
                items: {
                    type: STRING,
                    optional: true,
                    _inputex: {
                        _type: "wegasurl",
                        label: ""
                    }
                },
                _inputex: {
                    useButtons: true
                }
            }
        },
        EDITMENU: [{
            type: BUTTON,
            label: "Edit",
            plugins: [{
                fn: "EditEntityArrayFieldAction"
            }]
        }, {
            type: BUTTON,
            label: "Delete",
            plugins: [{
                fn: "EditEntityArrayFieldAction",
                cfg: {
                    method: "delete",
                    attributeKey: "results"
                }
            }]
        }]
    });
    /**
     * MCQ ChoiceInstance mapper
     */
    Wegas.persistence.ChoiceInstance = Y.Base.create("ChoiceInstance", Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "ChoiceInstance"
            },
            active: {
                value: true,
                type: BOOLEAN
            },
            unread: {
                value: true,
                type: BOOLEAN
            },
            currentResultId: {
                type: STRING,
                _inputex: {
                    _type: HIDDEN
                }
            }
        }
    });
    /**
     * MCQ Reply mapper
     */
    Wegas.persistence.Reply = Y.Base.create("Reply", Wegas.persistence.Entity, [], {
        getChoiceDescriptor: function () {
            if (this.get("result")) {
                return this.get("result").getChoiceDescriptor();
            }
        },
        /**
         *  @return 0 if is finished, 1 if ongoing and 2 if planified
         */
        getStatus: function (time) {
            var choiceDescriptor = this.getChoiceDescriptor();

            if ((this.get("startTime") + choiceDescriptor.get("duration")) <= time) {
                return 0;
            } else if (this.get("startTime") <= time) {
                return 1;
            } else {
                return 2;
            }
        }
    }, {
        ATTRS: {
            "@class": {
                value: "Reply"
            },
            choiceDescriptorId: {
                type: STRING,
                optional: true,
                _inputex: {
                    _type: HIDDEN
                }
            },
            unread: {
                type: BOOLEAN,
                value: true,
                _inputex: {
                    label: 'Is unread'
                }
            },
            startTime: {
                type: STRING,
                setter: function (val) {
                    return val * 1;
                }
            },
            result: {
                _inputex: {
                    _type: HIDDEN
                },
                "transient" : true
            }
        }
    });
});

