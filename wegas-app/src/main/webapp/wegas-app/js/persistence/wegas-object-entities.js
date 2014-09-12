/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-object-entities', function(Y) {
    "use strict";

    var STRING = "string", HIDDEN = "hidden", NAME = "name", HTML = "html",
        VALUE = "value", HASHLIST = "hashlist", COMBINE = "combine",
        persistence = Y.Wegas.persistence;

    /**
     * ObjectDescriptor mapper
     */
    persistence.ObjectDescriptor = Y.Base.create("ObjectDescriptor", persistence.VariableDescriptor, [], {
        getProperty: function(player, key) {
            return this.getInstance(player).get("properties." + key);
        }
    }, {
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
                    wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature",
                    elementType: {
                        type: COMBINE,
                        fields: [{
                                name: NAME,
                                typeInvite: NAME,
                                size: 10
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
                            label: "Default properties",
                            _type: HASHLIST,
                            keyField: NAME,
                            valueField: VALUE,
                            elementType: {
                                type: COMBINE,
                                fields: [{
                                        name: NAME,
                                        typeInvite: NAME,
                                        size: 10
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
                optional: true,
                _inputex: {
                    wrapperClassName: 'inputEx-fieldWrapper wegas-advanced-feature'
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
                optional: false,
                _inputex: {
                    label: "Properties",
                    _type: HASHLIST,
                    keyField: NAME,
                    valueField: VALUE,
                    elementType: {
                        type: COMBINE,
                        fields: [{
                                name: NAME,
                                typeInvite: NAME,
                                size: 10
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
