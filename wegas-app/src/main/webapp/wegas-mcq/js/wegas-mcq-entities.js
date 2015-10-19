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
                    index: 9
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true,
                _inputex: {
                    index: 10
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
                                    label: "Conditionnal results",
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
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default',
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
                    active: {
                        type: BOOLEAN,
                        _inputex: {
                            label: 'Active by default',
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
                                label: "Impact text"
                            }
                        },
                        impact: {
                            optional: true,
                            _inputex: {
                                _type: SCRIPT,
                                label: "Impact"
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
                    label: "Impact text"
                }
            },
            impact: {
                optional: true,
                _inputex: {
                    _type: SCRIPT,
                    label: "Impact"
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
            result: {
                _inputex: {
                    _type: HIDDEN
                },
                "transient": true
            }
        }
    });
});

