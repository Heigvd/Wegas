/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-mcq-entities', function (Y) {
    "use strict";

    var IDATTRDEF = {
        type: "string",
        optional: true,                                                         // The id is optional for entites that have not been persisted
        _inputex: {
            _type: "hidden"
        }
    };

    /**
     * QuestionDescriptor mapper
     */
    Y.Wegas.persistence.QuestionDescriptor = Y.Base.create("QuestionDescriptor", Y.Wegas.persistence.ListDescriptor, [], {
        getRepliesByStartTime: function ( startTime ) {
            return this.getInstance().getRepliesByStartTime( startTime );
        }
    }, {
        ATTRS:{
            "@class":{
                type: "string",
                value:"QuestionDescriptor"
            },
            allowMultipleReplies: {
                value: false,
                type: 'boolean',
                _inputex: {
                    label: 'Allow multiple replies'
                }
            },
            defaultVariableInstance: {
                properties: {
                    "@class": {
                        type: "string",
                        _inputex: {
                            _type: "hidden",
                            value: "QuestionInstance"
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: "boolean",
                        _inputex: {
                            label: 'Active by default',
                            value: true
                        }
                    }
                }
            },
            description: {
                type: "string",
                format: "html",
                optional: true
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"
        }, {
            type: "Button",
            label: "Add choice",
            plugins: [{
                fn: "AddEntityChildAction",
                cfg: {
                    childClass: "ChoiceDescriptor"
                }
            }]
        }, {
            type: "DeleteEntityButton"
        }]
    });

    /**
     * QuestionInstance mapper
     */
    Y.Wegas.persistence.QuestionInstance = Y.Base.create("QuestionInstance", Y.Wegas.persistence.VariableInstance, [], {
        getRepliesByStartTime: function ( startTime ) {
            var i, ret = [], replies = this.get( "replies" );
            for (i = 0; i < replies.length; i = i + 1 ) {
                if ( replies[i].get( "startTime" ) === startTime ) {
                    ret.push( replies[i] );
                }
            }
            return ret;
        }
    }, {
        ATTRS: {
            "@class":{
                value:"QuestionInstance"
            },
            active: {
                value: true,
                type: 'boolean'
            },
            unread: {
                value: true,
                type: 'boolean'
            },
            replies: {
                value: [],
                type: "array",
                _inputex: {
                    _type: "hidden"
                }
            }
        }
    });
    /**
     * ChoiceDescriptor mapper
     */
    Y.Wegas.persistence.ChoiceDescriptor = Y.Base.create("ChoiceDescriptor", Y.Wegas.persistence.VariableDescriptor, [], { }, {
        ATTRS:{
            "@class":{
                value:"ChoiceDescriptor"
            },
            duration: {
                value: 1,
                type: "string",
                optional: true
            },
            cost: {
                type: "string",
                value: 1,
                optional: true
            },
            defaultVariableInstance: {
                properties: {
                    '@class': {
                        type: "string",
                        _inputex: {
                            _type: 'hidden',
                            value:'ChoiceInstance'
                        }
                    },
                    id: IDATTRDEF,
                    active: {
                        type: "boolean",
                        _inputex: {
                            label:'Active by default',
                            value: true
                        }
                    }

                }
            },
            description: {
                type: 'string',
                format: "html",
                optional: true,
                _inputex: {
                    opts: {
                        height: '50px'
                    }
                }
            },
            //feedback: {
            //    type: 'string',
            //    format: "html",
            //    _inputex: {
            //        opts: {
            //            height: '50px'
            //        }
            //    }
            //},
            impact: {
                _inputex: {
                    //_type: "script"
                    _type: "hidden"
                },
                value: null,
                optional: true
            },
            responses: {
                _inputex: {
                    _type: 'hidden'
                },
                value: []
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"
        },{
            type: "Button",
            label: "Add response",
            plugins: [{
                fn: "EditEntityArrayFieldAction",
                cfg: {
                    targetClass: "Response",
                    method: "post",
                    attributeKey: "responses"
                }
            }]
        }, {
            type: "DeleteEntityButton"
        }]
    });
    /**
     * MCQ Response mapper
     */
    Y.Wegas.persistence.Response = Y.Base.create("Response", Y.Wegas.persistence.Entity, [], {
        getChoiceDescriptor: function () {
            return Y.Wegas.VariableDescriptorFacade.rest.findById( this.get( "choiceDescriptorId" ) );
        }
    }, {
        ATTRS: {
            "@class":{
                value:"Response"
            },
            name: {
                type: "string"
            },
            answer: {
                type: "string",
                format: "html"
            },
            impact: {
                _inputex: {
                    _type: "script"
                }
            },
            choiceDescriptorId: {
                type: "string",
                _inputex: {
                    _type: 'hidden'
                }
            }
        },
        EDITMENU: [{
            type: "Button",
            label: "Edit",
            plugins: [{
                fn: "EditEntityArrayFieldAction"
            }]
        }, {
            type: "Button",
            label: "Delete",
            plugins: [{
                fn: "EditEntityArrayFieldAction",
                cfg: {
                    method: "delete",
                    attributeKey: "responses"
                }
            }]
        }]
    });
    /**
     * MCQ ChoiceInstance mapper
     */
    Y.Wegas.persistence.ChoiceInstance = Y.Base.create("ChoiceInstance", Y.Wegas.persistence.VariableInstance, [], {

        }, {
            ATTRS: {
                "@class":{
                    value:"ChoiceInstance"
                },
                active: {
                    value: true,
                    type: "boolean"
                },
                unread: {
                    value: true,
                    type: "boolean"
                },
                currentResponseId: {
                    type: "string"
                //_inputex: {
                //    _type: "hidden"
                //}
                }
            }
        });
    /**
     * MCQ Reply mapper
     */
    Y.Wegas.persistence.Reply = Y.Base.create("Reply", Y.Wegas.persistence.Entity, [], {
        getChoiceDescriptor: function () {
            return this.get( "response" ).getChoiceDescriptor();
        },
        /**
         *  @return 0 if is finished, 1 if ongoing and 2 if planified
         */
        getStatus: function ( time ) {
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
            "@class":{
                value:"Reply"
            },
            choiceDescriptorId: {
                type: "string",
                _inputex: {
                    _type: 'hidden'
                }
            },
            startTime: {
                type: "string",
                setter: function ( val ) {
                    return val * 1;
                }
            },
            response: {
                _inputex: {
                    _type: 'hidden'
                }
            }
        }
    });

    /**
     * @hack Add the QuestionDescriptor to the default list of variablie descriptor availables for creation
     */
    Y.Wegas.persistence.VariableDescriptor.EDITFORM.availableFields.push(
        Y.mix({
            name: 'QuestionDescriptor',
            label: 'a question'
        }, new Y.Wegas.persistence.QuestionDescriptor().getFormCfg()));

});

