/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
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
        helloWorld: function() {
            return "hello, world!\n";
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
            description: {
                type: NULLSTRING,
                format: HTML,
                optional: true,
                view: {
                    type: HTML,
                    label: "Description"
                }
            },
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
                    descriptorId: IDATTRDEF,
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
                    {
                        type: HIDDEN,
                        value: SELF
                    }, {
                        scriptType: STRING,
                        type: "select",
                        choices: [{
                                label: "",
                                value: ""
                            }, {
                                value: "NOT_STARTED",
                                label: "restart"
                            }
                        ]
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
            return Wegas.Facade.Variable.cache.findById(this.get("parentDescriptorId"));
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
            },
            parentDescriptorId: {
                type: NUMBER,
                optional: true,
                _inputex: {
                    _type: HIDDEN
                }
            }
        },
        EDITMENU: {
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
            return Wegas.Facade.Variable.cache.findById(this.get("parentDescriptorId"));
        }
    }, {
        ATTRS: {
            "@class": {
                value: "EvaluationDescriptor"
            },
            name: {
                type: STRING,
                required: true,
                view: {
                    label: "Name"
                }
            },
            index: {
                type: NUMBER,
                view: {label: "Index"}
            },
            description: {
                type: NULLSTRING,
                optional: true,
                view: {
                    type: HTML,
                    label: "Description",
                    height: '50px'
                }
            },
            parentDescriptorId: {
                type: NUMBER,
                optional: true,
                _inputex: {
                    _type: HIDDEN
                }
            }
            /*,
             container: {
             type: "EvaluationDescriptorContainer",
             optional: true,
             _inputex: {
             _type: HIDDEN
             }
             }*/
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
                    label: "Copy",
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
        }
    }, {
        ATTRS: {
            "@class": {
                value: "GradeDescriptor"
            },
            minValue: {
                type: NUMBER,
                optional: true,
                view: {
                    label: "Minimum"
                }
            },
            maxValue: {
                type: NUMBER,
                optional: true,
                view: {
                    label: "Maximum"
                }
            }
        }
    });
    /**
     * CategorizedEvaluationDescriptor
     */
    persistence.CategorizedEvaluationDescriptor = Y.Base.create("CategorizedEvaluationDescriptor", persistence.EvaluationDescriptor, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "CategorizedEvaluationDescriptor"
            },
            categories: {
                type: ARRAY,
                items: {
                    required: true,
                    type: STRING
                },
                view: {
                    label: "Categories",
                    type: ARRAY
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

