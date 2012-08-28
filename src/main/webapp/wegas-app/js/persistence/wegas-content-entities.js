/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
Y.add("wegas-content-entities", function(Y){

    Y.Wegas.persistence.Content = Y.Base.create("Content", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS:{
            "@class":{
                "transient":true
            },
            id:{
                "transient":true
            },
            mimeType:{
                type:"string",
                _inputex:{
                    _type:"uneditable"
                }
            },
            name:{
                type:"string",
                _inputex:{
                    _type:"uneditable"
                }
            },
            path:{
                type:"string",
                _inputex:{
                    _type:"uneditable"
                }
            },
            note:{
                type:"string",
                optional:true,
                _inputex:{
                    _type:"text"
                }
            },
            description:{
                type:"string",
                optional:true,
                _inputex:{
                    _type:"text"
                }
            }
        }
    });

    Y.Wegas.persistence.Directory = Y.Base.create("Directory", Y.Wegas.persistence.Content, [], {}, {
        ATTRS:{
            "@class":{
                value:"Directory"
            }
        }
    });

    Y.Wegas.persistence.File = Y.Base.create("File", Y.Wegas.persistence.Content, [], {}, {
        ATTRS:{
            "@class":{
                value:"File"
            },
            bytes:{
                writeOnce:"initOnly",
                "transient": true,
                setter:function(bytes){
                    var precision = 2,
                    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'],
                    i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                    return (bytes / Math.pow(1024, i)).toFixed(precision) + ' ' + sizes[i];
                },
                _inputex:{
                    label:"Size",
                    _type:"uneditable"
                }
            },
            dataLastModified:{
                writeOnce:"initOnly",
                "transient": true,
                setter: function(d){
                    var date = new Date(d);
                    return date.toLocaleString();
                },
                _inputex:{
                    label:"File last uploaded",
                    _type:"uneditable"
                }
            }
        }
    });
});