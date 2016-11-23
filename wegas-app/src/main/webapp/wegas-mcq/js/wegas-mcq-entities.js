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
YUI.add('wegas-mcq-entities', function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array",
        SELF = "self", BOOLEAN = "boolean", BUTTON = "Button", OBJECT = "object",
        HTML = "html", SCRIPT = "script", NUMBER = "number",
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        VERSION_ATTR_DEF,
        IDATTRDEF;

    VERSION_ATTR_DEF = {
        type: NUMBER,
        optional: true,
        _inputex: {
            _type: HIDDEN
        }
    };


    IDATTRDEF = {
        type: STRING,
        optional: true, // The id is optional for entites that have not been persisted
        _inputex: {
            _type: HIDDEN
        }
    };

    /**
     * QuestionDescriptor mapper
     */
    persistence.QuestionDescriptor = Y.Base.create("QuestionDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        getRepliesByStartTime: function(startTime) {
            return this.getInstance().getRepliesByStartTime(startTime);
        }
    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "QuestionDescriptor"
            },
            items: {
                type: ARRAY,
                value: [],
                "transient": true,
                _inputex: {
                    _type: HIDDEN
                },
                setter: function(val) {
                    for (var i = 0; i < val.length; i = i + 1) {                // We set up a back reference to the parent
                        val[i].parentDescriptor = this;
                    }
                    return val;
                }
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
            allowMultipleReplies: {
                value: false,
                type: BOOLEAN,
                _inputex: {
                    label: 'Allow multiple replies',
                    index: 8
                }
            },
            cbx: {
                type: BOOLEAN,
                value: false,
                _inputex: {
                    label: "Checkbox answers",
                    description: "For standard multiple-choice questions",
                    index: 9
                }
            },
            tabular: {
                type: BOOLEAN,
                value: false,
                _inputex: {
                    label: "Tabular layout",
                    description: "Replies are presented horizontally",
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature',
                    index: 10
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true,
                _inputex: {
                    index: 11
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
                    version: VERSION_ATTR_DEF,
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active from start',
                            value: true
                        }
                    }
                },
                _inputex: {
                    index: 3
                }
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
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
                }
            }
        },
        EDITMENU: [{
                type: "EditEntityButton"
            }, {
                type: BUTTON,
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add choice",
                plugins: [{
                        fn: "WidgetMenu",
                        cfg: {
                            children: [{
                                    type: BUTTON,
                                    label: "Standard",
                                    plugins: [{
                                            fn: "AddEntityChildAction",
                                            cfg: {
                                                targetClass: "SingleResultChoiceDescriptor"
                                            }
                                        }]
                                }, {
                                    type: BUTTON,
                                    label: "Conditional results",
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
                label: "Copy",
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
            isNotReplied: {
                label: "has not been replied",
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
        getRepliesByStartTime: function(startTime) {
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
            validated: {
                value: false,
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
    Wegas.persistence.ChoiceDescriptor = Y.Base.create("ChoiceDescriptor",
        Wegas.persistence.VariableDescriptor,
        [], {
        getIconCss: function() {
            return "fa fa-check-square-o";
        }
    },
        {
            ATTRS: {
                "@class": {
                    value: "ChoiceDescriptor"
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
                        version: VERSION_ATTR_DEF,
                        active: {
                            type: BOOLEAN,
                            _inputex: {
                                label: 'Active from start',
                                value: true
                            }
                        },
                        currentResultName: {
                            type: NUMBER,
                            optional: true,
                            _inputex: {
                                _type: "entityarrayfieldselect",
                                label: "Default result",
                                returnAttr: "name",
                                field: "results"
                            }
                        }
                    },
                    _inputex: {
                        index: 2
                    }
                },
                duration: {
                    value: 1,
                    type: STRING,
                    optional: true,
                    _inputex: {
                        _type: HIDDEN
                    }
                },
                cost: {
                    type: STRING,
                    optional: true,
                    value: 0,
                    _inputex: {
                        _type: HIDDEN
                    }
                },
                results: {
                    type: ARRAY,
                    value: [],
                    _inputex: {
                        _type: HIDDEN,
                        index: 3
                    }
                },
                addShortcut: {
                    type: STRING,
                    "transient": true,
                    value: "Result",
                    _inputex: {
                        _type: HIDDEN
                    }
                }
            },
            EDITMENU: [{
                    type: "EditEntityButton"
                }, {
                    type: BUTTON,
                    label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add result",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                targetClass: "Result",
                                method: "POST",
                                attributeKey: "results",
                                showEditionAfterRequest: true
                            }
                        }]
                }, {
                    type: BUTTON,
                    label: "Copy",
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
                },
                isActive: {
                    label: "is active",
                    returns: BOOLEAN,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }]
                },
                setCurrentResult: {
                    label: "set current result",
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            type: "entityarrayfieldselect",
                            returnAttr: "name",
                            field: "results",
                            scriptType: STRING
                        }]
                },
                hasBeenSelected: {
                    label: "has been selected",
                    returns: BOOLEAN,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }]
                },
                hasNotBeenSelected: {
                    label: "has not been selected",
                    returns: BOOLEAN,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }]
                },
                hasBeenIgnored: {
                    label: "has been ignored",
                    returns: BOOLEAN,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }]
                },
                hasResultBeenApplied: {
                    label: "has result been applied",
                    returns: BOOLEAN,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }, {
                            type: "entityarrayfieldselect",
                            returnAttr: "name",
                            field: "results",
                            scriptType: STRING
                        }
                    ]
                }
            }
        });
    /**
     * ChoiceDescriptor mapper
     */
    Wegas.persistence.SingleResultChoiceDescriptor = Y.Base.create("SingleResultChoiceDescriptor",
        Wegas.persistence.ChoiceDescriptor,
        [],
        {
            getIconCss: function() {
                return "fa fa-check-square-o";
            }
        },
        {
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
                        version: VERSION_ATTR_DEF,
                        active: {
                            type: BOOLEAN,
                            _inputex: {
                                label: 'Active from start',
                                value: true
                            }
                        },
                        currentResultName: {
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
                            version: {
                                type: NUMBER,
                                optional: true,
                                value: 0,
                                _inputex: {
                                    _type: "uneditable",
                                    wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-advanced-feature",
                                    index: -1
                                }
                            },
                            name: {
                                type: STRING,
                                optional: true,
                                _inputex: {
                                    _type: HIDDEN
                                }
                            },
                            label: {
                                type: STRING,
                                optional: true,
                                _inputex: {
                                    _type: HIDDEN
                                }
                            },
                            answer: {
                                type: STRING,
                                optional: true,
                                format: HTML,
                                _inputex: {
                                    label: "Feedback",
                                    index: 1
                                }
                            },
                            impact: {
                                optional: true,
                                _inputex: {
                                    _type: SCRIPT,
                                    label: "Impact on variables",
                                    index: 2
                                }
                            },
                            "": {
                                optional: true,
                                type: "uneditable",
                                transient: true,
                                _inputex: {
                                    label: "<div style=\"height:60px\"><div style=\"position:absolute;margin-top:30px;\"><b>ONLY&nbsp;FOR&nbsp;CHECKBOX&nbsp;REPLIES:</b></div></div>",
                                    index: 3
                                }
                            },
                            ignorationAnswer: {
                                type: STRING,
                                optional: true,
                                format: HTML,
                                _inputex: {
                                    label: "Feedback<br/>when ignored",
                                    index: 4
                                }
                            },
                            ignorationImpact: {
                                optional: true,
                                _inputex: {
                                    _type: SCRIPT,
                                    label: "Impact on variables<br/>when ignored",
                                    index: 5
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
                                    _type: HIDDEN,
                                    value: []
                                }
                            }
                        }
                    },
                    _inputex: {
                        label: null,
                        index: 4,
                        useButtons: false,
                        listAddLabel: " ",
                        listRemoveLabel: " ",
                        wrapperClassName: "inputEx-fieldWrapper-nomargin"
                    }
                },
                addShortcut: {
                    type: STRING,
                    "transient": true,
                    value: "",
                    _inputex: {
                        _type: HIDDEN
                    }
                }
            },
            EDITORNAME: "Choice",
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
                },
                hasBeenSelected: {
                    label: "has been selected",
                    returns: BOOLEAN,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }]
                },
                hasNotBeenSelected: {
                    label: "has not been selected",
                    returns: BOOLEAN,
                    arguments: [{
                            type: HIDDEN,
                            value: SELF
                        }]
                },
                hasBeenIgnored: {
                    label: "has been ignored",
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
     * MCQ Result mapper
     */
    persistence.Result = Y.Base.create("Result", persistence.Entity, [], {
        getChoiceDescriptor: function() {
            return Wegas.Facade.Variable.cache.findById(this.get("choiceDescriptorId"));
        },
        getLabel: function() {
            return this.get("label");
        },
        getEditorLabel: function() {
            return this.get("label");
        },
        getIconCss: function() {
            return "fa fa-cog";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "Result"
            },
            version: {
                type: NUMBER,
                optional: false,
                value: 0,
                _inputex: {
                    _type: "uneditable",
                    wrapperClassName: "inputEx-fieldWrapper inputEx-uneditableField wegas-advanced-feature",
                    index: -1
                }
            },
            label: {
                type: STRING,
                "transient": false,
                getter: function(val) {
                    return val || this.get("name");
                },
                _inputex: {
                    label: "Name",
                    index: -1
                }
            },
            name: {
                value: null,
                type: STRING,
                optional: true,
                _inputex: {
                    wrapperClassName: "wegas-advanced-feature",
                    label: "Script alias",
                    index: -1,
                    //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                    description: "Alphanumeric characters,'_','$'. Without a digit as first character.<br/>Changing this may break your scripts."
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            answer: {
                type: STRING,
                optional: true,
                format: HTML,
                _inputex: {
                    label: "Feedback when selected",
                    index: 3
                }
            },
            impact: {
                optional: true,
                _inputex: {
                    _type: SCRIPT,
                    label: "Impact when selected",
                    index: 4
                }
            },
            ignorationAnswer: {
                type: STRING,
                optional: true,
                format: HTML,
                _inputex: {
                    label: "Feedback when ignored",
                    index: 6
                }
            },
            ignorationImpact: {
                optional: true,
                _inputex: {
                    _type: SCRIPT,
                    label: "Impact on variables when ignored",
                    index: 7
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
                    _type: HIDDEN,
                    value: []
                }
            }
        },
        EDITMENU: [{
                type: BUTTON,
                label: "Edit",
                plugins: [{
                        fn: "EditEntityArrayFieldAction",
                        cfg: {
                            attributeKey: "results"
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Copy",
                plugins: [{
                        fn: "EditEntityArrayFieldAction",
                        cfg: {
                            method: "copy",
                            attributeKey: "results"
                        }
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
    persistence.ChoiceInstance = Y.Base.create("ChoiceInstance", persistence.VariableInstance, [], {}, {
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
            currentResultName: {
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
    persistence.Reply = Y.Base.create("Reply", persistence.Entity, [], {
        getChoiceDescriptor: function() {
            if (this.get("result")) {
                return this.get("result").getChoiceDescriptor();
            }
        },
        /**
         *  @return 0 if is finished, 1 if ongoing and 2 if planified
         */
        getStatus: function(time) {
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
                setter: function(val) {
                    return val * 1;
                }
            },
            ignored: {
                type: BOOLEAN,
                _inputex: {
                    label: 'Is ignored'
                }
            },
            result: {
                _inputex: {
                    _type: HIDDEN
                },
                "transient": true
            }
        }
    });
});

