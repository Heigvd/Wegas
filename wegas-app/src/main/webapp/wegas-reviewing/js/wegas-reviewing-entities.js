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
     * PeerReviewingescriptor mapper
     */
    persistence.PeerReviewingDescriptor = Y.Base.create("PeerReviewingDescriptor", persistence.VariableDescriptor, [], {
        helloWorld: function() {
            return "hello, world!\n";
        }
    }, {
        ATTRS: {
            "@class": {
                type: STRING,
                value: "PeerReviewingDescriptor"
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
            feedback: {
                type: ARRAY,
                value: [],
                _inputex: {
                    label: "feedback",
                    index: 1
                }
            },
            feedbackEvaluations: {
                type: ARRAY,
                value: [],
                _inputex: {
                    label: "feedback evaluation",
                    index: 2
                }
            },
            defaultInstance: {
                properties: {
                    "@class": {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: "PeerReviewingInstance"
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
        }
    });



    /**
     * PeerReviewingInstance mapper
     */
    Wegas.persistence.PeerReviewingInstance = Y.Base.create("PeerReviewingInstance", Wegas.persistence.VariableInstance, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "PeerReviewingInstance"
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
            feedbackEvaluationReviewDescriptor: {
                type: persistence.PeerReviewingDescriptor
            },
            feedbackReviewDescriptor: {
                type: persistence.PeerReviewingDescriptor
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
});

