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
        Wegas = Y.Wegas;

    /**
     * ObjectDescriptor mapper
     */
    Wegas.persistence.ObjectDescriptor = Y.Base.create("ObjectDescriptor", Wegas.persistence.VariableDescriptor, [], {
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
                    useButtons: true,
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
                            label: "Default properties",
                            _type: HASHLIST,
                            keyField: NAME,
                            useButtons: true,
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
                returns: "string",
                arguments: [{
                        type: HIDDEN,
                        value: "self"
                    }, {
                        value: "property name",
                        scriptType: STRING
                    }]
            },
            setProperty: {
                label: "set property",
                arguments: [{
                        type: HIDDEN,
                        value: "self"
                    }, {
                        value: "property name",
                        scriptType: STRING
                    }, {
                        value: VALUE,
                        scriptType: STRING
                    }]
            }
        }
    });

    /**
     * ObjectInstance mapper
     */
    Wegas.persistence.ObjectInstance = Y.Base.create("ObjectInstance", Wegas.persistence.VariableInstance, [], {}, {
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
                    useButtons: true,
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
