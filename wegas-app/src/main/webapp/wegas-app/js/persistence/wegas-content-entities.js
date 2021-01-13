/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
YUI.add('wegas-content-entities', function(Y) {
    'use strict';
    var persistence = Y.Wegas.persistence;

    persistence.Content = Y.Base.create(
        'Content',
        persistence.Entity,
        [],
        {},
        {
            ATTRS: {
                '@class': {
                    transient: true
                },
                id: {
                    transient: true
                },
                mimeType: {
                    type: 'string',
                    view: {
                        label: 'Mime type',
                        type: 'uneditable'
                    }
                },
                name: {
                    type: 'string',
                    optional: true,
                    view: {
                        label: 'Name',
                        type: 'uneditable'
                    }
                },
                visibility: Y.Wegas.persistence.Entity.ATTRS_DEF.VISIBILITY,
                path: {
                    type: 'string',
                    view: {
                        type: 'hidden'
                    }
                },
                fullPath: {
                    type: 'string',
                    valueFn: function() {
                        return (
                            this.get('path') +
                            (this.get('path').match(/\/$/) ? '' : '/') +
                            this.get('name')
                        );
                    },
                    view: {
                        label: 'Path',
                        type: 'uneditable'
                    }
                },
                note: {
                    type: 'string',
                    optional: true,
                    view: {
                        label: 'Private notes',
                        type: 'textarea'
                    }
                },
                description: {
                    type: 'string',
                    optional: true,
                    view: {
                        label: 'Public description',
                        type: 'textarea'
                    }
                }
            }
        }
    );
    persistence.Directory = Y.Base.create(
        'Directory',
        persistence.Content,
        [],
        {},
        {
            ATTRS: {
                '@class': {
                    value: 'Directory'
                }
            }
        }
    );
    persistence.File = Y.Base.create(
        'File',
        persistence.Content,
        [],
        {},
        {
            ATTRS: {
                '@class': {
                    value: 'File'
                },
                bytes: {
                    writeOnce: 'initOnly',
                    transient: true,
                    setter: function(bytes) {
                        var precision = 2,
                            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
                            i = parseInt(
                                Math.floor(Math.log(bytes) / Math.log(1024))
                            );
                        return (
                            (bytes / Math.pow(1024, i)).toFixed(precision) +
                            ' ' +
                            sizes[i]
                        );
                    },
                    view: {
                        label: 'Size',
                        type: 'uneditable'
                    }
                },
                dataLastModified: {
                    writeOnce: 'initOnly',
                    transient: true,
                    setter: function(d) {
                        var date = new Date(d);
                        return date.toLocaleString();
                    },
                    view: {
                        label: 'File last uploaded',
                        type: 'uneditable'
                    }
                }
            }
        }
    );
});
