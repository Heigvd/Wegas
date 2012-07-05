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
                        requires: ['stylesheet', 'wegas-appcss', 'wegas-entity',
                        'wegas-datasourcerest', 'wegas-widget', 'wegas-pageloader',
                        /* @fixme those should be included on the fly*/
                        'wegas-text',  'wegas-tabview', 'wegas-datatable',
                        'wegas-variabledisplay',
                       'wegas-button',
                        'wegas-chat',
                        'wegas-list',
                        /*Benjamin temp while I don't understand how to load "on the fly" your game*/
                        'wegas-leaderway'
                        ]
                    },
                    'wegas-appcss': {
                        path: 'wegas-app/css/wegas-app.css',
                        type: 'css'
                    },
                    'wegas-datasourcerest': {
                        path: 'wegas-app/js/wegas-datasourcerest-min.js',
                        requires: ['plugin', 'json', 'array-extras', 'io-base', "datasource-io", "datasource-jsonschema", "datasource-cache"]
                    },
                    'wegas-entity': {
                        path: 'wegas-app/js/wegas-entity-min.js',
                        requires: ['node']
                    },

                    /** Widgets **/
                    'wegas-widget': {
                        path: 'wegas-app/js/widget/wegas-widget-min.js',
                        requires: ['widget', 'widget-parent', 'widget-child']
                    },
                    'wegas-pageloader': {
                        path: 'wegas-app/js/widget/wegas-pageloader-min.js',
                        ix_provides: 'PageLoader'
                    },
                    'wegas-button': {
                        path: 'wegas-app/js/widget/wegas-button-min.js',
                        requires: ['inputex-select', 'wegas-widget', 'plugin'],
                        ix_provides: 'Button'
                    },
                    'wegas-chat': {
                        path: 'wegas-app/js/widget/wegas-chat-min.js',
                        ix_provides: 'Chat'
                    },
                    'wegas-layout': {
                        path: 'wegas-app/js/widget/wegas-layout-min.js',
                        requires: ['yui2-layout', 'yui2-resize',
                        // 'yui2-event-mouseenter', 'yui2-event-delegate', 'yui2-yahoo', 'yui2-dom', 'yui2-containercore'
                        // 'yui2-event', 'yui2-element', 'yui2-dragdrop', 'yui2-animation', 'yui2-selector',
                        ],
                        ix_provides: 'Layout'
                    },
                    'wegas-list': {
                        path: 'wegas-app/js/widget/wegas-list-min.js',
                        requires: ["substitute", "node-focusmanager"],
                        ix_provides: 'List'
                    },
                    'wegas-text': {
                        path: 'wegas-app/js/widget/wegas-text-min.js',
                        ix_provides: "Text"
                    },
                    'wegas-tabview': {
                        path: 'wegas-app/js/widget/wegas-tabview-min.js',
                        requires: ['tabview', 'button'],
                        ix_provides: 'TabView'
                    },
                    'wegas-variabledisplay': {
                        path: 'wegas-app/js/widget/wegas-variabledisplay-min.js',
                        requires: ['excanvas'],
                        ix_provides: 'VariableDisplay'
                    },
                    'wegas-inbox': {
                        path: 'wegas-app/js/widget/wegas-inbox-min.js',
                        ix_provides: 'InboxDisplay'
                    },

                    /** Inputex Fields **/
                    'wegas-inputex': {
                        path: 'wegas-app/js/widget/wegas-inputex-min.js',
                        requires: [ 'inputex', 'inputex-field', 'inputex-string', 'inputex-keyvalue' ]
                    },
                    'wegas-inputex-rte': {
                        path: 'wegas-app/js/widget/wegas-inputex-rte-min.js',
                        requires: ['inputex-field', 'yui2-editor', 'panel'],
                        ix_provides: 'html'
                    },
                    'wegas-inputex-hashlist': {
                        path: 'wegas-app/js/widget/wegas-inputex-hashlist-min.js',
                        requires: ['inputex-list'],
                        ix_provides: 'hashlist'
                    },

                    /** Editor **/
                    'wegas-editor': {
                        path: 'wegas-editor/js/wegas-editor-min.js',
                        requires: [
                        'wegas-inputex', 'wegas-app', 'wegas-editmenu',

                        'wegas-logger', 'wegas-csseditor',
                        'wegas-editor-topmenu', "wegas-console", 'wegas-fileexplorer',
                        'wegas-scriptlibrary', 'wegas-layout', 'wegas-statemachineviewer',
                        'wegas-wysiwygeditor', 'wegas-treeview',
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
                        requires: ['console', 'console-filters'],
                        ix_provides: 'Logger'
                    },
                    'wegas-editor-topmenu': {
                        path: 'wegas-editor/js/wegas-editor-topmenu-min.js',
                        requires: ['yui2-menu'],
                        ix_provides: 'EditorTopMenu'
                    },
                    'wegas-csseditor': {
                        path: 'wegas-editor/js/wegas-csseditor-min.js',
                        requires: ['ace-css'],
                        ix_provides: 'CSSEditor'
                    },
                    'wegas-console': {
                        path: 'wegas-editor/js/wegas-console-min.js',
                        requires: ['ace-javascript'],
                        ix_provides: 'Console'
                    },
                    'wegas-editmenu': {
                        path: 'wegas-editor/js/wegas-editmenu-min.js',
                        requires: ['widget', 'widget-position', 'widget-position-align', 'widget-stack', 'yui2-menu']
                    },
                    'wegas-treeview': {
                        path: 'wegas-editor/js/wegas-treeview-min.js',
                        requires: [ 'yui2-treeview' /*'gallery-yui3treeview', 'wegas-treeviewcss'*/],
                        ix_provides: 'WTreeView'
                    },
                    'wegas-datatable': {
                        path: 'wegas-editor/js/wegas-datatable-min.js',
                        requires: ['datatable', 'datatable-sort' ],
                        ix_provides: 'DataTable'
                    },
                    'wegas-scriptlibrary': {
                        path: 'wegas-editor/js/wegas-scriptlibrary-min.js',
                        requires: [ 'ace-javascript', 'button' ],
                        ix_provides: 'ScriptLibrary'
                    },
                    'wegas-fileexplorer': {
                        path: 'wegas-editor/js/wegas-fileexplorer.js',
                        requires: ['treeview', 'uploader-html5'],
                        ix_provides: "FileExplorer"
                    },
                    'wegas-statemachineviewer': {
                        path: 'wegas-editor/js/wegas-statemachineviewer.js',
                        requires: ['wegas-statemachineviewercss', 'jsplumb-yui', 'jsplumb-svg', 'jsplumb-defaults', 'jsplumb-statemachine', 'button'],
                        ix_provides: 'StateMachineViewer'
                    },
                    'wegas-statemachineviewercss': {
                        path: 'wegas-editor/css/wegas-statemachineviewer.css'
                    },
                    'wegas-wysiwygeditor': {
                        path: 'wegas-editor/js/wegas-wysiwygeditor.js',
                        requires: ['inputex', 'inputex-jsonschema', 'esprima', 'escodegen'],
                        ix_provides: "WysiwygEditor"
                    },

                    /** Project Management Game **/
                    'wegas-projectmanagementgame': {
                        path: 'wegas-projectmanagementgame/js/wegas-projectmanagementgame-min.js',
                        ix_provides: "todo"
                    },

                    /** CrimeSim **/
                    'wegas-mcqtabview': {
                        path: 'wegas-crimesim/js/wegas-mcqtabview-min.js',
                        requires: ['tabview'],
                        ix_provides: "MCQTabView"
                    },
                    'wegas-crimesim': {
                        path: 'wegas-crimesim/js/wegas-crimesim-min.js',
                        requires: ['wegas-widget', 'widget-position', 'widget-position-align', 'widget-stack', "yui2-menu"],
                        ix_provides: "ScheduleDisplay"
                    },
                   /**Leaderway**/
                    'wegas-leaderway': {
                        path: 'wegas-leaderway/js/wegas-leaderway-hrlist.js',
                        requires:['wegas-leaderway-folder', 'wegas-leaderway-tasklist', 'wegas-leaderway-score', 'wegas-leaderway-dialogue']
                    },
                    'wegas-leaderway-folder':{
                        path: 'wegas-leaderway/js/wegas-leaderway-folder.js'
                    },
                    'wegas-leaderway-tasklist': {
                        path: 'wegas-leaderway/js/wegas-leaderway-tasklist.js'
                    },
                    'wegas-leaderway-score': {
                        path: 'wegas-leaderway/js/wegas-leaderway-score.js'
                    },
                    'wegas-leaderway-dialogue': {
                        path: 'wegas-leaderway/js/wegas-leaderway-dialogue.js',
                        /*!!!*/requires:['charts', 'charts-legend']/*!!!*/
                    },
                    
                    /** MMO **/
                    'wegas-mmo': {
                        path: 'wegas-mmo/js/wegas-mmo-min.js',
                        requires: ['wegas-widget', 'ace-javascript'],
                        ix_provides: 'MMOWidget'
                    }
                }
            },

            /* Ace */
            ace: {
                combine: false,
                base: "lib/CodeMirror/",
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
                        requires: ['ace']
                    }
                }
            },
            /* jsPlumb */
            jsplumb: {
                combine: false,
                base:"lib/jsPlumb-1.3.10/",
                modules: {
                    'jsplumb': {
                        path: 'jsPlumb-1.3.10-RC1.js',
                        requires: ['jsplumb-utils']
                    },
                    'jsplumb-utils': {
                        path: 'jsPlumb-util-1.3.10-RC1.js',
                        requires: []
                    },
                    'jsplumb-svg': {
                        path: 'jsPlumb-renderers-svg-1.3.10-RC1.js',
                        requires: ['jsplumb']
                    },
                    'jsplumb-defaults': {
                        path: 'jsPlumb-defaults-1.3.10-RC1.js',
                        requires: ['jsplumb']
                    },
                    'jsplumb-statemachine': {
                        path: 'jsPlumb-connectors-statemachine-1.3.10-RC1.js',
                        requires: ['jsplumb', 'jsbezier']
                    },
                    'jsplumb-yui': {
                        path: 'yui.jsPlumb-1.3.10-RC1.js',
                        requires: ['jsplumb']
                    },
                    'jsbezier': {
                        path: 'jsBezier-0.3-min.js'
                    }
                }
            },

            /* ExCanvas */
            excanvas: {
                combine: false,
                base: "lib/excanvas/",
                modules:  {
                    'excanvas': {
                        path: 'excanvas.compiled.js'
                    }
                }
            },

            /* Esprima */
            esprima: {
                combine: false,
                base: "lib/esprima/",
                modules:  {
                    'esprima': {
                        path: 'esprima-min.js'
                    },
                    'escodegen': {
                        path: '/test/3rdparty/escodegen.js'
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
    loadModules(YUI_config.groups.excanvas);
    loadModules(YUI_config.groups.esprima);
    loadModules(YUI_config.groups.jsplumb);
});
