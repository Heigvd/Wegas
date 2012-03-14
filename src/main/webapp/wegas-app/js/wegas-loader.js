/**
 *
 * Wegas loader, contains module definitions.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI().use(function(Y) {
    var CONFIG = {
        groups: {
            'wegas': {
                combine: false,
                //  base: Config.base,
                //    comboBase: Config.base,
                filter:"raw",
                modules: {
                    /*************************************************************** Base */
                    'wegas-app': {
                        path: 'wegas-app/js/wegas-app-min.js',
                        requires: ['stylesheet',
                        'wegas-appcss',  'wegas-datasourcerest', 'wegas-widget', 'wegas-widgetloader',
                        // FIXME those should be included on the fly
                        'wegas-layout', 'wegas-text', 'wegas-list', 'wegas-tabview', 'wegas-datatable', 'wegas-displayarea',
                        'wegas-widgetloader', 'wegas-variabledisplay', 'wegas-button', 'wegas-chat',
                        'wegas-projectmanagementgame'
                        ]
                    },
                    'wegas-appcss': {
                        path: 'wegas-app/resources/css/wegas-app.css',
                        type: 'css'
                    },
                    'wegas-datasourcerest': {
                        path: 'wegas-app/js/wegas-datasourcerest-min.js',
                        requires: ['plugin', 'json', 'io-base', "datasource-io", "datasource-jsonschema", "datasource-cache", 'array-extras'
                        /*'json-stringify', "datatype-date */]
                    },
                    /*************************************************************** Widgets */
                    'wegas-widget': {
                        path: 'wegas-app/js/wegas-widget-min.js',
                        requires: ['widget', 'widget-parent', 'widget-child']
                    },
                    'wegas-widgetloader': {
                        path: 'wegas-app/js/wegas-widgetloader-min.js'
                    },
                    'wegas-button': {
                        path: 'wegas-app/js/wegas-button-min.js'
                    },
                    'wegas-variabledisplay': {
                        path: 'wegas-app/js/wegas-variabledisplay-min.js',
                        requires: ['excanvas']
                    },
                    'wegas-chat': {
                        path: 'wegas-app/js/wegas-chat-min.js'
                    },
                    'wegas-layout': {
                        path: 'wegas-app/js/wegas-layout-min.js',
                        requires: ['yui2-layout','yui2-event-mouseenter', 'yui2-event-delegate','yui2-yahoo', 'yui2-dom',
                        'yui2-event', 'yui2-element', 'yui2-dragdrop', 'yui2-animation', 'yui2-selector', 'yui2-resize',
                        'yui2-containercore', 'yui2-menu', 'yui2-calendar']
                    },
                    'wegas-list': {
                        path: 'wegas-app/js/wegas-list-min.js',
                        requires: ["substitute", "node-focusmanager"]
                    },
                    'wegas-text': {
                        path: 'wegas-app/js/wegas-text-min.js'
                    },
                    'wegas-tabview': {
                        path: 'wegas-app/js/wegas-tabview-min.js',
                        requires: ['tabview', 'yui2-editor']
                    },
                    'wegas-displayarea': {
                        path: 'wegas-app/js/wegas-displayarea-min.js'
                    },
                    /*************************************************************** Editor */
                    'wegas-editor': {
                        path: 'wegas-editor/js/wegas-editor-min.js',
                        requires: [
                        'wegas-inputex', 'wegas-app', 'wegas-treeview', 'wegas-logger', 'wegas-csseditor', 'wegas-editmenu',
                        'wegas-editor-topmenu'
                        /* @fixme There is a bug in css include order, this one got hardcoded in the jsp file */
                        //'wegas-editorcss'
                        ]
                    },
                    'wegas-editorcss': {
                        path: 'wegas-editor/resources/css/wegas-editor.css',
                        type: 'css'
                    },

                    /************************************************************** Editor Widget's */
                    'wegas-logger': {
                        path: 'wegas-editor/js/wegas-logger-min.js',
                        requires: ['console', 'console-filters']
                    },
                    'wegas-inputex':{
                        path: 'wegas-app/js/wegas-inputex-min.js',
                        requires: [
                        'inputex', 'inputex-form', 'inputex-email', 'inputex-radio', 'inputex-url',
                        'inputex-select', 'inputex-checkbox', 'inputex-list', 'inputex-hidden',
                        'inputex-password', 'inputex-group', 'inputex-string', 'inputex-textarea',
                        'inputex-keyvalue', 'inputex-combine', "inputex-field", 'yui2-editor', "inputex-rte" ]
                    },
                    'wegas-editor-topmenu': {
                        path: 'wegas-editor/js/wegas-editor-topmenu-min.js',
                        requires: ['yui2-menu']
                    },
                    'wegas-csseditor': {
                        path: 'wegas-editor/js/wegas-csseditor-min.js'
                    },
                    'wegas-editmenu': {
                        path: 'wegas-editor/js/wegas-editmenu-min.js',
                        requires: ['widget', 'widget-position', 'widget-position-align', 'widget-stack']
                    },
                    'wegas-treeview': {
                        path: 'wegas-editor/js/wegas-treeview-min.js',
                        requires: [ 'yui2-treeview'
                        /*'gallery-yui3treeview', 'wegas-treeviewcss'*/]
                    },
                    /* This one is only seful w/ yui3 treeview widget */
                    /* 'wegas-treeviewcss': {
                    path: 'wegas-app/resources/css/treeview-classic.css',
                    type: 'css'
                },*/
                    'wegas-datatable': {
                        path: 'wegas-editor/js/wegas-datatable-min.js',
                        requires: ['datatable', "datatable-datasource", 'yui2-button',
                        /*'datatable-events', 'datatable-sort',*/ ]
                    },
                    /*'wegas-treeble': {
                    path: 'wegas-app/js/wegas-treeble.js',
                    requires: ['gallery-treeble', 'yui2-button' ]
                },
                'wegas-wireit-container': {
                    path: 'wegas-admin/js/wegas-wireit-container-min.js',
                    requires: ['wireit']
                },*/
                    /************************************************************** PMG */
                    'wegas-projectmanagementgame': {
                        path: 'wegas-projectmanagementgame/js/wegas-projectmanagementgame-min.js'
                    }
                }
            }
        /* Wire It */
        /* Desactivated */
        /*wireit: {
            combine: false,
            base: "lib/wireit/",
            //comboBase: Config.path+'combo/?',
            //root: 'dd',
            modules:  {
                'wireit': {
                    path: 'build/wireit.js',
                    //path: 'js/WireIt.js',
                    requires: ["yui2-utilities", 'excanvas']
                },
                'wire': {
                    path: 'js/Wire.js',
                    requires: ['wireit', 'wireit-dd', 'wireit-anim', 'canvaselement', 'terminal']
                },
                'canvaselement': {
                    path: 'js/CanvasElement.js'
                },
                'terminal': {
                    path: 'js/Terminal.js'
                },
                'excanvas': {
                    path: 'lib/excanvas.js'
                },
                'wireit-anim': {
                    path: 'js/util/Anim.js'
                },
                'wireit-dd': {
                    path: 'js/util/DD.js'
                }
            }
        },*/
        }
    };

    if(typeof YUI_config === 'undefined') {
        YUI_config = {
            groups: {}
        };
    }
    Y.mix(YUI_config.groups, CONFIG.groups);

    // Loop through all modules
    var modules = YUI_config.groups.wegas.modules,
    allModules = [],
    modulesByType = {};
    for(var moduleName in modules) {
        if (modules.hasOwnProperty(moduleName) ) {

            // Build a list of all Wegas modules
            allModules.push(moduleName);

            // Build a reverse index on which module provides what type
            if(modules[moduleName].ix_provides) {
                modulesByType[modules[moduleName].ix_provides] = moduleName;
            }

        }
    }
    YUI_config.groups.wegas.allModules = allModules;
    YUI_config.groups.wegas.modulesByType = modulesByType;

});
