/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add("wegas-content-entities", function(Y) {
    "use strict";

    var Wegas = Y.Wegas;

    Wegas.persistence.Content = Y.Base.create("Content", Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                "transient": true
            },
            id: {
                "transient": true
            },
            mimeType: {
                type: "string",
                _inputex: {
                    _type: "uneditable"
                }
            },
            name: {
                type: "string",
                _inputex: {
                    _type: "uneditable"
                }
            },
            path: {
                type: "string",
                _inputex: {
                    _type: "uneditable"
                }
            },
            note: {
                type: "string",
                optional: true,
                _inputex: {
                    label: "Private notes",
                    _type: "text"
                }
            },
            description: {
                type: "string",
                optional: true,
                _inputex: {
                    label: "Public description",
                    _type: "text"
                }
            }
        }
    });

    Wegas.persistence.Directory = Y.Base.create("Directory", Wegas.persistence.Content, [], {}, {
        ATTRS: {
            "@class": {
                value: "Directory"
            }
        }
    });

    Wegas.persistence.File = Y.Base.create("File", Wegas.persistence.Content, [], {}, {
        ATTRS: {
            "@class": {
                value: "File"
            },
            bytes: {
                writeOnce: "initOnly",
                setter: function(bytes) {
                    var precision = 2,
                            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
                            i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                    return (bytes / Math.pow(1024, i)).toFixed(precision) + ' ' + sizes[i];
                },
                _inputex: {
                    label: "Size",
                    _type: "uneditable"
                }
            },
            dataLastModified: {
                writeOnce: "initOnly",
                setter: function(d) {
                    var date = new Date(d);
                    return date.toLocaleString();
                },
                _inputex: {
                    label: "File last uploaded",
                    _type: "uneditable"
                }
            }
        }
    });
});