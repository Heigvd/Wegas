/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add("wegas-content-entities", function(Y) {
    "use strict";
    var persistence = Y.Wegas.persistence;

    persistence.Content = Y.Base.create("Content", persistence.Entity, [], {}, {
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
                optional: true,
                _inputex: {
                    _type: "uneditable"
                }
            },
            privateContent: {
                type: "boolean",
                _inputex: {
                    label: "Private"
                }
            },
            inheritedPrivate: {
                type: "boolean",
                "transient": true,
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
            fullPath: {
                type: "string",
                valueFn: function() {
                    return this.get("path") + (this.get("path").match(/\/$/) ? "" : "/") + this.get("name");
                },
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
    persistence.Directory = Y.Base.create("Directory", persistence.Content, [], {}, {
        ATTRS: {
            "@class": {
                value: "Directory"
            }
        }
    });
    persistence.File = Y.Base.create("File", persistence.Content, [], {}, {
        ATTRS: {
            "@class": {
                value: "File"
            },
            bytes: {
                writeOnce: "initOnly",
                "transient": true,
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
                "transient": true,
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
