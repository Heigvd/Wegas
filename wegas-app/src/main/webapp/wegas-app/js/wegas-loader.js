/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * Wegas loader, contains module definitions.
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI().use(function(Y) {
    "use strict";

    var CONFIG = {
        groups: {
            'wegas': {
                combine: true,
                base: './',
                root: '/',
                modules: {
                    /** Base **/
                    'wegas-app': {
                        path: 'wegas-app/js/wegas-app-min.js',
                        requires: [
                        'wegas-datasourcerest', 'wegas-scripteval',
                        'wegas-entity', 'wegas-mcq-entities', 'wegas-statemachine-entities',
                        'wegas-pageloader', 'wegas-button', 'stylesheet'
                        //'wegas-appcss',                                       // @fixme There is a bug in css include order, this one got hardcoded in the jsp file
                        ]
                    },
                    'wegas-appcss': {
                        path: 'wegas-app/css/wegas-app.css',
                        type: 'css'
                    },
                    'wegas-datasourcerest': {
                        path: 'wegas-app/js/wegas-datasourcerest-min.js',
                        requires: ['plugin', 'json', 'array-extras', 'io-base',
                        "datasource-io", "datasource-jsonschema", "datasource-cache"]
                    },
                    'wegas-scripteval': {
                        path: 'wegas-app/js/wegas-scripteval-min.js',
                        requires: ['plugin']
                    },
                    'wegas-injector': {
                        path: 'wegas-app/js/widget/wegas-injector-min.js',
                        ix_provides: "Injector"
                    },
                    /** Persistence **/
                    'wegas-entity': {
                        path: 'wegas-app/js/persistence/wegas-entity-min.js',
                        requires: ['base'/*, 'inputex-jsonschema'*/]
                    },
                    'wegas-statemachine-entities': {
                        path: 'wegas-app/js/persistence/wegas-statemachine-entities-min.js',
                        requires: ['wegas-entity', 'wegas-widget']
                    },
                    'wegas-mcq-entities': {
                        path: 'wegas-app/js/persistence/wegas-mcq-entities-min.js',
                        requires: ['wegas-entity']
                    },
                    'wegas-content-entities': {
                        path: 'wegas-app/js/persistence/wegas-content-entities.js',
                        requires: ['wegas-entity']
                    },
                    /** Widgets **/
                    'wegas-widget': {
                        path: 'wegas-app/js/widget/wegas-widget-min.js',
                        requires: ['widget', 'widget-parent', 'widget-child', 'anim-easing']
                    },
                    'wegas-pageloader': {
                        path: 'wegas-app/js/widget/wegas-pageloader-min.js',
                        ix_provides: 'PageLoader'
                    },
                    'wegas-button': {
                        path: 'wegas-app/js/widget/wegas-button-min.js',
                        requires: ['wegas-widget', 'wegas-action', 'button'],
                        ix_provides: 'Button'
                    },
                    'wegas-action': {
                        path: 'wegas-app/js/widget/wegas-action-min.js',
                        requires: ['plugin']
                    },
                    'wegas-tooltip': {
                        path: 'wegas-app/js/widget/wegas-tooltip-min.js',
                        requires: ["wegas-action", "event-mouseenter", "widget", "widget-stack",
                        "widget-position", 'widget-position-constrain'],
                        ix_provides: 'Button'
                    },
                    'wegas-chat': {
                        path: 'wegas-app/js/widget/wegas-chat-min.js',
                        ix_provides: 'Chat'
                    },
                    'wegas-langselector': {
                        path: 'wegas-app/js/widget/wegas-langselector-min.js',
                        ix_provides: 'LangSelector'
                    },
                    'wegas-layout': {
                        path: 'wegas-app/js/widget/wegas-layout-min.js',
                        requires: ['wegas-widget', 'widget-stdmod', 'event-resize',
                        'anim-easing', 'resize', 'wegas-layoutcss'],
                        ix_provides: 'Layout'
                    },
                    'wegas-layoutcss': {
                        path: 'wegas-app/css/wegas-layout.css',
                        type: 'css'
                    },
                    'wegas-list': {
                        path: 'wegas-app/js/widget/wegas-list-min.js',
                        requires: ['wegas-widget'],
                        ix_provides: 'List'
                    },
                    'wegas-text': {
                        path: 'wegas-app/js/widget/wegas-text-min.js',
                        ix_provides: "Text"
                    },
                    'wegas-tabview': {
                        path: 'wegas-app/js/widget/wegas-tabview-min.js',
                        requires: ['tabview', 'wegas-tabviewcss'],
                        ix_provides: 'TabView'
                    },
                    'wegas-tabviewcss': {
                        path: 'wegas-app/css/wegas-tabview.css',
                        type: "css"
                    },
                    'wegas-variabledisplay': {
                        path: 'wegas-app/js/widget/wegas-variabledisplay-min.js',
                        ix_provides: 'VariableDisplay'
                    },
                    'wegas-gaugedisplay': {
                        path: 'wegas-app/js/widget/wegas-gaugedisplay-min.js',
                        requires: ["gauge"],
                        ix_provides: 'GaugeDisplay'
                    },
                    'wegas-inbox': {
                        path: 'wegas-app/js/widget/wegas-inbox-min.js',
                        requires: ["tabview", 'wegas-tabviewcss', "wegas-inboxcss"],
                        ix_provides: 'InboxDisplay'
                    },
                    'wegas-inboxcss': {
                        path: 'wegas-app/css/wegas-inbox.css',
                        type: 'css'
                    },
                    'wegas-form': {
                        path: 'wegas-app/js/widget/wegas-form-min.js',
                        requires: ['wegas-widget', 'wegas-inputex', 'inputex-string'],
                        ix_provides: "FormWidget"
                    },
                    'wegas-loginwidget': {
                        path: 'wegas-app/js/widget/wegas-loginwidget-min.js',
                        requires: ['wegas-widget', 'inputex-group', 'inputex-password', 'inputex-string',
                        "inputex-hidden", "inputex-email", "inputex-checkbox", 'button'],
                        ix_provides: "LoginWidget"
                    },
                    'wegas-joingamewidget': {
                        path: 'wegas-app/js/widget/wegas-joingamewidget-min.js',
                        requires: ['wegas-widget', "wegas-inputex", 'wegas-button',
                        'wegas-editor-action', 'inputex-select', 'inputex-string'],
                        ix_provides: "JoinGameWidget"
                    },
                    'wegas-imageloader': {
                        path: 'wegas-app/js/widget/wegas-imageloader-min.js',
                        requires: ['io-base', 'imageloader']
                    },
                    'wegas-gallerycss': {
                        path: 'wegas-app/css/wegas-gallery.css',
                        type: 'css'
                    },
                    'wegas-gallery': {
                        path: 'wegas-app/js/widget/wegas-gallery-min.js',
                        requires: ['wegas-widget', 'wegas-imageloader', 'scrollview-base',
                        'scrollview-paginator', 'scrollview-scrollbars', 'wegas-gallerycss',
                        'stylesheet', 'event-resize'],
                        ix_provides: "WegasGallery"
                    },
                    'wegas-itemselector': {
                        path: 'wegas-app/js/widget/wegas-itemselector-min.js',
                        requires: ['wegas-nodeformatter', 'scrollview'],
                        ix_provides: "ItemSelector"
                    },
                    'wegas-nodeformatter': {
                        path: 'wegas-app/js/widget/wegas-nodeformatter-min.js',
                        ix_provides: "NodeFormatter"
                    },
                    /** Inputex Fields **/
                    'wegas-inputex': {
                        path: 'wegas-editor/css/wegas-inputex.css',
                        type: 'css',
                        //path: 'wegas-editor/js/inputex/wegas-inputex-min.js',
                        requires: ['inputex'/*, 'wegas-inputexcss'*/]
                    },
                    'wegas-inputexcss': {
                        path: 'wegas-editor/css/wegas-inputex.css',
                        type: 'css'
                    },
                    'wegas-inputex-rte': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-rte-min.js',
                        requires: ['wegas-inputex', 'inputex-textarea', 'tinymce', 'panel',
                        'wegas-fileexplorer'],
                        ix_provides: 'html'
                    },
                    'wegas-inputex-yui2rte': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-yui2rte-min.js',
                        requires: ['wegas-inputex', 'inputex-field', 'yui2-editor', 'panel',
                        'wegas-fileexplorer', 'wegas-inputex-url'],
                        ix_provides: 'yui2html'
                    },
                    'wegas-inputex-list': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-list-min.js',
                        requires: ['inputex-group'],
                        ix_provides: ['listfield', "editablelist"]
                    },
                    'wegas-inputex-hashlist': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-hashlist-min.js',
                        requires: ['inputex-list'],
                        ix_provides: 'hashlist'
                    },
                    'wegas-inputex-script': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-script-min.js',
                        requires: ['inputex-textarea']
                    //ix_provides: 'script'
                    },
                    'wegas-inputex-wysiwygscript': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-wysiwygscript-min.js',
                        requires: ['wegas-inputex', 'wegas-inputex-script', 'wegas-inputex-list',
                        'wegas-button', 'inputex-hidden', 'inputex-jsonschema', 'inputex-combine',
                        'inputex-select', 'esprima' /*, 'escodegen'*/],
                        ix_provides: ['script',"entityarrayfieldselect"]
                    },
                    'wegas-inputex-url': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-url-min.js',
                        requires: ['inputex-url', 'panel', 'wegas-fileexplorer'],
                        ix_provides: 'wegasurl'
                    },
                    'wegas-inputex-ace': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-ace-min.js',
                        requires: ['inputex-field', 'ace'],
                        ix_provides: "ace"
                    },
                    'wegas-inputex-roleselect': {
                        path: 'wegas-editor/js/inputex/wegas-inputex-roleselect-min.js',
                        requires: ['inputex-select'],
                        ix_provides: 'roleselect'
                    },
                    /** Common Widgets **/
                    'wegas-widgetmenu': {
                        path: 'wegas-app/js/widget/wegas-widgetmenu-min.js',
                        requires: ['plugin', 'yui-later', 'event-mouseenter', 'event-outside',
                        'widget', 'widget-parent', 'widget-child', 'widget-stack',
                        'widget-position', 'widget-position-align', 'widget-position-constrain']
                    },
                    'wegas-widgettoolbar': {
                        path: 'wegas-app/js/widget/wegas-widgettoolbar-min.js',
                        requires: ['wegas-widgettoolbarcss'],
                        ix_provides: 'WidgetToolbar'
                    },
                    'wegas-widgettoolbarcss': {
                        path: 'wegas-app/css/wegas-widgettoolbar.css',
                        type: "css"
                    },
                    'treeview': {
                        path: 'wegas-editor/js/treeview-min.js',
                        requires: ['widget', 'widget-parent', 'widget-child', 'treeviewcss']
                    },
                    'treeviewcss': {
                        path: 'wegas-editor/css/treeview.css',
                        type: 'css'
                    },
                    /** Editor **/
                    'wegas-editor': {
                        path: 'wegas-editor/js/wegas-editor-min.js',
                        requires: ['wegas-app'
                        /*'wegas-editorcss'*/                                   // @fixme There is a bug in css include order, this one got hardcoded in the jsp file
                        ]
                    },
                    'wegas-editorcss': {
                        path: 'wegas-editor/css/wegas-editor.css',
                        type: 'css'
                    },
                    /** Editor's Widgets **/
                    'wegas-editor-action': {
                        path: 'wegas-editor/js/wegas-editor-action-min.js',
                        requires: ['wegas-action', 'inputex-jsonschema', 'wegas-form'],
                        ix_provides: ['NewEntityAction', 'EditEntityAction', "NewEntityButton"]
                    },
                    'wegas-logger': {
                        path: 'wegas-editor/js/wegas-logger-min.js',
                        requires: ['console', 'console-filters'],
                        ix_provides: 'Logger'
                    },
                    'wegas-editor-buttons': {
                        path: 'wegas-editor/js/wegas-editor-buttons-min.js',
                        requires: ['wegas-button', 'wegas-widgetmenu'],
                        ix_provides: ['SelectPlayerButton', 'SelectGameButton']
                    },
                    'wegas-pageeditor': {
                        path: 'wegas-editor/js/wegas-pageeditor-min.js',
                        ix_provides: 'PageEditor',
                        requires: ['diff_match_patch', "wegas-inputex-ace", "ace-json"]
                    },
                    'wegas-csseditor': {
                        path: 'wegas-editor/js/wegas-csseditor-min.js',
                        requires: ['ace-css', 'wegas-inputex-ace'],
                        ix_provides: 'CSSEditor'
                    },
                    'wegas-console': {
                        path: 'wegas-editor/js/wegas-console-min.js',
                        requires: ['ace-javascript', 'wegas-inputex-ace'],
                        ix_provides: 'Console'
                    },
                    'wegas-editor-treeview': {
                        path: 'wegas-editor/js/wegas-editor-treeview-min.js',
                        requires: ['wegas-widget', "treeview", "wegas-widgetmenu"],
                        ix_provides: ['EditorTreeView', "LobbyTreeView"]
                    },
                    'wegas-datatable': {
                        path: 'wegas-editor/js/wegas-datatable-min.js',
                        requires: ['datatable', 'datatable-sort'],
                        ix_provides: 'DataTable'
                    },
                    'wegas-menucss': {
                        path: 'wegas-app/css/wegas-menu.css',
                        type: 'css'
                    },
                    'wegas-menu': {
                        path: 'wegas-app/js/widget/wegas-menu-min.js',
                        requires: ['button', 'wegas-menucss'],
                        ix_provides: 'WegasMenu'
                    },
                    'wegas-scriptlibrary': {
                        path: 'wegas-editor/js/wegas-scriptlibrary-min.js',
                        requires: ['ace-javascript', 'button', 'wegas-inputex-ace', 'inputex-select'],
                        ix_provides: 'ScriptLibrary'
                    },
                    'wegas-fileexplorercss': {
                        path: 'wegas-editor/css/wegas-fileexplorer.css',
                        type: 'css'
                    },
                    'wegas-fileexplorer': {
                        path: 'wegas-editor/js/wegas-fileexplorer-min.js',
                        requires: ['treeview', 'uploader-html5', 'wegas-menu',
                        'wegas-progressbar', 'wegas-fileexplorercss',
                        'wegas-content-entities', 'wegas-tooltip'],
                        ix_provides: "FileExplorer"
                    },
                    'wegas-progressbar': {
                        path: 'wegas-editor/js/wegas-progressbar-min.js',
                        requires: ['widget'],
                        ix_provides: 'ProgressBar'
                    },
                    'wegas-statemachineviewer': {
                        path: 'wegas-editor/js/wegas-statemachineviewer-min.js',
                        requires: ['dd-constrain', 'wegas-datasourcerest',
                        'wegas-statemachineviewercss', 'jsplumb-yui-all', 'button',
                        'wegas-statemachine-entities'],
                        ix_provides: 'StateMachineViewer'
                    },
                    'wegas-statemachineviewercss': {
                        path: 'wegas-editor/css/wegas-statemachineviewer.css'
                    },
                    'wegas-mcqtabview': {
                        path: 'wegas-app/js/widget/wegas-mcqtabview-min.js',
                        requires: ['tabview', 'wegas-tabviewcss'],
                        ix_provides: "MCQTabView"
                    },
                    'wegas-editor-page': {
                        path: 'wegas-editor/js/wegas-editor-page-min.js',
                        requires: ['wegas-datasourcerest'],
                        ix_provides: "PageTreeview"
                    },
                    /** Project Management Game **/
                    'wegas-pmg': {
                        path: 'wegas-pmg/js/wegas-pmg-breadcrumb.js',
                        requires: ['wegas-pmg-breadcrumb'],
                        ix_provides: "PmgBreadcrumb"
                    },
                    'wegas-pmg-tasklist': {//Using simple taskList
                        path: 'wegas-pmg/js/wegas-pmg-tasklist.js',
                        requires: ['wegas-pmg-tasklist', 'wegas-pmg-datatable'],
                        ix_provides: "PmgTasklist"
                    },
                    //                    'wegas-pmg-treebletasklist': { //Using Treeble
                    //                        path: 'wegas-pmg/js/wegas-pmg-treebletasklist.js',
                    //                        requires: ['wegas-pmg-treebletasklist', 'wegas-pmg-datatable'],
                    //                        ix_provides: "PmgTreebleTasklist"
                    //                    },

                    'wegas-pmg-gantt': {
                        path: 'wegas-pmg/js/wegas-pmg-gantt.js',
                        requires: ['wegas-pmg-gantt', 'wegas-pmg-datatable'],
                        ix_provides: "PmgGantt"
                    },
                    'wegas-pmg-resourcelist': {
                        path: 'wegas-pmg/js/wegas-pmg-resourcelist.js',
                        requires: ['wegas-widgetmenu', 'wegas-pmg-gantt', 'dd-constrain', 'dd-proxy', 'dd-drop'],
                        ix_provides: "PmgResourcelist"
                    },
                    'wegas-pmg-datatable': {
                        path: 'wegas-pmg/js/wegas-pmg-datatable.js',
                        /*requires:['wegas-pmg-datatable', 'datatable', 'datatable-mutable', 'datasource-arrayschema', 'gallery-treeble'],*/ //Using Treeble
                        requires: ['wegas-pmg-datatable', 'datatable', 'datatable-mutable'], //Using simple datatable
                        ix_provides: "PmgDatatable"
                    },
                    'wegas-pmg-slidepanel': {
                        path: 'wegas-pmg/js/wegas-pmg-slidepanel.js',
                        ix_provides: "PmgSlidePanel"
                    },
                    /**book CYOA**/
                    'wegas-book': {
                        path: 'wegas-book/js/wegas-book-fight.js',
                        requires: ['wegas-book-fight', 'wegas-book-dice'],
                        ix_provides: "Fight"
                    },
                    'wegas-book-dice': {
                        path: 'wegas-book/js/wegas-book-dice.js',
                        ix_provides: "Dice"
                    },
                    /**CEP**/
                    'wegas-cep': {
                        requires: ['wegas-nodeformatter', 'wegas-itemselector']
                    },
                    /** CrimeSim **/
                    'wegas-crimesim-scheduledisplay': {
                        path: 'wegas-crimesim/js/wegas-crimesim-scheduledisplay-min.js',
                        requires: ['wegas-widget', 'wegas-widgetmenu', 'wegas-crimesim-treeble', 'wegas-gallery'],
                        ix_provides: "ScheduleDisplay"
                    },
                    'wegas-crimesim-resultsdisplay': {
                        path: 'wegas-crimesim/js/wegas-crimesim-resultsdisplay-min.js',
                        requires: ['wegas-widget', 'wegas-crimesim-treeble' ],
                        ix_provides: "ResultsDisplay"
                    },

                    'wegas-crimesim-treeble': {
                        path: 'wegas-crimesim/js/wegas-crimesim-treeble.js',
                        requires: ['datatable', 'datasource-arrayschema', 'gallery-treeble'],
                        ix_provides: "CrimeSimTreeble"
                    },

                    /**Leaderway**/
                    'wegas-leaderway': {
                        path: 'wegas-leaderway/js/wegas-leaderway-hrlist.js',
                        requires: ['wegas-leaderway-folder', 'wegas-leaderway-tasklist',
                        'wegas-leaderway-score', 'wegas-leaderway-dialogue']/*,
                             ix_provides: "HRList"*/
                    },
                    'wegas-leaderway-folder': {
                        path: 'wegas-leaderway/js/wegas-leaderway-folder.js',
                        requires: ['wegas-itemselector'],
                        ix_provides: "LWFolder"
                    },
                    'wegas-leaderway-tasklist': {
                        path: 'wegas-leaderway/js/wegas-leaderway-tasklist.js',
                        requires: ['datatable'],
                        ix_provides: "TaskList"
                    },
                    'wegas-leaderway-score': {
                        path: 'wegas-leaderway/js/wegas-leaderway-score.js',
                        requires: ['datatable'],
                        ix_provides: "Score"
                    },
                    'wegas-leaderway-dialogue': {
                        path: 'wegas-leaderway/js/wegas-leaderway-dialogue.js',
                        requires: ['charts', 'charts-legend'],
                        ix_provides: "Dialogue"
                    },
                    "wegas-leaderway-translator": {
                        path: 'wegas-leaderway/js/wegas-leaderway-translator/wegas-leaderway-translator.js',
                        pkg: 'wegas-leaderway/js/wegas-leaderway-translator',
                        lang: ["en"]
                    },
                    /** MMO **/
                    'wegas-proggame-level': {
                        path: 'wegas-proggame/js/wegas-proggame-level-min.js',
                        requires: ['wegas-widget', 'ace-javascript', 'wegas-inputex-ace'],
                        ix_provides: 'ProgGameLevel'
                    }
                }
            },
            /* Ace */
            ace: {
                base: './lib/ace/',
                root: '/lib/ace/',
                combine: false,
                modules: {
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
                    },
                    'ace-json':{
                        path: 'src/mode-json.js',
                        requires: ['ace']
                    }
                }
            },
            /* jsPlumb */
            jsplumb: {
                combine: true,
                base: './lib/jsPlumb/',
                root: '/lib/jsPlumb/',
                modules: {
                    'jsplumb': {
                        path: 'jsPlumb-1.3.10-RC1.js',
                        requires: ['jsplumb-utils', 'dd']
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
                    'jsplumb-yui-all': {
                        path: 'yui.jsPlumb-1.3.15-all-min.js',
                        requires: ["node", "dd", "anim"/*, "node-event-simulate"*/]
                    },
                    'jsbezier': {
                        path: 'jsBezier-0.3-min.js'
                    }
                }
            },
            /* Other libraries */
            libraries: {
                async: false,
                combine: false,
                base: "./lib/",
                root: "/lib/",
                modules: {
                    'esprima': {
                        path: 'esprima/esprima-min.js'
                    },
                    'escodegen': {
                        path: 'escodegen/escodegen-min.js'
                    },
                    'gauge': {
                        path: "gauge-min.js"
                    },
                    'tinymce': {
                        path: "tiny_mce/tiny_mce.js"
                    },
                    'diff_match_patch': {
                        path: "diffmatchpatch/diff_match_patch.js"
                    },
                    'excanvas': {
                        path: 'excanvas/excanvas.compiled.js'
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
        var i, modules = group.modules,
        moduleName,
        allModules = [],
        modulesByType = {};
        for (moduleName in modules) {                                           // Loop through all modules
            if (modules.hasOwnProperty(moduleName)) {
                allModules.push(moduleName);                                    // Build a list of all modules

                if (modules[moduleName].ix_provides) {                          // Build a reverse index on which module provides what type

                    if (Y.Lang.isArray(modules[moduleName].ix_provides)) {
                        for (i = 0; i < modules[moduleName].ix_provides.length; i = i + 1) {
                            modulesByType[modules[moduleName].ix_provides[i]] = moduleName;
                            YUI_config.groups.inputex.modulesByType[modules[moduleName].ix_provides[i]] = moduleName;
                        }
                    } else {
                        modulesByType[modules[moduleName].ix_provides] = moduleName;
                        YUI_config.groups.inputex.modulesByType[modules[moduleName].ix_provides] = moduleName;
                    }
                }

            }
        }
        group.allModules = allModules;
        group.modulesByType = modulesByType;
    }

    loadModules(YUI_config.groups.wegas);
    loadModules(YUI_config.groups.ace);
    loadModules(YUI_config.groups.libraries);
    loadModules(YUI_config.groups.jsplumb);
});
