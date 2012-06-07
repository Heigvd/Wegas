/**
 *
 * Wegas loader, contains module definitions.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI().use(function (Y) {
    "use strict";

    var CONFIG = {
        groups: {
            'wegas': {
                combine: false,
                filter: "raw",
                modules: {

                    /** Base **/
                    'wegas-app': {
                        path: 'wegas-app/js/wegas-app-min.js',
                        requires: ['stylesheet',
                        'wegas-appcss', 'wegas-datasourcerest', 'wegas-widget', 'wegas-widgetloader',
                        /* @fixme those should be included on the fly*/
                        'wegas-layout', 'wegas-text', 'wegas-list', 'wegas-tabview', 'wegas-datatable', 'wegas-displayarea',
                        'wegas-widgetloader', 'wegas-variabledisplay', 'wegas-button', 'wegas-chat', 'wegas-inbox',
                        'wegas-projectmanagementgame', 'wegas-crimesim'
                        ]
                    },
                    'wegas-appcss': {
                        path: 'wegas-app/css/wegas-app.css',
                        type: 'css'
                    },
                    'wegas-datasourcerest': {
                        path: 'wegas-app/js/wegas-datasourcerest-min.js',
                        requires: ['plugin', 'json', 'io-base', "datasource-io", "datasource-jsonschema", "datasource-cache", 'array-extras'
                        /*'json-stringify', "datatype-date */]
                    },

                    /** Widgets **/
                    'wegas-widget': {
                        path: 'wegas-app/js/widget/wegas-widget-min.js',
                        requires: ['widget', 'widget-parent', 'widget-child']
                    },
                    'wegas-widgetloader': {
                        path: 'wegas-app/js/widget/wegas-widgetloader-min.js'
                    },
                    'wegas-button': {
                        path: 'wegas-app/js/widget/wegas-button-min.js'
                    },
                    'wegas-chat': {
                        path: 'wegas-app/js/widget/wegas-chat-min.js'
                    },
                    'wegas-layout': {
                        path: 'wegas-app/js/widget/wegas-layout-min.js',
                        requires: ['yui2-layout', 'yui2-event-mouseenter', 'yui2-event-delegate', 'yui2-yahoo', 'yui2-dom',
                        'yui2-event', 'yui2-element', 'yui2-dragdrop', 'yui2-animation', 'yui2-selector', 'yui2-resize',
                        'yui2-containercore', 'yui2-menu', 'yui2-calendar']
                    },
                    'wegas-list': {
                        path: 'wegas-app/js/widget/wegas-list-min.js',
                        requires: ["substitute", "node-focusmanager"]
                    },
                    'wegas-text': {
                        path: 'wegas-app/js/widget/wegas-text-min.js'
                    },
                    'wegas-tabview': {
                        path: 'wegas-app/js/widget/wegas-tabview-min.js',
                        requires: ['tabview', 'yui2-editor']
                    },
                    'wegas-displayarea': {
                        path: 'wegas-app/js/widget/wegas-displayarea-min.js'
                    },

                    'wegas-variabledisplay': {
                        path: 'wegas-app/js/widget/wegas-variabledisplay-min.js',
                        requires: ['excanvas']
                    },
                    'wegas-inbox': {
                        path: 'wegas-app/js/widget/wegas-inbox-min.js'
                    },
                    'wegas-inputex': {
                        path: 'wegas-app/js/widget/wegas-inputex-min.js',
                        requires: [
                        'inputex', 'inputex-form', 'inputex-email', 'inputex-radio', 'inputex-url',
                        'inputex-select', 'inputex-checkbox', 'inputex-list', 'inputex-hidden',
                        'inputex-password', 'inputex-group', 'inputex-string', 'inputex-textarea',
                        'inputex-keyvalue', 'inputex-combine', "inputex-field", 'yui2-editor', "inputex-rte" ]
                    },

                    /** Editor **/
                    'wegas-editor': {
                        path: 'wegas-editor/js/wegas-editor-min.js',
                        requires: [
                            'wegas-inputex', 'wegas-app', 'wegas-treeview',
                            'wegas-logger', 'wegas-csseditor', 'wegas-editmenu',
                            'wegas-editor-topmenu', "wegas-console", 'wegas-fileexplorer',
                            'ace-css'
                        /* @fixme There is a bug in css include order, this one got hardcoded in the jsp file */
                        //'wegas-editorcss',
                        ]
                    },
                    'wegas-editorcss': {
                        path: 'wegas-editor/css/wegas-editor.css',
                        type: 'css'
                    },

                    /** Editor's Widgets **/
                    'treeview':{
                        path: 'wegas-editor/js/treeview.js',
                        requires: ['widget', 'widget-parent', 'widget-child']
                    },
                    'wegas-logger': {
                        path: 'wegas-editor/js/wegas-logger-min.js',
                        requires: ['console', 'console-filters']
                    },
                    'wegas-editor-topmenu': {
                        path: 'wegas-editor/js/wegas-editor-topmenu-min.js',
                        requires: ['yui2-menu']
                    },
                    'wegas-csseditor': {
                        path: 'wegas-editor/js/wegas-csseditor-min.js'
                    },
                    'wegas-console': {
                        path: 'wegas-editor/js/wegas-console-min.js'
                    },
                    'wegas-editmenu': {
                        path: 'wegas-editor/js/wegas-editmenu-min.js',
                        requires: ['widget', 'widget-position', 'widget-position-align', 'widget-stack']
                    },
                    'wegas-treeview': {
                        path: 'wegas-editor/js/wegas-treeview-min.js',
                        requires: [ 'yui2-treeview' /*'gallery-yui3treeview', 'wegas-treeviewcss'*/]
                    },
                    'wegas-datatable': {
                        path: 'wegas-editor/js/wegas-datatable-min.js',
                        requires: ['datatable-deprecated', 'yui2-button' /*'datatable-events', 'datatable-sort',*/ ]
                    },
                    'wegas-fileexplorer': {
                        path: 'wegas-editor/js/wegas-fileexplorer.js',
                        requires: ['treeview', 'uploader-html5']
                    },

                    /** Project Management Game */
                    'wegas-projectmanagementgame': {
                        path: 'wegas-projectmanagementgame/js/wegas-projectmanagementgame-min.js'
                    },

                    /** CrimeSim */
                    'wegas-mcqtabview': {
                        path: 'wegas-crimesim/js/wegas-mcqtabview-min.js',
                        requires: ['tabview']
                    },
                    'wegas-crimesim': {
                        path: 'wegas-crimesim/js/wegas-crimesim-min.js',
                        requires: ['widget', 'widget-position', 'widget-position-align', 'widget-stack', "yui2-menu",
                        "wegas-mcqtabview"]
                    }
                    /* This one is only seful w/ yui3 treeview widget */
                    /* 'wegas-treeviewcss': {
                        path: 'wegas-app/css/treeview-classic.css',
                        type: 'css'
                        },*/
                    /*'wegas-treeble': {
                        path: 'wegas-app/js/wegas-treeble.js',
                        requires: ['gallery-treeble', 'yui2-button' ]
                    },
                    'wegas-wireit-container': {
                        path: 'wegas-admin/js/wegas-wireit-container-min.js',
                        requires: ['wireit']
                    },*/
                }
            },

            /* Ace */
            ace: {
                combine: false,
                //base: "lib/CodeMirror/",
                modules:  {
                    'ace': {
                        path: 'src/ace.js'
                    },
                    'ace-javascript': {
                        path: 'src/mode-javascript.js',
                        requires: ['ace']
                    },
                    'ace-css': {
                        path: 'src/mode-css.js',
                        requires: ['ace-javascript']
                    }
                }
            },

            /* Wire It */
            wireit: {
                combine: false,
                base: "lib/wireit/",
                modules:  {
                    'wireit': {
                        path: 'build/wireit.js',
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
            }
        }
    };

    if (typeof YUI_config === 'undefined') {
        YUI_config = {
            groups: {}
        };
    }
    Y.mix(YUI_config.groups, CONFIG.groups);

    function loadModules(group) {
        var modules = group.modules,
        moduleName,
        allModules = [],
        modulesByType = {};
        for (moduleName in modules) {                                           // Loop through all modules
            if (modules.hasOwnProperty(moduleName)) {
                allModules.push(moduleName);                                    // Build a list of all modules

                if (modules[moduleName].ix_provides) {                          // Build a reverse index on which module provides what type
                    modulesByType[modules[moduleName].ix_provides] = moduleName;
                }

            }
        }
        group.allModules = allModules;
        group.modulesByType = modulesByType;
    }

    loadModules(YUI_config.groups.wegas);
    loadModules(YUI_config.groups.ace);
    loadModules(YUI_config.groups.wireit);
});
