/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-object-entities', function(Y) {
    "use strict";

    var STRING = "string",
        NUMBER = "number",
        HIDDEN = "hidden",
        NAME = "Key", //"Name",
        HTML = "html",
        VALUE = "Value",
        HASHLIST = "hashlist",
        COMBINE = "combine",
        persistence = Y.Wegas.persistence,
        IDATTRDEF = {
            type: NUMBER,
            optional: true, //                                                  // The id is optional for entites that
            // have not been persisted
            view: {
                type: HIDDEN
            }
        },
        SELFARG = {
            type: 'identifier',
            value: 'self',
            view: {type: HIDDEN}
        },
        VERSION_ATTR_DEF = {
            type: NUMBER,
            view: {
                type: HIDDEN
            }
        };


    /**
     * ObjectDescriptor mapper
     */
    persistence.ObjectDescriptor = Y.Base.create("ObjectDescriptor", persistence.VariableDescriptor, [], {
        getProperty: function(player, key) {
            return this.getInstance(player).get("properties." + key);
        },
        getIconCss: function() {
            return "fa fa-database";
        }
    }, {
        ATTRS: {
            "@class": {
                value: "ObjectDescriptor"
            },
            properties: {
                type: "object",
                additionalProperties: {
                    type: STRING,
                    required: true,
                    view: {
                        label: VALUE
                    }
                },
                view: {
                    label: "Descriptor properties",
                    type: HASHLIST,
                    keyLabel: NAME
                }
            },
            defaultInstance: {
                type: "object",
                properties: {
                    '@class': {
                        type: STRING,
                        value: 'ObjectInstance',
                        view: {
                            type: HIDDEN
                        }
                    },
                    id: IDATTRDEF,
                    parentId: IDATTRDEF,
                    parentType: {
                        type: "string",
                        view: {type: HIDDEN}
                    },
                    version: VERSION_ATTR_DEF,
                    refId: persistence.Entity.ATTRS_DEF.REF_ID,
                    properties: {
                        type: "object",
                        additionalProperties: {
                            type: STRING,
                            required: true,
                            view: {
                                label: VALUE
                            }
                        },
                        view: {
                            label: "Default properties",
                            type: HASHLIST,
                            keyLabel: NAME
                        }
                    }
                }
            },
            description: {
                type: ["null", STRING],
                view: {
                    type: HTML,
                    label: "Description",
                    className: 'wegas-advanced-feature'
                }
            }
        },
        METHODS: {
            size: {
                label: "size",
                returns: "number",
                arguments: [SELFARG]
            },
            getProperty: {
                label: "property", // "property equals"
                returns: STRING,
                arguments: [SELFARG, {
                        view: {label: NAME},
                        type: STRING
                    }]
            },
            setProperty: {
                label: "set property",
                arguments: [SELFARG, {
                        view: {label: NAME},
                        required: true,
                        type: STRING
                    }, {
                        view: {label: VALUE},
                        type: STRING
                    }]
            }
        }
    });

    /**
     * ObjectInstance mapper
     */
    persistence.ObjectInstance = Y.Base.create("ObjectInstance", persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "ObjectInstance"
            },
            properties: {
                additionalProperties: {
                    type: STRING,
                    required: true,
                    view: {
                        label: VALUE
                    }
                },
                view: {
                    label: "Default properties",
                    type: HASHLIST,
                    keyLabel: NAME
                }
            }
        }
    });
});
