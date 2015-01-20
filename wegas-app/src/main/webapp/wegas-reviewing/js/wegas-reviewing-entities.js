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
            label: {
                type: STRING,
                optional: true,
                _inputex: {
                    label: "Label",
                    description: "Displayed to players",
                    index: -1
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
     * EvaluationDescriptor
     */
    persistence.EvaluationDescriptor = Y.Base.create("EvaluationDescriptor", persistence.Entity, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "EvaluationDescriptor"
            }
        }
    });


    /**
     * TextEvaluationDescriptor
     */
    persistence.TextEvaluationDescriptor = Y.Base.create("TextEvaluationDescriptor", persistence.Entity, [], {
    }, {
        ATTRS: {
            "@class": {
                value: "EvaluationDescriptor"
            }
        }
    });
});

