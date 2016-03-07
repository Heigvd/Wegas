/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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
        Wegas = Y.Wegas, persistence = Wegas.persistence,
        IDATTRDEF = {
            type: STRING,
            optional: true, // The id is optional for entites that have not been persisted
            _inputex: {
                _type: HIDDEN
            }
        };
    /**
     * PeerReviewescriptor mapper
     */
    persistence.PeerReviewDescriptor = Y.Base.create("PeerReviewDescriptor", persistence.VariableDescriptor, [], {
        helloWorld: function() {
            return "hello, world!\n";
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
                _inputex: {
                    label: "Number of review"
                }
            },
            toReview: {
                type: STRING,
                "transient": true,
                getter: function() {
                    return Wegas.Facade.Variable.cache.find("name", this.get("toReviewName"));
                }
            },
            toReviewName: {
                type: STRING,
                _inputex: {
                    label: "To Review",
                    index: -1,
                    _type: "flatvariableselect",
                    required: true,
                    classFilter: ["TextDescriptor", "NumberDescriptor"]
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
            feedback: {
                type: "EvaluationDescriptorContainer",
                value: {
                    "@class": "EvaluationDescriptorContainer"
                },
                _inputex: {
                    _type: HIDDEN,
                    index: 1
                }
            },
            fbComments: {
                type: "EvaluationDescriptorContainer",
                value: {
                    "@class": "EvaluationDescriptorContainer"
                },
                _inputex: {
                    _type: HIDDEN,
                    index: 1
                }
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: "PeerReviewInstance"
                        }
                    },
                    id: IDATTRDEF
                },
                _inputex: {
                    index: 3
                }
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
            }],
        /**
         * WYSIWYG editor
         */
        METHODS: {
            getState: {
                label: "state",
                returns: STRING,
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
                ],
                arguments: [{
                        type: HIDDEN,
                        value: SELF
                    }]
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
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            },
            "reviewed": {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: HIDDEN
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
                _inputex: {
                    _type: HIDDEN
                }
            },
            "comments": {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: HIDDEN
                }
            }
        }
    });
    /**
     * EvaluationDescriptor
     */
    persistence.EvaluationDescriptorContainer = Y.Base.create("EvaluationDescriptorContainer", persistence.Entity, [], {
    }, {
        EDITORNAME: "Evaluations",
        ATTRS: {
            evaluations: {
                type: ARRAY,
                value: [],
                _inputex: {
                    _type: HIDDEN,
                    index: 1
                }
            }
        },
        EDITMENU: [{
                type: "EditEntityButton"
            }, {
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
            }, {
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
            }, {
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
                    }]
            }]
    });
    /**
     * EvaluationDescriptor
     */
    persistence.EvaluationDescriptor = Y.Base.create("EvaluationDescriptor", persistence.Entity, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "EvaluationDescriptor"
            },
            name: {
                type: STRING
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
            }/*,
             container: {
             type: "EvaluationDescriptorContainer",
             optional: true,
             _inputex: {
             _type: HIDDEN
             }
             }*/
        },
        EDITMENU: [{
                type: BUTTON,
                label: "Edit",
                plugins: [{
                        fn: "EditEntityArrayFieldAction",
                        cfg: {
                            attributeKey: "evaluations"
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Copy",
                plugins: [{
                        fn: "EditEntityArrayFieldAction",
                        cfg: {
                            method: "copy",
                            attributeKey: "evaluations"
                        }
                    }]
            }, {
                type: BUTTON,
                label: "Delete",
                plugins: [{
                        fn: "EditEntityArrayFieldAction",
                        cfg: {
                            method: "delete",
                            attributeKey: "evaluations"
                        }
                    }]
            }]

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
                _inputex: {
                    label: "Minimum"
                }
            },
            maxValue: {
                type: NUMBER,
                optional: true,
                _inputex: {
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
                _inputex: {
                    label: "Categories",
                    elementType: {
                        required: true,
                        type: STRING
                    }
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
                type: "string"
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
                type: "string"
            }
        }
    });
});

