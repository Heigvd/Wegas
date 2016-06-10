/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-object-entities', function (Y) {
    "use strict";

    var STRING = "string",
        NUMBER = "number",
        HIDDEN = "hidden",
        NAME = "name",
        HTML = "html",
        VALUE = "value",
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
        };

    /**
     * ObjectDescriptor mapper
     */
    persistence.ObjectDescriptor = Y.Base.create("ObjectDescriptor", persistence.VariableDescriptor, [], {
        getProperty: function (player, key) {
            return this.getInstance(player).get("properties." + key);
        },
        getIconCss: function () {
            return "fa fa-database";
        }
    }, {
            ATTRS: {
                "@class": {
                    value: "ObjectDescriptor"
                },
                properties: {
                    type: "object",
                    defaultProperties: {
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
                        descriptorId: IDATTRDEF,
                        properties: {
                            type: "object",
                            defaultProperties: {
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
                    arguments: [{
                        type: HIDDEN,
                        value: "self"
                    }]
                },
                getProperty: {
                    label: "property equals",
                    returns: STRING,
                    arguments: [{
                        type: HIDDEN,
                        value: "self"
                    }, {
                            typeInvite: NAME,
                            scriptType: STRING
                        }]
                },
                setProperty: {
                    label: "set property",
                    arguments: [{
                        type: HIDDEN,
                        value: "self"
                    }, {
                            typeInvite: NAME,
                            scriptType: STRING
                        }, {
                            typeInvite: VALUE,
                            scriptType: STRING
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
                defaultProperties: {
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
