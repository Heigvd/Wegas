/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n */

/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add('wegas-reviewing-entities', function(Y) {
    "use strict";
    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", ENUM = "enum",
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
        optional: true, // The id is optional for entities that have not been persisted
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
     * PeerReviewescriptor mapper
     */
    persistence.PeerReviewDescriptor = Y.Base.create("PeerReviewDescriptor", persistence.VariableDescriptor, [], {
        hasReviews: function() {
            var instance = this.getInstance();
            return instance.get("reviewed").length > 0 || instance.get("toReview").length > 0;
        },
        getIconCss: function() {
            return 'fa fa-users fa-1';
        }
    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "PeerReviewDescriptor"
            },
            maxNumberOfReview: {
                type: NUMBER,
                value: 3,
                view: {
                    label: "Number of reviews",
                    description: "Maximum reviews per user. Preferably greater than one."
                }
            },
            toReview: {
                type: STRING,
                value: "",
                "transient": true,
                view: {type: HIDDEN},
                getter: function() {
                    return Wegas.Facade.Variable.cache.find("name", this.get("toReviewName"));
                }
            },
            toReviewName: {
                type: STRING,
                required: true,
                index: -1,
                view: {
                    label: "To Review",
                    type: "flatvariableselect",
                    classFilter: ["TextDescriptor", "NumberDescriptor"]
                }
            },
            description: Y.Wegas.Helper.getTranslationAttr({
                type: HTML,
                label: "Description"
            }),
            feedback: {
                type: OBJECT,
                value: {
                    "@class": "EvaluationDescriptorContainer"
                },
                properties: {
                    "@class": {
                        type: STRING,
                        value: "EvaluationDescriptorContainer"
                    }
                },
                index: 1,
                view: {type: HIDDEN}
            },
            fbComments: {
                type: OBJECT,
                value: {
                    "@class": "EvaluationDescriptorContainer"
                },
                properties: {
                    "@class": {
                        type: STRING,
                        value: "EvaluationDescriptorContainer"
                    }
                },
                index: 1,
                view: {type: HIDDEN}
            },
            includeEvicted: {
                type: BOOLEAN,
                value: false,
                index: 2,
                view: {
                    //label: "Dispatch to evicted",
                    label: "Also dispatch to peers who did not submit anything",
                }
            },
            defaultInstance: {
                type: OBJECT,
                required: true,
                properties: {
                    "@class": {
                        type: STRING,
                        value: "PeerReviewInstance",
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
                    reviewState: {
                        type: STRING,
                        value: "NOT_STARTED",
                        view: {type: HIDDEN}
                    },
                    reviewed: {
                        type: ARRAY,
                        value: [],
                        view: {type: HIDDEN}
                    },
                    toReview: {
                        type: ARRAY,
                        value: [],
                        view: {type: HIDDEN}
                    },
                },
                index: 3
            }
        },
        /**
         * WYSIWYG editor
         */
        METHODS: {
            setState: {
                label: "state",
                "arguments": [
                    SELFARG, {
                        type: STRING,
                        view: {
                            type: "select",
                            choices: [{
                                    value: "NOT_STARTED",
                                    label: "restart"
                                }
                            ]
                        }
                    }]
            },
            getState: {
                label: "state",
                returns: STRING,
                arguments: [SELFARG],
                choices: [{
                        value: "NOT_STARTED",
                        label: "editing"
                    }, {
                        value: "SUBMITTED",
                        label: "ready to review"
                    }, {
                        value: "DISPATCHED",
                        label: "reviewing"
                    }, {
                        value: "NOTIFIED",
                        label: "notified"
                    }, {
                        value: "COMPLETED",
                        label: "completed"
                    }, {
                        value: "DISCARDED",
                        label: "discarded"
                    }, {
                        value: "EVICTED",
                        label: "evicted"
                    }
                ]
            }
        }
    });
    /**
     * PeerReviewInstance mapper
     */
    Wegas.persistence.PeerReviewInstance = Y.Base.create("PeerReviewInstance", Wegas.persistence.VariableInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "PeerReviewInstance"
            },
            reviewState: {
                type: STRING,
                value: "not-started"
            },
            "toReview": {
                type: ARRAY,
                setter: function(v) {
                    v.sort(function(a, b) {
                        return a.get("createdTime") - b.get("createdTime");
                    });
                    return v;
                },
                value: [],
                view: {
                    type: HIDDEN
                }
            },
            "reviewed": {
                type: ARRAY,
                setter: function(v) {
                    v.sort(function(a, b) {
                        return a.get("createdTime") - b.get("createdTime");
                    });
                    return v;
                },
                value: [],
                view: {
                    type: HIDDEN
                }
            }
        }
    });
    /**
     * Review mapper
     */
    Wegas.persistence.Review = Y.Base.create("Review", Wegas.persistence.Entity, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "Review"
            },
            "reviewState": {
                type: STRING
            },
            "feedback": {
                type: ARRAY,
                value: [],
                setter: function(v) {
                    v.sort(function(a, b) {
                        return a.get("index") - b.get("index");
                    });
                    return v;
                },
                view: {
                    type: HIDDEN
                }
            },
            "comments": {
                type: ARRAY,
                value: [],
                setter: function(v) {
                    v.sort(function(a, b) {
                        return a.get("index") - b.get("index");
                    });
                    return v;
                },
                view: {
                    type: HIDDEN
                }
            },
            createdTime: {
                "transient": true
            }
        }
    });
    /**
     * EvaluationDescriptor
     */
    persistence.EvaluationDescriptorContainer = Y.Base.create("EvaluationDescriptorContainer", persistence.Entity, [], {
        getParentDescriptor: function() {
            return Wegas.Facade.Variable.cache.findById(this.get("parentId"));
        }
    }, {
        EDITORNAME: "Evaluations",
        ATTRS: {
            evaluations: {
                type: ARRAY,
                value: [],
                setter: function(v) {
                    v.sort(function(a, b) {
                        return a.get("index") - b.get("index");
                    });
                    return v;
                },
                index: 1,
                view: {
                    type: HIDDEN
                }
            }
        },
        EDITMENU: {
            editBtn: {
                index: 0,
                cfg: {
                    type: 'EditEntityButton'
                }
            },
            addGradeBtn: {
                index: 1,
                cfg: {
                    type: BUTTON,
                    label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add Grade",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                targetClass: "GradeDescriptor",
                                method: "POST",
                                attributeKey: "evaluations",
                                showEditionAfterRequest: true
                            }
                        }]
                }
            }, addTextBtn: {
                index: 2,
                cfg: {
                    type: BUTTON,
                    label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add Text",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                targetClass: "TextEvaluationDescriptor",
                                method: "POST",
                                attributeKey: "evaluations",
                                showEditionAfterRequest: true
                            }
                        }]
                }
            },
            addCategBtn: {
                index: 3,
                cfg: {
                    type: BUTTON,
                    label: "<span class=\"wegas-icon wegas-icon-new\"></span>Add Categorization",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                targetClass: "CategorizedEvaluationDescriptor",
                                method: "POST",
                                attributeKey: "evaluations",
                                showEditionAfterRequest: true
                            }
                        }
                    ]
                }
            }
        }
    });
    /**
     * EvaluationDescriptor
     */
    persistence.EvaluationDescriptor = Y.Base.create("EvaluationDescriptor", persistence.Entity, [], {
        getParentDescriptor: function() {
            var evalContainerId = this.get("parentId");
            return Y.Wegas.Facade.Variable.cache.findByFn(function(item) {
                if (item instanceof Y.Wegas.persistence.PeerReviewDescriptor) {
                    if (item.get("feedback") && item.get("feedback").get("id") === evalContainerId) {
                        return true;
                    }
                    if (item.get("fbComments") && item.get("fbComments").get("id") === evalContainerId) {
                        return true;
                    }
                }
            });
        },
        getEditorLabel: function() {
            return I18n.t(this.get("label"));
        }
    }, {
        ATTRS: {
            "@class": {
                value: "EvaluationDescriptor"
            },
            name: {
                type: STRING,
                view: {
                    className: 'wegas-advanced-feature',
                    label: 'Script alias',
                    description: "Internal name"
                }
            },
            label: Y.Wegas.Helper.getTranslationAttr({
                label: "Label",
                index: -1,
                description: "Displayed to players",
                type: STRING
            }),
            index: {
                type: NUMBER,
                view: {label: "Index"}
            },
            description: Y.Wegas.Helper.getTranslationAttr({
                label: "Description",
                type: HTML
            })
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
                                attributeKey: "evaluations"
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
                                attributeKey: "evaluations"
                            }
                        }]
                }
            },
            deleteBtn: {
                index: 30,
                cfg: {
                    type: BUTTON,
                    label: "Delete",
                    plugins: [{
                            fn: "EditEntityArrayFieldAction",
                            cfg: {
                                method: "delete",
                                attributeKey: "evaluations"
                            }
                        }]
                }
            }
        }
    });
    /**
     * TextEvaluationDescriptor
     */
    persistence.TextEvaluationDescriptor = Y.Base.create("TextEvaluationDescriptor", persistence.EvaluationDescriptor, [], {
        getIconCss: function() {
            return 'fa fa-paragraph';
        }
    }, {
        ATTRS: {
            "@class": {
                value: "TextEvaluationDescriptor"
            }
        }
    });
    /**
     * GradeDescriptor
     */
    persistence.GradeDescriptor = Y.Base.create("GradeDescriptor", persistence.EvaluationDescriptor, [], {
        getMaxValue: function() {
            return this.get("maxValue");
        },
        getMinValue: function() {
            return this.get("minValue");
        },
        getIconCss: function() {
            return 'fa wegas-icon-numberdescriptor';
        }
    }, {
        EDITORNAME: 'Number',
        ATTRS: {
            "@class": {
                value: "GradeDescriptor"
            },
            minValue: {
                type: ['null', NUMBER],
                optional: true,
                errored: function(val, formVal) {
                    var errors = [],
                        max = typeof formVal.maxValue === 'number' ? formVal.maxValue : Infinity,
                        min = typeof val === 'number' ? val : -Infinity;
                    if (min > max) {
                        errors.push('Minimum is greater than maximum');
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Minimum',
                    placeholder: "-∞",
                    layout: 'shortInline'
                }
            },
            maxValue: {
                type: ['null', NUMBER],
                optional: true,
                errored: function(val, formVal) {
                    var errors = [],
                        max = typeof val === 'number' ? val : Infinity,
                        min = typeof formVal.minValue === 'number'
                        ? formVal.minValue
                        : -Infinity;
                    if (max < min) {
                        errors.push('Maximum is less than minimum');
                    }
                    return errors.join(', ');
                },
                view: {
                    label: 'Maximum',
                    placeholder: "∞",
                    layout: 'shortInline'
                }
            }
        }
    });
    /**
     * CategorizedEvaluationDescriptor
     */
    persistence.CategorizedEvaluationDescriptor = Y.Base.create("CategorizedEvaluationDescriptor",
        persistence.EvaluationDescriptor, [], {
        getLabelForName: function(name) {
            var cats = this.get("categories"),
                i;
            for (i in cats) {
                if (cats[i].get("name") === name) {
                    return I18n.t(cats[i].get("label"));
                }
            }
        },
        getIconCss: function() {
            return "fa fa-list-ul";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "CategorizedEvaluationDescriptor"
            },
            categories: {
                type: ARRAY,
                items: {
                    type: "object",
                    properties: {
                        "@class": {
                            type: STRING,
                            value: "EnumItem",
                            view: {type: HIDDEN}
                        },
                        id: IDATTRDEF,
                        refId: Wegas.persistence.Entity.ATTRS_DEF.REF_ID,
                        parentId: IDATTRDEF,
                        parentType: {
                            type: "string",
                            view: {type: HIDDEN}
                        },
                        name: {
                            type: STRING,
                            view: {
                                className: 'wegas-advanced-feature',
                                label: 'Script alias',
                                //regexp: /^[a-zA-Z_$][0-9a-zA-Z_$]*$/,
                                description: "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character."
                            }
                        },
                        label: Y.Wegas.Helper.getTranslationAttr({
                            label: "Label",
                            index: -1,
                            description: "Displayed to players",
                            type: STRING
                        })
                    }
                },
                view: {
                    label: 'Categories'
                }
            }
        }
    });
    /**
     * EvaluationDescriptor
     */
    persistence.EvaluationInstance = Y.Base.create("EvaluationInstance", persistence.Entity, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "EvaluationInstance"
            },
            descriptor: {
                type: "EvaluationDescriptor"
            },
            index: {
                type: NUMBER
            }
        }
    });
    /**
     * EvaluationDescriptor
     */
    persistence.GradeInstance = Y.Base.create("GradeInstance", persistence.EvaluationInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "GradeInstance"
            },
            value: {
                type: "number"
            }
        }
    });
    /**
     * EvaluationDescriptor
     */
    persistence.TextEvaluationInstance = Y.Base.create("TextEvaluationInstance", persistence.EvaluationInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "TextEvaluationInstance"
            },
            value: {
                type: STRING
            }
        }
    });
    /**
     * EvaluationDescriptor
     */
    persistence.CategorizedEvaluationInstance = Y.Base.create("CategorizedEvaluationInstance", persistence.EvaluationInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "CategorizesEvaluationInstance"
            },
            value: {
                type: STRING
            }
        }
    });
});

