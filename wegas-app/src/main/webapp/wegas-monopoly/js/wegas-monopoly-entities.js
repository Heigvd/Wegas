/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-monopoly-entities', function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", ARRAY = "array", NAME = "name",
    SELF = "self", BOOLEAN = "boolean", NUMBER = "number", SELECT = "select",
    OBJECT = "object", HTML = "html", VALUE = "value", HASHLIST = "hashlist",
    COMBINE = "combine";

    /**
     * ObjectDescriptor mapper
     */
    Y.Wegas.persistence.ObjectDescriptor = Y.Base.create("ObjectDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {}, {
        ATTRS: {
            "@class": {
                value: "ObjectDescriptor"
            },
            properties: {
                optional: false,
                _inputex: {
                    label: "Descriptor properties",
                    _type: HASHLIST,
                    keyField: NAME,
                    valueField: VALUE,
                    elementType: {
                        type: COMBINE,
                        fields: [{
                            name: NAME,
                            typeInvite: NAME
                        }, {
                            name: VALUE,
                            typeInvite: VALUE
                        }]
                    }
                }
            },
            defaultInstance: {
                type: "object",
                properties: {
                    '@class': {
                        type: STRING,
                        _inputex: {
                            _type: HIDDEN,
                            value: 'ObjectInstance'
                        }
                    },
                    properties: {
                        optional: false,
                        _inputex: {
                            label: "Instance properties",
                            _type: HASHLIST,
                            keyField: NAME,
                            valueField: VALUE,
                            elementType: {
                                type: COMBINE,
                                fields: [{
                                    name: NAME,
                                    typeInvite: NAME
                                }, {
                                    name: VALUE,
                                    typeInvite: VALUE
                                }]
                            }
                        }
                    }
                }
            },
            description: {
                type: STRING,
                format: HTML,
                optional: true
            }
        },
        METHODS:{
           size:{
                label: "size",
                returns: "number",
                arguments: [{
                        type: "hidden",
                        value: "self"
                    }]
            }
        }
    });

    /**
     * ObjectInstance mapper
     */
    Y.Wegas.persistence.ObjectInstance = Y.Base.create("ObjectInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "ObjectInstance"
            },
            properties: {
                optional: false,
                _inputex: {
                    label: "Instance properties",
                    _type: HASHLIST,
                    keyField: NAME,
                    valueField: VALUE,
                    elementType: {
                        type: COMBINE,
                        fields: [{
                            name: NAME,
                            typeInvite: NAME
                        }, {
                            name: VALUE,
                            typeInvite: VALUE
                        }]
                    }
                }
            }
        }
    });
});
