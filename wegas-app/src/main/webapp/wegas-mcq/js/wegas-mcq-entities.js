/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-mcq-entities', function(Y) {
    "use strict";
    var STRING = "string",
        HIDDEN = "hidden",
        ARRAY = "array",
        SELF = "self",
        BOOLEAN = "boolean",
        BUTTON = "Button",
        OBJECT = "object",
        HTML = "html",
        SCRIPT = "script",
        NUMBER = "number",
        NULLSTRING = ["null", STRING],
        Wegas = Y.Wegas,
        persistence = Wegas.persistence,
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
        view: {type: HIDDEN}
    };
    /**
     * QuestionDescriptor mapper
     */
    persistence.QuestionDescriptor = Y.Base.create("QuestionDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        isAnyChoiceAnswerable: function() {
            var qInstance = this.getInstance();
            if (this.get("cbx")) {
                // only active and not yet validated CBX are answerable
                return qInstance.get("active") && !qInstance.get("validated");
            } else {

                if (!qInstance.get('active') || qInstance.get('validated')) {
                    // not active or manually validated
                    return false;
                } else {
                    var qReplies = qInstance.getValidatedReplies();
                    if (qReplies) {
                        if (this.get('maxReplies')) {
                            // is maximum reached?
                            if (qReplies.length >= this.get("maxReplies")) {
                                // yes -> not answerable
                                return false;
                            }
                        }

                        // no qMax || not yet reached
                        //   -> find any answerable choice
                        var choices = this.get("items"),
                            choice, choiceI;
                        for (var i in choices) {
                            choice = choices[i];
                            choiceI = choice.getInstance();
                            if (choiceI.get("active")) {
                                if (choice.get("maxReplies")) {
                                    if (choiceI.getValidatedReplies().length < choice.get("maxReplies")) {
                                        // found an answerable choice !
                                        return true;
                                    }
                                } else {
                                    // no limit -> answerable
                                    return true;
                                }
                            }
                        }
                        return false;
                    }
                }
            }
        },
        getRepliesByStartTime: function(startTime) {
            return this.getInstance().getRepliesByStartTime(startTime);
        },
        getIconCss: function() {
            return 'fa fa-question-circle';
        }
    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "QuestionDescriptor"
            },
            minReplies: {
                type: ['null', NUMBER],
                optional: true,
                value: 1,
                minimum: 0,
                index: 11,
                visible: function(val, formVal) {
                    return formVal.cbx;
                },
                errored: function(val, formVal) {
                    var errors = [],
                        min = typeof val === 'number' ? val : 1,
                        max = formVal.maxReplies;
                    if (min < 0) {
                        errors.push('Value must be positive');
                    }
                    if (formVal.cbx && Y.Lang.isNumber(max) && min > max) {
                        errors.push('Value cannot be greater than the maximum number of replies');
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Min. number replies',
                    description: "Optional value",
                    placeholder: "1",
                    layout: 'shortInline'
                }
            },
            maxReplies: {
                type: ['null', NUMBER],
                optional: true,
                value: 1,
                index: 12,
                errored: function(val, formVal) {
                    var errors = [];
                    if (Y.Lang.isNumber(val)) {
                        if (val < 1) {
                            errors.push('Value must be strictly positive or empty');
                        }
                        if (formVal.cbx && Y.Lang.isNumber(formVal.minReplies)) {
                            if (val < formVal.minReplies) {
                                errors.push('Value must be greater than or equal to the minimum');
                            }
                        }
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Max. number replies',
                    description: "Optional value",
                    placeholder: "∞",
                    layout: 'shortInline'
                }
            },
            cbx: {
                type: BOOLEAN,
                value: false,
                view: {
                    label: "Checkbox answer",
                    description: "For standard multiple-choice questions",
                },
                index: 9
            },
            tabular: {
                type: BOOLEAN,
                value: false,
                visible: function(val, formVal) {
                    return formVal.cbx;
                },
                view: {
                    label: "Tabular layout",
                    description: "Replies are presented horizontally",
                },
                index: 10
            },
            description: Y.Wegas.Helper.getTranslationAttr({
                label: "Description",
                index: 12,
                type: HTML
            }),
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
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    unread: {
                        value: true,
                        type: BOOLEAN,
                        view: {type: HIDDEN}
                    },
                    validated: {
                        value: false,
                        type: BOOLEAN,
                        view: {type: HIDDEN}
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
                    className: 'wegas-advanced-feature',
                    label: "pictures"
                }
            }
        },
        EDITMENU: {
            addBtn: {
                index: 1,
                maxVisibility: "PROTECTED",
                cfg: {
                    type: BUTTON,
                    label: "Add",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                children: [{
                                        type: BUTTON,
                                        label: "<span class='fa fa-check-square-o'></span> Standard",
                                        plugins: [{
                                                fn: "AddEntityChildAction",
                                                cfg: {
                                                    targetClass: "SingleResultChoiceDescriptor"
                                                }
                                            }]
                                    }, {
                                        type: BUTTON,
                                        label: "<span class='fa fa-check-square-o'></span> Conditional results",
                                        plugins: [{
                                                fn: "AddEntityChildAction",
                                                cfg: {
                                                    targetClass: "ChoiceDescriptor"
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {
            activate: {
                arguments: [SELFARG]
            },
            desactivate: {
                label: "deactivate",
                arguments: [SELFARG]
            },
            setValidated: {
                label: 'validate',
                arguments: [
                    SELFARG,
                    {
                        type: BOOLEAN,
                        value: true,
                        required: true
                    }
                ]
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
        getValidatedReplies: function() {
            return Y.Array.filter(this.get('replies'), function(reply) {
                return reply.get("validated");
            });
        },
        getRepliesByStartTime: function(startTime) {
            var i,
                ret = [],
                replies = this.get("replies");
            for (i = 0; i < replies.length; i = i + 1) {
                if (replies[i].get("startTime") === startTime) {
                    ret.push(replies[i]);
                }
            }
            return ret;
        },
        isUnread: function() {
            if (this.get("active")) {
                if (this.get("unread")) {
                    return true;
                } else {
                    var choices, i, ci,
                        qDesc;
                    qDesc = this.getDescriptor();
                    choices = qDesc.get("items");
                    for (i in choices) {
                        ci = choices[i].getInstance();
                        if (ci.get("active") && ci.get("unread")) {
                            return true;
                        }
                    }
                }
            }
            return false;
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
                "transient": true,
                getter: function() {
                    var replies = [],
                        choices,
                        i,
                        qDesc;
                    qDesc = this.getDescriptor();
                    choices = qDesc.get("items");
                    for (i in choices) {
                        replies = replies.concat(choices[i].getInstance().get("replies"));
                    }
                    replies.sort(function(a, b) {
                        return a.get("createdTime") - b.get("createdTime");
                    });
                    return replies;
                },
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
        getIconCss: function() {
            return "fa fa-check-square-o";
        }
    },
        {
            ATTRS: {
                "@class": {
                    value: "ChoiceDescriptor"
                },
                description: Y.Wegas.Helper.getTranslationAttr({
                    label: "Description",
                    type: HTML
                }),
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
                        refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                        parentId: IDATTRDEF,
                        parentType: {
                            type: "string",
                            view: {type: HIDDEN}
                        },
                        unread: {
                            type: BOOLEAN,
                            value: true,
                            view: {type: HIDDEN}
                        },
                        active: {
                            type: BOOLEAN,
                            value: true,
                            view: {
                                label: 'Active from start',
                            }
                        },
                        replies: {
                            type: ARRAY,
                            value: [],
                            view: {
                                type: HIDDEN,
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
                maxReplies: {
                    type: ['null', NUMBER],
                    minimum: 1,
                    optional: true,
                    index: 8,
                    visible: function(val, formVal) {
                        var parent;
                        if (formVal.id) {
                            parent = Y.Wegas.Facade.Variable.cache.findById(formVal.id).getParent();
                            // not applicable for checkboxed questions and useless if q.maxReplies equals 1
                            return !parent.get("cbx") && parent.get("maxReplies") !== 1;
                        }
                        return true;
                    },
                    view: {
                        label: 'Max. number replies',
                        placeholder: "∞",
                        description: "Optional value",
                        //indent: true,
                        layout: 'shortInline'
                    }
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
            EDITMENU: {
                addBtn: {
                    index: 1,
                    cfg: {
                        type: BUTTON,
                        label: "Add",
                        plugins: [{
                                fn: "EditEntityArrayFieldAction",
                                cfg: {
                                    targetClass: "Result",
                                    method: "POST",
                                    attributeKey: "results",
                                    showEditionAfterRequest: true
                                }
                            }
                        ]
                    }
                }
            },
            METHODS: {
                activate: {
                    arguments: [SELFARG]
                },
                desactivate: {
                    label: "deactivate",
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
                        SELFARG,
                        {
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
                    arguments: [SELFARG]
                },
                hasBeenIgnored: {
                    label: "has been ignored",
                    returns: BOOLEAN,
                    arguments: [SELFARG]
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
                            value: 'ChoiceInstance',
                            view: {
                                type: HIDDEN
                            }
                        },
                        id: IDATTRDEF,
                        version: VERSION_ATTR_DEF,
                        refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                        parentId: IDATTRDEF,
                        parentType: {
                            type: "string",
                            view: {type: HIDDEN}
                        },
                        unread: {
                            type: BOOLEAN,
                            value: true,
                            view: {type: HIDDEN}
                        },
                        active: {
                            type: BOOLEAN,
                            value: true,
                            view: {
                                label: 'Active from start'
                            }
                        },
                        replies: {
                            type: ARRAY,
                            value: [],
                            view: {
                                type: HIDDEN,
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
                    maxItems: 1,
                    minItems: 1,
                    valueFn: function() {
                        return [{
                                "@class": "Result",
                                label: {
                                    "@class": "TranslatableContent",
                                    translations: {}
                                },
                                answer: {
                                    "@class": "TranslatableContent",
                                    translations: {}
                                },
                                ignorationAnswer: {
                                    "@class": "TranslatableContent",
                                    translations: {}
                                }
                            }];
                    },
                    view: {type: ARRAY},
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
                            refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                            version: {
                                type: NUMBER,
                                optional: true,
                                value: 0,
                                view: {
                                    type: "uneditable",
                                    className: "wegas-advanced-feature",
                                    label: "Version"
                                },
                                index: -1
                            },
                            name: {
                                type: STRING,
                                optional: true,
                                view: {
                                    type: HIDDEN
                                }
                            },
                            label: {
                                type: "object",
                                optional: true,
                                view: {
                                    type: HIDDEN
                                }
                            },
                            answer: Y.Wegas.Helper.getTranslationAttr({
                                label: "Feedback",
                                index: 1,
                                type: HTML,
                                borderTop: true
                            }),
                            impact: {
                                optional: true,
                                index: 2,
                                type: ["null", OBJECT],
                                properties: {
                                    "@class": {type: "string", value: "Script", view: {type: HIDDEN}},
                                    content: {
                                        type: STRING
                                    }
                                },
                                view: {
                                    label: "Impact on variables",
                                    type: SCRIPT
                                }
                            },
                            ignorationAnswer: Y.Wegas.Helper.getTranslationAttr({
                                label: "Feedback when ignored",
                                index: 4,
                                borderTop: true,
                                visible: function(val, formVal) {
                                    return Y.Wegas.Facade.Variable.cache.findById(formVal.id).getParent().get("cbx");
                                },
                                type: HTML
                            }),
                            ignorationImpact: {
                                type: ["null", OBJECT],
                                properties: {
                                    "@class": {type: "string", value: "Script", view: {type: HIDDEN}},
                                    content: {
                                        type: STRING
                                    }
                                },
                                visible: function(val, formVal) {
                                    return Y.Wegas.Facade.Variable.cache.findById(formVal.id).getParent().get("cbx");
                                },
                                view: {
                                    label: "Impact on variables when ignored",
                                    type: SCRIPT
                                },
                                index: 5,
                            },
                            parentId: IDATTRDEF,
                            parentType: {
                                type: "string",
                                view: {type: HIDDEN}
                            },
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
            EDITMENU: {
                addBtn: null // force addBtn to null
            },
            METHODS: {
                activate: {
                    arguments: [SELFARG]
                },
                desactivate: {
                    label: "deactivate",
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
                    arguments: [SELFARG]
                },
                hasBeenIgnored: {
                    label: "has been ignored",
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
     * MCQ Result mapper
     */
    persistence.Result = Y.Base.create("Result", persistence.Entity, [], {
        getChoiceDescriptor: function() {
            return Wegas.Facade.Variable.cache.findById(this.get("parentId"));
        },
        getLabel: function() {
            return this.get("label");
        },
        getEditorLabel: function() {
            return I18n.t(this.get("label"));
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
                view: {
                    type: "uneditable",
                    className: "wegas-advanced-feature",
                    label: "Version"
                },
                index: -1
            },
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -1,
                type: STRING,
                visible: function(val, formVal) {
                    var parent = Y.Wegas.Facade.Variable.cache.findById(formVal.parentId);
                    return parent ? parent.get("@class") === "ChoiceDescriptor" : true;
                }
            }),
            name: {
                //value: "",
                type: ["null", STRING],
                optional: true,
                index: -1,
                minLength: 1,
                view: {
                    className: "wegas-advanced-feature",
                    label: "Script alias",
                    //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                    description: "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character."
                },
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            },
            answer: Y.Wegas.Helper.getTranslationAttr({
                label: "Feedback",
                index: 10,
                type: HTML
            }),
            impact: {
                type: ["null", OBJECT],
                properties: {
                    "@class": {type: "string", value: "Script", view: {type: HIDDEN}},
                    content: {
                        type: STRING
                    }
                },
                view: {
                    label: "Impact",
                    type: SCRIPT
                },
                index: 11
            },
            ignorationAnswer: Y.Wegas.Helper.getTranslationAttr({
                label: "Feedback when ignored",
                index: 12,
                borderTop: true,
                visible: function(val, formVal) {
                    var parent = Y.Wegas.Facade.Variable.cache.findById(formVal.parentId);
                    return parent ? parent.getParent().get("cbx") : false;
                },
                type: HTML
            }),
            ignorationImpact: {
                type: ["null", OBJECT],
                properties: {
                    "@class": {type: "string", value: "Script", view: {type: HIDDEN}},
                    content: {
                        type: STRING
                    }
                },
                visible: function(val, formVal) {
                    var parent = Y.Wegas.Facade.Variable.cache.findById(formVal.parentId);
                    return parent ? parent.getParent().get("cbx") : false;
                },
                view: {
                    label: "Impact on variables when ignored",
                    type: SCRIPT
                },
                index: 13
            },
            parentId: IDATTRDEF,
            parentType: {
                type: "string",
                view: {type: HIDDEN}
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
        EDITMENU: {
            editBtn: {
                index: -1,
                cfg: {
                    type: BUTTON,
                    label: "Edit",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                attributeKey: "results"
                            }
                        }]
                }
            },
            copyBtn: {
                index: 10,
                cfg: {
                    type: BUTTON,
                    label: "Duplicate",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                method: "copy",
                                attributeKey: "results"
                            }
                        }]
                }
            },
            deleteBtn: {
                index: 20,
                cfg: {
                    type: BUTTON,
                    label: "Delete",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                method: "delete",
                                attributeKey: "results"
                            }
                        }]
                }
            }
        }
    });
    /**
     * MCQ ChoiceInstance mapper
     */
    persistence.ChoiceInstance = Y.Base.create("ChoiceInstance", persistence.VariableInstance, [], {
        getValidatedReplies: function() {
            return Y.Array.filter(this.get('replies'), function(reply) {
                return reply.get("validated");
            });
        }
    }, {
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
                type: BOOLEAN,
                view: {type: HIDDEN}
            },
            replies: {
                value: [],
                setter: function(v) {
                    v.sort(function(a, b) {
                        return a.get("createdTime") - b.get("createdTime");
                    });
                    return v;
                },
                type: ARRAY,
                view: {
                    type: HIDDEN
                }
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
        getChoiceDescriptor: function() {
            if (this.get("choiceName")) {
                return Y.Wegas.Facade.Variable.cache.find("name", this.get("choiceName"));
            }
        },
        getResult: function() {
            var choice = this.getChoiceDescriptor();
            if (choice) {
                return Y.Array.find(choice.get("results"), Y.bind(function(item) {
                    return item.get("name") === this.get("resultName");
                }, this));
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
            unread: {
                type: BOOLEAN,
                value: true,
                view: {
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
                view: {
                    label: 'Is ignored'
                }
            },
            validated: {
                type: BOOLEAN,
                view: {
                    label: 'is validated'
                }
            },
            resultName: {
                type: STRING,
                view: {
                    type: HIDDEN
                }
            },
            choiceName: {
                type: STRING,
                view: {
                    type: HIDDEN
                }
            },
            answer: {
                type: OBJECT,
                "transient": true,
                view: {
                    type: HIDDEN
                }
            },
            ignorationAnswer: {
                type: OBJECT,
                "transient": true,
                view: {
                    type: HIDDEN
                }
            },
            files: {
                type: ARRAY,
                "transient": true,
                view: {
                    type: HIDDEN
                }
            },
            createdTime: {
                "transient": true
            }
        }
    });
    /*
     * Wh-Questions
     */

    /**
     * QuestionDescriptor mapper
     */
    persistence.WhQuestionDescriptor = Y.Base.create("WhQuestionDescriptor", persistence.VariableDescriptor, [persistence.VariableContainer], {
        getIconCss: function() {
            return 'fa fa-pencil-square';
        }
    }, {
        EDITORNAME: "Open Question",
        ATTRS: {
            "@class": {
                type: STRING,
                value: "WhQuestionDescriptor"
            },
            description: Y.Wegas.Helper.getTranslationAttr({
                label: "Description",
                index: 10,
                type: HTML
            }),
            defaultInstance: {
                type: "object",
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "WhQuestionInstance",
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    version: VERSION_ATTR_DEF,
                    refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    validated: {
                        value: false,
                        type: BOOLEAN,
                        view: {type: HIDDEN}
                    },
                    active: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            label: 'Active from start'
                        }
                    },
                    unread: {
                        type: BOOLEAN,
                        value: true,
                        view: {
                            type: HIDDEN
                        }
                    },
                    feedback: Y.Wegas.Helper.getTranslationAttr({
                        label: "Feedback",
                        index: 10,
                        type: HTML
                    })
                },
                index: 20
            }
        },
        EDITMENU: {
            addBtn: {
                index: 1,
                maxVisibility: "PROTECTED",
                cfg: {
                    type: BUTTON,
                    label: "Add",
                    plugins: [{
                            fn: "WidgetMenu",
                            cfg: {
                                children: [
                                    {
                                        type: BUTTON,
                                        label: '<span class="wegas-icon-numberdescriptor"></span> Number',
                                        plugins: [{
                                                fn: "AddEntityChildAction",
                                                cfg: {
                                                    targetClass: "NumberDescriptor"
                                                }
                                            }]
                                    }, {
                                        type: BUTTON,
                                        label: '<span class="fa fa-paragraph"></span> Text',
                                        plugins: [{
                                                fn: "AddEntityChildAction",
                                                cfg: {
                                                    targetClass: "TextDescriptor"
                                                }
                                            }]
                                    }, {
                                        type: BUTTON,
                                        label: '<span class="fa fa-font"></span> String',
                                        plugins: [{
                                                fn: "AddEntityChildAction",
                                                cfg: {
                                                    targetClass: "StringDescriptor"
                                                }
                                            }]
                                    }, {
                                        type: BUTTON,
                                        label: '<span class="fa fa-toggle-on"></span> Boolean',
                                        plugins: [{
                                                fn: "AddEntityChildAction",
                                                cfg: {
                                                    targetClass: "BooleanDescriptor"
                                                }
                                            }]
                                    }

                                ]
                            }
                        }
                    ]
                }
            }
        },
        /**
         * Defines methods available in wysiwyge script editor
         */
        METHODS: {
            activate: {
                arguments: [SELFARG]
            },
            deactivate: {
                label: "deactivate",
                arguments: [SELFARG]
            },
            reopen: {
                label: "reopen",
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
            },
            setFeedback: {
                label: 'set feedback',
                className: 'wegas-method-returnline',
                arguments: [
                    SELFARG,
                    Y.Wegas.Helper.getTranslationAttr({type: HTML})
                ]
            },
            getFeedback: {
                label: "feedback",
                returns: STRING,
                arguments: [SELFARG],
                localEval: function(player) {
                    return I18n.t(this.getInstance(player).get("feedback"));
                }
            }
        }
    });
    /**
     * WhQuestionInstance mapper
     */
    Wegas.persistence.WhQuestionInstance = Y.Base.create("WhQuestionInstance",
        Wegas.persistence.VariableInstance, [], {}, {
        EDITORNAME: "Open Question",
        ATTRS: {
            "@class": {
                value: "WhQuestionInstance"
            },
            active: {
                value: true,
                type: BOOLEAN
            },
            validated: {
                value: false,
                type: BOOLEAN
            },
            unread: {
                value: true,
                type: BOOLEAN
            },
            feedback: Y.Wegas.Helper.getTranslationAttr({
                label: "Feedback",
                index: 10,
                type: HTML
            })
        }
    });
});

