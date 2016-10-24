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
YUI.add('wegas-mcq-entities', function (Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array",
        SELF = "self", BOOLEAN = "boolean", BUTTON = "Button", OBJECT = "object",
        HTML = "html", SCRIPT = "script", NUMBER = "number",
        NULLSTRING = ["null", STRING],
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        VERSION_ATTR_DEF,
        SELFARG,
        IDATTRDEF;

    VERSION_ATTR_DEF = {
        type: NUMBER,
        view: {
            type: HIDDEN
        }
    };


    IDATTRDEF = {
        type: NUMBER,
        optional: true, // The id is optional for entites that have not been persisted
        view: {
            type: HIDDEN
        }
    };
    SELFARG = {
        type: 'identifier',
        value: 'self',
        view: { type: HIDDEN }
    };

    /**
     * QuestionDescriptor mapper
     */
    persistence.QuestionDescriptor = Y.Base.create("QuestionDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        getRepliesByStartTime: function (startTime) {
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
                view: {
                    type: HIDDEN
                },
                setter: function (val) {
                    for (var i = 0; i < val.length; i = i + 1) {                // We set up a back reference to the parent
                        val[i].parentDescriptor = this;
                    }
                    return val;
                }
            },
            title: {
                type: NULLSTRING,
                optional: true,
                index: -1,
                view: {
                    label: "Label",
                    description: "Displayed to players"
                }
            },
            allowMultipleReplies: {
                value: false,
                type: BOOLEAN,
                index: 8,
                view: {
                    label: 'Allow multiple replies'
                }
            },
            cbx: {
                type: BOOLEAN,
                value: false,
                view: {
                    label: "Checkbox selection",
                    description: "Pour QCM standard",
                },
                index: 9
            },
            tabular: {
                type: BOOLEAN,
                value: false,
                view: {
                    label: "Tabular layout",
                    description: "Replies are presented horizontally",
                    className: 'wegas-advanced-feature'
                },
                index: 10
            },
            description: {
                type: NULLSTRING,
                format: HTML,
                index: 11,
                view: { type: HTML, label: "Description" }
            },
            defaultInstance: {
                type: "object",
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "QuestionInstance",
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    descriptorId: IDATTRDEF,
                    unread: {
                        value: true,
                        type: BOOLEAN,
                        view: { type: HIDDEN }
                    },
                    validated: {
                        value: false,
                        type: BOOLEAN,
                        view: { type: HIDDEN }
                    },
                    replies: {
                        value: [],
                        type: ARRAY,
                        view: {
                            type: HIDDEN
                        }
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            label: 'Active from start'
                        }
                    }
                },
                index: 3
            },
            pictures: {
                type: ARRAY,
                items: {
                    type: STRING,
                    view: {
                        type: "wegasimageurl",
                        label: "URL"
                    }
                },
                view: {
                    className: 'wegas-advanced-feature'
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
                arguments: [SELFARG]
            },
            desactivate: {
                arguments: [SELFARG]
            },
            isReplied: {
                label: "has been replied",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            isNotReplied: {
                label: "has not been replied",
                returns: BOOLEAN,
                arguments: [SELFARG]
            },
            isActive: {
                label: "is active",
                returns: BOOLEAN,
                arguments: [SELFARG]
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
            validated: {
                value: false,
                type: BOOLEAN
            },
            replies: {
                value: [],
                type: ARRAY,
                view: {
                    type: HIDDEN
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
            getIconCss: function () {
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
                    index: -1,
                    view: {
                        label: "Label",
                        description: "Displayed to players"
                    }
                },
                description: {
                    type: NULLSTRING,
                    optional: true,
                    view: {
                        type: HTML,
                        label: "Description"
                    }
                },
                defaultInstance: {
                    properties: {
                        '@class': {
                            type: STRING,
                            value: 'ChoiceInstance',
                            view: {
                                type: HIDDEN,
                            }
                        },
                        id: IDATTRDEF,
                        version: VERSION_ATTR_DEF,
                        descriptorId: IDATTRDEF,
                        unread: {
                            type: BOOLEAN,
                            view: { type: HIDDEN }
                        },
                        active: {
                            type: BOOLEAN,
                            value: true,
                            view: {
                                label: 'Active from start',
                            }
                        },
                        currentResultName: {
                            type: NULLSTRING,
                            optional: true,
                            view: {
                                type: "entityarrayfieldselect",
                                label: "Default result",
                                returnAttr: "name",
                                field: "results"
                            }
                        }
                    },
                    index: 2
                },
                duration: {
                    value: 1,
                    type: NUMBER,
                    optional: true,
                    view: {
                        type: HIDDEN
                    }
                },
                cost: {
                    type: NUMBER,
                    optional: true,
                    value: 0,
                    view: {
                        type: HIDDEN
                    }
                },
                results: {
                    type: ARRAY,
                    value: [],
                    index: 3,
                    view: {
                        type: HIDDEN,
                    }
                },
                addShortcut: {
                    type: STRING,
                    "transient": true,
                    value: "Result",
                    view: {
                        type: HIDDEN
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
                    arguments: [SELFARG]
                },
                desactivate: {
                    arguments: [SELFARG]
                },
                isActive: {
                    label: "is active",
                    returns: BOOLEAN,
                    arguments: [SELFARG]
                },
                setCurrentResult: {
                    label: "set current result",
                    arguments: [
                        SELFARG, {
                            type: STRING,
                            view: {
                                type: "entityarrayfieldselect",
                                returnAttr: "name",
                                field: "results",
                            }
                        }]
                },
                hasBeenSelected: {
                    label: "has been selected",
                    returns: BOOLEAN,
                    arguments: [SELFARG]
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
                    arguments: [
                        SELFARG, {
                            type: STRING,
                            view: {
                                type: "entityarrayfieldselect",
                                returnAttr: "name",
                                field: "results",
                            }
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
            getIconCss: function () {
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
                            value: 'ChoiceInstance',
                            view: {
                                type: HIDDEN
                            }
                        },
                        id: IDATTRDEF,
                        version: VERSION_ATTR_DEF,
                        descriptorId: IDATTRDEF,
                        unread: {
                            type: BOOLEAN,
                            view: { type: HIDDEN }
                        },
                        active: {
                            type: BOOLEAN,
                            value: true,
                            view: {
                                label: 'Active from start'
                            }
                        },
                        currentResultName: {
                            type: NULLSTRING,
                            view: {
                                type: HIDDEN
                            }
                        }
                    }
                },
                results: {
                    type: ARRAY,
                    value: [{
                        "@class": "Result"
                    }],
                    view: { type: ARRAY },
                    items: {
                        type: OBJECT,
                        optional: true,
                        properties: {
                            id: IDATTRDEF,
                            "@class": {
                                value: "Result",
                                type: STRING,
                                view: {
                                    type: HIDDEN
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
                                view: {
                                    type: HIDDEN
                                }
                            },
                            label: {
                                type: NULLSTRING,
                                optional: true,
                                view: {
                                    type: HIDDEN
                                }
                            },
                            answer: {
                                type: NULLSTRING,
                                optional: true,
                                index: 1,
                                view: {
                                    type: HTML,
                                    label: "Feedback"
                                }
                            },
                            impact: {
                                optional: true,
                                index: 2,
                                type: ["null", OBJECT],
                                properties: {
                                    "@class": { type: "string", value: "Script", view: { type: HIDDEN } },
                                    content: {
                                        type: STRING
                                    }
                                },
                                view: {
                                    label: "Impact on variables",
                                    type: SCRIPT
                                }
                            },
                            ignorationAnswer: {
                                type: NULLSTRING,
                                index: 4,
                                visible: function (val, formVal) {
                                    var parent = Y.Wegas.Facade.Variable.cache.findById(formVal.parentDescriptorId);
                                    return parent ? parent.get("cbx") : false;
                                },
                                view: {
                                    type: HTML,
                                    label: "Feedback when ignored",
                                    legend: "Only for checkbox replies"
                                }
                            },
                            ignorationImpact: {
                                type: ["null", OBJECT],
                                properties: {
                                    "@class": { type: "string", value: "Script", view: { type: HIDDEN } },
                                    content: {
                                        type: STRING
                                    }
                                },
                                visible: function (val, formVal) {
                                    var parent = Y.Wegas.Facade.Variable.cache.findById(formVal.parentDescriptorId);
                                    return parent ? parent.get("cbx") : false;
                                },
                                view: {
                                    label: "Impact on variables when ignored",
                                    type: SCRIPT
                                },
                                index: 5,

                            },
                            choiceDescriptorId: IDATTRDEF,
                            files: {
                                optional: true,
                                value: [],
                                type: ARRAY,
                                items: {
                                    type: STRING,
                                    required: true,
                                    view: {
                                        type: "wegasurl",
                                        label: ""
                                    }
                                },
                                view: {
                                    type: HIDDEN
                                }
                            }
                        }
                    }
                },
                addShortcut: {
                    type: STRING,
                    "transient": true,
                    value: "",
                    view: {
                        type: HIDDEN
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
                    arguments: [SELFARG]
                },
                desactivate: {
                    arguments: [SELFARG]
                },
                hasBeenSelected: {
                    label: "has been selected",
                    returns: BOOLEAN,
                    arguments: [SELFARG]
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
                    arguments: [SELFARG]
                }
            }
        });
    /**
     * MCQ Result mapper
     */
    persistence.Result = Y.Base.create("Result", persistence.Entity, [], {
        getChoiceDescriptor: function () {
            return Wegas.Facade.Variable.cache.findById(this.get("choiceDescriptorId"));
        },
        getLabel: function () {
            return this.get("label");
        },
        getEditorLabel: function () {
            return this.get("label");
        },
        getIconCss: function () {
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
                getter: function (val) {
                    return val || this.get("name");
                },
                index: -1,
                view: {
                    label: "Name"
                }
            },
            name: {
                value: "",
                type: NULLSTRING,
                optional: true,
                index: -1,
                view: {
                    className: "wegas-advanced-feature",
                    label: "Script alias",
                        //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                    description: "Alphanumeric characters,'_','$'. Without a digit as first character.<br/>Changing this may break your scripts."
                },
                validator: function (s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            answer: {
                type: STRING,
                optional: true,
                view: {
                    type: HTML,
                    label: "Feedback when selected",
                    index: 3
                }
            },
            impact: {
                type: ["null", OBJECT],
                properties: {
                    "@class": { type: "string", value: "Script", view: { type: HIDDEN } },
                    content: {
                        type: STRING
                    }
                },
                view: {
                    label: "Impact when selected",
                    type: SCRIPT
                }
            },
            ignorationAnswer: {
                type: STRING,
                optional: true,
                visible: function (val, formVal) {
                    var parent = Y.Wegas.Facade.Variable.cache.findById(formVal.choiceDescriptorId);
                    return parent ? parent.parentDescriptor.get("cbx") : false;
                },
                view: {
                    type: HTML,
                    label: "Feedback when ignored",
                    index: 6
                }
            },
            ignorationImpact: {
                type: ["null", OBJECT],
                properties: {
                    "@class": { type: "string", value: "Script", view: { type: HIDDEN } },
                    content: {
                        type: STRING
                    }
                },
                visible: function (val, formVal) {
                    var parent = Y.Wegas.Facade.Variable.cache.findById(formVal.choiceDescriptorId);
                    return parent ? parent.parentDescriptor.get("cbx") : false;
                },
                view: {
                    label: "Impact on variables when ignored",
                    type: SCRIPT
                }
            },
            choiceDescriptorId: {
                type: STRING,
                optional: true,
                view: {
                    type: HIDDEN
                }
            },
            files: {
                optional: true,
                type: ARRAY,
                value: [],
                items: {
                    type: STRING,
                    optional: true,
                    view: {
                        type: "wegasurl",
                        label: ""
                    }
                },
                view: {
                    type: HIDDEN
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
                view: {
                    type: HIDDEN
                }
            }
        }
    });
    /**
     * MCQ Reply mapper
     */
    persistence.Reply = Y.Base.create("Reply", persistence.Entity, [], {
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
                view: {
                    type: HIDDEN
                }
            },
            unread: {
                type: BOOLEAN,
                value: true,
                view: {
                    label: 'Is unread'
                }
            },
            startTime: {
                type: STRING,
                setter: function (val) {
                    return val * 1;
                }
            },
            ignored: {
                type: BOOLEAN,
                view: {
                    label: 'Is ignored'
                }
            },
            result: {
                view: {
                    type: HIDDEN
                },
                "transient": true
            }
        }
    });
});

