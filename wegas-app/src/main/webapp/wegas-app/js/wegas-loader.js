/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * Wegas loader, contains module definitions.
 *
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI().use(function(Y) {
    //"use strict";

    if (typeof YUI_config === 'undefined') {
        YUI_config = {
            groups: {
                inputex: {
                    modulesByType: {}
                }
            }
        };
    }

    Y.mix(YUI_config.groups, {
        wegas: {
            base: './wegas-app/',
            root: '/wegas-app/',
            modules: {
                /**
                 * Base
                 */
                'wegas-app': {
                    requires: [
                        'base', 'plugin', "event-key",
                        'wegas-helper', 'wegas-entity', 'wegas-datasource',
                                // 'wegas-appcss',                              // @fixme There is an i in css include order, this one got hardcoded in the jsp file
                    ]
                },
                'wegas-appcss': {
                    path: 'css/wegas-app-min.css',
                    type: 'css'
                },
                'wegas-helper': {
                    path: 'js/util/wegas-helper-min.js',
                    requires: ['array-extras']
                },
                'wegas-editable': {
                    path: 'js/util/wegas-editable-min.js'
                },
                'wegas-datasource': {
                    path: 'js/util/wegas-datasource-min.js',
                    requires: ['json', 'array-extras', 'io-base',
                        "datasource-io", "datasource-jsonschema"]
                },
                'wegas-scripteval': {
                    path: 'js/plugin/wegas-scripteval-min.js',
                    ws_provides: 'ScriptEval'
                },
                'wegas-websocketlistener': {
                    path: 'js/util/wegas-websocketlistener-min.js',
                    requires: ['wegas-pusher-connector'],
                    ws_provides: "WebSocketListener"
                },
                "wegas-pusher-connector": {
                    path: 'js/util/wegas-pusher-connector-min.js',
                    requires: ['pusher', 'wegas-datasource'],
                    ws_provides: "PusherDataSource"
                },
                "wegas-pdf": {
                    path: 'js/plugin/wegas-pdf-min.js',
                    requires: ['jspdf', 'jspdfPlugin'],
                    ws_provides: 'PDF'
                },
                'event-mouse-startstop': {
                    path: "js/util/event-mouse-startstop-min.js",
                    requires: ["event-base"]
                },
                /**
                 * Persistence
                 */
                'wegas-entity': {
                    path: 'js/persistence/wegas-entity-min.js',
                    requires: ['wegas-editable'],
                    ws_provides: ['Entity', 'GameModel']
                },
                'wegas-statemachine-entities': {
                    path: 'js/persistence/wegas-statemachine-entities-min.js',
                    requires: ['wegas-entity'],
                    ws_provides: ["DialogueDescriptor", "TriggerDescriptor", "FSMDescriptor"]
                },
                'wegas-content-entities': {
                    path: 'js/persistence/wegas-content-entities-min.js',
                    requires: ['wegas-entity']
                },
                'wegas-object-entities': {
                    path: 'js/persistence/wegas-object-entities-min.js',
                    requires: ['wegas-entity'],
                    ws_provides: 'ObjectDescriptor'
                },
                /**
                 * Widgets
                 */
                'wegas-widget': {
                    path: 'js/widget/wegas-widget-min.js',
                    requires: ['widget', 'widget-child', 'widget-parent', 'wegas-editable']
                },
                'wegas-layout': {
                    path: 'js/widget/wegas-layout-min.js',
                    requires: 'wegas-widget'
                },
                'wegas-layout-panel': {
                    path: 'js/widget/wegas-layout-panel-min.js',
                    requires: 'panel',
                    ws_provides: "PanelWidget"
                },
                'wegas-layout-list': {
                    path: 'js/widget/wegas-layout-list-min.js',
                    requires: ['wegas-layout'],
                    ws_provides: 'List'
                },
                'wegas-layout-absolute': {
                    path: 'js/widget/wegas-layout-absolute-min.js',
                    requires: ["wegas-layout-absolutecss", "wegas-cssposition",
                        "wegas-csssize", "wegas-layout"],
                    ws_provides: ['AbsoluteLayout', "Position"]
                },
                'wegas-layout-absolutecss': {
                    path: 'css/wegas-layout-absolute-min.css',
                    type: "css"
                },
                'wegas-layout-choicelist': {
                    path: "js/widget/wegas-layout-choicelist-min.js",
                    requires: ["wegas-layout-list", "wegas-layout-choicelistcss"],
                    ws_provides: "ChoiceList"
                },
                'wegas-layout-choicelistcss': {
                    path: "css/wegas-layout-choicelist-min.css",
                    type: "css"
                },
                'wegas-layout-resizable': {
                    path: 'js/widget/wegas-layout-resizable-min.js',
                    requires: ['wegas-widget', 'widget-stdmod', 'event-resize',
                        'anim-easing', 'resize', 'wegas-layout-resizablecss'],
                    ws_provides: 'ResizableLayout'
                },
                'wegas-layout-resizablecss': {
                    path: 'css/wegas-layout-resizable-min.css',
                    type: 'css'
                },
                'wegas-pageloader': {
                    path: 'js/widget/wegas-pageloader-min.js',
                    ws_provides: 'PageLoader',
                    requires: ["wegas-widget", "timers"]
                },
                'wegas-panel': {
                    path: 'js/util/wegas-panel-min.js',
                    ws_provides: 'Panel',
                    requires: ["wegas-panelcss", "widget-buttons",
                        "widget-modality", "widget-position",
                        "widget-position-align",
                        "widget-stack", "widget-stdmod", "transition"]
                },
                'wegas-panelcss': {
                    path: 'css/wegas-panel-min.css',
                    type: 'css'
                },
                'wegas-popuplistener': {
                    path: 'js/plugin/wegas-popuplistener-min.js',
                    ws_provides: 'PopupListener',
                    requires: ["wegas-panel"]
                },
                'wegas-button': {
                    path: 'js/widget/wegas-button-min.js',
                    requires: ['wegas-widget', 'wegas-action', 'button', 'wegas-tooltip', 'wegas-button-css'],
                    ws_provides: 'Button'
                },
                'wegas-button-css': {
                    path: 'css/wegas-button-min.css',
                    type: 'css'
                },
                'wegas-loginbutton': {
                    path: 'js/widget/wegas-loginbutton-min.js',
                    requires: ['wegas-button', 'wegas-widgetmenu'],
                    ws_provides: 'LoginButton'
                },
                'wegas-chat': {
                    path: 'js/widget/wegas-chat-min.js',
                    requires: ['inputex-field', 'inputex-textarea', 'button'],
                    ws_provides: 'Chat'
                },
                'wegas-chart': {
                    path: 'js/widget/wegas-chart-min.js',
                    requires: ['charts', 'charts-legend'],
                    ws_provides: 'Chart'
                },
                'wegas-langselector': {
                    path: 'js/widget/wegas-langselector-min.js',
                    ws_provides: 'LangSelector'
                },
                'wegas-text': {
                    path: 'js/widget/wegas-text-min.js',
                    ws_provides: "Text",
                    requires: ['wegas-widget']
                },
                'wegas-image': {
                    path: 'js/widget/wegas-image-min.js',
                    ws_provides: "Image"
                },
                'wegas-box': {
                    path: 'js/widget/wegas-box-min.js',
                    ws_provides: "Box",
                    requires: ['wegas-widget']
                },
                'wegas-tabview': {
                    path: 'js/widget/wegas-tabview-min.js',
                    requires: ['tabview', 'wegas-layout', 'wegas-tabviewcss', 'wegas-popuplistener'],
                    ws_provides: 'TabView'
                },
                'wegas-tabviewcss': {
                    path: 'css/wegas-tabview-min.css',
                    type: "css"
                },
                'wegas-variabledisplay': {
                    path: 'js/widget/wegas-variabledisplay-min.js',
                    ws_provides: 'VariableDisplay'
                },
                'wegas-gaugedisplay': {
                    path: 'js/widget/wegas-gaugedisplay-min.js',
                    requires: ["gauge", "wegas-templatecss"],
                    ws_provides: 'GaugeDisplay'
                },
                'wegas-inbox': {
                    path: 'js/widget/wegas-inbox-min.js',
                    requires: ["tabview", "wegas-inboxcss", "wegas-widgettoolbar", "wegas-jstranslator"],
                    ws_provides: 'InboxDisplay'
                },
                'wegas-inboxcss': {
                    path: 'css/wegas-inbox-min.css',
                    type: 'css'
                },
                'wegas-form': {
                    path: 'js/widget/wegas-form-min.js',
                    requires: ['wegas-widget', 'wegas-inputex', 'wegas-widgettoolbar', "wegas-button",
                        'inputex-string', 'inputex-jsonschema', "inputex-group"],
                    ws_provides: "Form"
                },
                form: {
                    path: 'js/util/form-min.js',
                    requires: ['formcss', 'wegas-widget']
                },
                formcss: {
                    path: 'css/form-min.css',
                    type: "css"
                },
                'wegas-imageloader': {
                    path: 'js/util/wegas-imageloader-min.js',
                    requires: ['io-base', 'imageloader']
                },
                'wegas-gallerycss': {
                    path: 'css/wegas-gallery-min.css',
                    type: 'css'
                },
                'wegas-gallery': {
                    path: 'js/widget/wegas-gallery-min.js',
                    requires: ['wegas-widget', 'wegas-imageloader', 'scrollview-base',
                        'scrollview-paginator', 'scrollview-scrollbars', 'wegas-gallerycss',
                        'stylesheet', 'event-resize'],
                    ws_provides: "WegasGallery"
                },
                'wegas-googletranslate': {
                    path: 'js/widget/wegas-googletranslate-min.js',
                    //requires: ["googletranslate"],
                    ws_provides: "GoogleTranslate"
                },
                "wegas-jstranslator": {
                    path: 'js/util/jstranslator/wegas-jstranslator-min.js',
                    pkg: 'js/util/jstranslator',
                    lang: ["fr"]
                },
                /** Plugins **/
                'wegas-userpreferences': {
                    path: 'js/plugin/wegas-userpreferences-min.js',
                    requires: ["wegas-form", "wegas-action"],
                    ws_provides: "UserPreferences"
                },
                'wegas-action': {
                    path: 'js/plugin/wegas-action-min.js'
                },
                'wegas-tooltip': {
                    path: 'js/plugin/wegas-tooltip-min.js',
                    requires: ["wegas-action", "event-mouseenter", "widget", "widget-stack",
                        "widget-position", 'widget-position-constrain'],
                    ws_provides: 'Tooltip'
                },
                'wegas-templatecss': {
                    path: "css/wegas-template-min.css"
                },
                'wegas-template': {
                    path: "js/widget/wegas-template-min.js",
                    requires: ["template", "wegas-templatecss"],
                    ws_provides: "Template"
                },
                'wegas-injector': {
                    path: 'js/plugin/wegas-injector-min.js',
                    ws_provides: "Injector"
                },
                'wegas-widgetmenu': {
                    path: 'js/plugin/wegas-widgetmenu-min.js',
                    requires: ['yui-later', 'event-mouseenter', 'event-outside',
                        'widget', 'widget-parent', 'widget-child', 'widget-stack',
                        'widget-position', 'widget-position-align', 'widget-position-constrain',
                        'wegas-widgetmenucss']
                },
                'wegas-widgetmenucss': {
                    path: 'css/wegas-widgetmenu-min.css',
                    type: "css"
                },
                'wegas-widgettoolbar': {
                    path: 'js/plugin/wegas-widgettoolbar-min.js',
                    requires: ['wegas-widgettoolbarcss'],
                    ws_provides: 'WidgetToolbar'
                },
                'wegas-widgettoolbarcss': {
                    path: 'css/wegas-widgettoolbar-min.css',
                    type: "css"
                },
                "wegas-cssloader": {
                    path: 'js/plugin/wegas-cssloader-min.js',
                    requires: ['stylesheet'],
                    ws_provides: 'CSSLoader'
                },
                'wegas-slideshow': {
                    path: "js/plugin/wegas-slideshow-min.js",
                    requires: ["plugin", "wegas-editable"],
                    ws_provides: "SlideShow"
                },
                "wegas-cssstyles": {
                    path: 'js/plugin/wegas-cssstyles-min.js',
                    ws_provides: 'CSSStyles'
                },
                "wegas-cssstyles-extra": {
                    path: 'js/plugin/wegas-cssstyles-extra-min.js',
                    requires: ['wegas-cssstyles'],
                    ws_provides: ['CSSBackground', 'CSSText', 'CSSPosition', 'CSSSize']
                },
                "wegas-conditionaldisable": {
                    path: 'js/plugin/wegas-conditionaldisable-min.js',
                    ws_provides: 'ConditionalDisable'
                },
                "wegas-blockrightclick": {
                    path: 'js/plugin/wegas-blockrightclick-min.js',
                    ws_provides: 'BlockRightclick'
                },
                "wegas-visibilitytimer": {
                    path: 'js/plugin/wegas-visibilitytimer-min.js',
                    requires: ["wegas-editable", "wegas-action"],
                    ws_provides: ["ShowAfter", "HideAfter"]
                },
                'datatable-csv': {
                    path: 'js/plugin/datatableCSV-min.js',
                    ws_provides: ["DatatableCSV"]
                },
                'wegas-menu': {
                    path: 'js/util/wegas-menu-min.js',
                    requires: ['button', 'wegas-menucss'],
                    ws_provides: 'WegasMenu'
                },
                'wegas-menucss': {
                    path: 'css/wegas-menu-min.css',
                    type: 'css'
                }
            }
        },
        "wegas-editor": {
            base: './wegas-editor/',
            root: '/wegas-editor/',
            modules: {
                /**
                 * Inputex Fields
                 */
                'wegas-inputex': {
                    path: "css/wegas-inputex-min.css",
                    type: 'css',
                    requires: ['inputex']
                },
                "wegas-inputex-object": {
                    path: 'js/inputex/wegas-inputex-object-min.js',
                    requires: ['inputex-object'],
                    ix_provides: 'wegasobject'
                },
                "wegas-inputex-multipleoptions": {
                    path: 'js/inputex/wegas-inputex-multipleoptions-min.js',
                    requires: ['inputex-group'],
                    ix_provides: 'multipleoptions'
                },
                "wegas-inputex-colorpicker": {
                    path: 'js/inputex/wegas-inputex-colorpicker-min.js',
                    requires: ['inputex-field', 'overlay'],
                    ix_provides: 'colorpicker'
                },
                "wegas-inputex-keyvalue": {
                    path: 'js/inputex/wegas-inputex-keyvalue-min.js',
                    requires: ['inputex-keyvalue'],
                    ix_provides: 'wegaskeyvalue'
                },
                'wegas-inputex-rte': {
                    path: 'js/inputex/wegas-inputex-rte-min.js',
                    requires: ['wegas-inputex', 'inputex-textarea', 'tinymce', 'wegas-panel-fileselect'],
                    ix_provides: 'html'
                },
                'wegas-inputex-list': {
                    path: 'js/inputex/wegas-inputex-list-min.js',
                    requires: ['inputex-group', 'wegas-text'],
                    ix_provides: ['listfield', "editablelist", "pluginlist"]
                },
                'wegas-inputex-hashlist': {
                    path: 'js/inputex/wegas-inputex-hashlist-min.js',
                    requires: ['inputex-list'],
                    ix_provides: 'hashlist'
                },
                'wegas-inputex-script': {
                    path: 'js/inputex/wegas-inputex-script-min.js',
                    requires: ['inputex-textarea']
                },
                'wegas-inputex-variabledescriptorselect': {
                    path: 'js/inputex/wegas-inputex-variabledescriptorselect-min.js',
                    requires: ['wegas-inputex', 'inputex-group', 'inputex-combine', 'inputex-number',
                        'inputex-select'],
                    ix_provides: ["entityarrayfieldselect", "variabledescriptorselect"]
                },
                'wegas-inputex-pageloaderselect': {
                    path: 'js/inputex/wegas-inputex-pageloaderselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'pageloaderselect'
                },
                'wegas-inputex-wysiwygscript': {
                    path: 'js/inputex/wegas-inputex-wysiwygscript-min.js',
                    requires: ['wegas-inputex', 'wegas-inputex-list', 'wegas-inputex-script',
                        'wegas-inputex-variabledescriptorselect',
                        'wegas-button', 'inputex-jsonschema', 'inputex-list',
                        'wegas-inputex-url',
                        "wegas-inputex-rte", // for mail attachements in script
                        'esprima'],
                    ix_provides: ['script']
                },
                'wegas-inputex-url': {
                    path: 'js/inputex/wegas-inputex-url-min.js',
                    requires: ['inputex-url', 'wegas-panel-fileselect'],
                    ix_provides: ['wegasurl', 'wegasimageurl']
                },
                'wegas-inputex-ace': {
                    path: 'js/inputex/wegas-inputex-ace-min.js',
                    requires: ['inputex-field', 'ace', 'inputex-textarea', 'wegas-inputex'],
                    ix_provides: "ace"
                },
                'wegas-inputex-markup': {
                    path: 'js/inputex/wegas-inputex-markup-min.js',
                    ix_provides: 'markup'
                },
                'wegas-inputex-pageselect': {
                    path: 'js/inputex/wegas-inputex-pageselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'pageselect'
                },
                'wegas-inputex-variableselect': {
                    path: 'js/inputex/wegas-inputex-variableselect-min.js',
                    requires: ['wegas-inputex', 'inputex-group', 'inputex-textarea',
                        'wegas-inputex-variabledescriptorselect', 'wegas-button',
                        'esprima'],
                    ix_provides: 'variableselect'
                },
                'wegas-inputex-now': {
                    path: 'js/inputex/wegas-inputex-now-min.js',
                    requires: ['wegas-inputex', 'inputex-hidden'],
                    ix_provides: 'now'
                },
                'wegas-inputex-contextgroup': {
                    path: 'js/inputex/wegas-inputex-contextgroup-min.js',
                    requires: ['inputex-group', 'inputex-select'],
                    ix_provides: 'contextgroup'
                },
                /** Treeview **/
                'treeview': {
                    path: 'js/util/treeview-min.js',
                    requires: ['widget', 'widget-parent', 'widget-child', 'treeviewcss']
                },
                'treeviewcss': {
                    path: 'css/treeview-min.css',
                    type: 'css'
                },
                'treeview-filter': {
                    path: 'js/util/treeview-filter-min.js',
                    ws_provides: 'TreeViewFilter'
                },
                'treeview-sortable': {
                    path: 'js/util/treeview-sortable-min.js',
                    requires: ['sortable', 'sortable-scroll'],
                    ws_provides: 'TreeViewSortable'
                },
                'wegas-panel-fileselect': {
                    path: 'js/util/wegas-panel-fileselect-min.js',
                    requires: ['widget', 'panel', 'wegas-fileexplorer'],
                    ws_provides: 'FileSelect'
                },
                /**
                 * Editor
                 */
                'wegas-editorcss': {
                    path: 'css/wegas-editor-min.css',
                    type: 'css'
                },
                'wegas-editor-action': {
                    path: 'js/plugin/wegas-editor-action-min.js',
                    requires: ['wegas-action'],
                    ws_provides: ["OpenTabAction", "Linkwidget"]
                },
                'wegas-editor-entityaction': {
                    path: 'js/plugin/wegas-editor-entityaction-min.js',
                    requires: ['wegas-action', 'inputex-jsonschema', 'wegas-form'],
                    ws_provides: ['NewEntityAction', 'EditEntityAction', "NewEntityButton"]
                },
                'wegas-editentityform': {
                    path: 'js/widget/wegas-editentityform-min.js',
                    //requires: ['wegas-form'],
                    ws_provides: ['EditEntityForm']
                },
                'wegas-editor-widgetaction': {
                    path: 'js/plugin/wegas-editor-widgetaction-min.js',
                    requires: ['wegas-editor-entityaction'],
                    ws_provides: ['EditWidgetAction', '"DeleteWidgetAction']
                },
                'wegas-logger': {
                    path: 'js/widget/wegas-logger-min.js',
                    requires: ['console', 'console-filters'],
                    ws_provides: 'Logger'
                },
                'wegas-editor-buttons': {
                    path: 'js/widget/wegas-editor-buttons-min.js',
                    requires: ['wegas-button', 'wegas-widgetmenu'],
                    ws_provides: ['SelectPlayerButton', 'SelectGameButton']
                },
                'wegas-pageeditorcss': {
                    path: "css/wegas-pageeditor-min.css",
                    type: "css"
                },
                'wegas-pageeditor': {
                    path: 'js/plugin/wegas-pageeditor-min.js',
                    ws_provides: 'PageEditor',
                    requires: ['diff_match_patch', "wegas-editor-widgetaction",
                        "event-mouse-startstop", "node-scroll-info",
                        "wegas-pageeditor-dragdrop", 'wegas-pageeditorcss',
                        'wegas-pageeditor-resize']
                },
                'wegas-preview-fullscreen': {
                    path: 'js/plugin/wegas-preview-fullscreen-min.js',
                    ws_provides: 'PreviewFullScreen'
                },
                'wegas-pageeditor-dragdrop': {
                    path: 'js/util/wegas-pageeditor-dragdrop-min.js',
                    ws_provides: "PageEditorDD",
                    requires: ['dd-constrain', 'dd-scroll', 'wegas-pageeditorcss']
                },
                'wegas-pageeditor-resize': {
                    path: 'js/util/wegas-pageeditor-resize-min.js',
                    ws_provides: "PageEditorResize",
                    requires: ['dd-constrain', 'dd-scroll', 'wegas-pageeditorcss']
                },
                'wegas-console': {
                    path: 'js/widget/wegas-console-min.js',
                    requires: ['wegas-inputex-ace'],
                    ws_provides: 'Console'
                },
                'wegas-console-wysiwyg': {
                    path: 'js/widget/wegas-console-wysiwyg-min.js',
                    requires: ['wegas-console', 'wegas-inputex-wysiwygscript', "inputex-hidden"],
                    ws_provides: 'WysiwygConsole'
                },
                'wegas-editor-treeview': {
                    path: 'js/widget/wegas-editor-treeview-min.js',
                    requires: ['wegas-widget', "treeview", "treeview-filter",
                        "wegas-widgetmenu", 'wegas-editor-treeviewcss'],
                    ws_provides: ['EditorTreeView', "TeamTreeView"]
                },
                'wegas-editor-treeviewcss': {
                    path: 'css/wegas-editor-treeview-min.css',
                    type: "css"
                },
                'wegas-editor-variabletreeview': {
                    path: 'js/widget/wegas-editor-variabletreeview-min.js',
                    requires: ['wegas-editor-treeview', 'treeview-sortable'],
                    ws_provides: 'VariableTreeView'
                },
                'wegas-datatable': {
                    path: 'js/widget/wegas-datatable-min.js',
                    requires: ['datatable', 'datatable-sort'],
                    ws_provides: 'DataTable'
                },
                'wegas-scriptlibrary': {
                    path: 'js/widget/wegas-scriptlibrary-min.js',
                    requires: ['button', 'wegas-inputex-ace', 'inputex-select'],
                    ws_provides: 'ScriptLibrary'
                },
                'wegas-fileexplorercss': {
                    path: 'css/wegas-fileexplorer-min.css',
                    type: 'css'
                },
                'wegas-fileexplorer': {
                    path: 'js/widget/wegas-fileexplorer-min.js',
                    requires: ['treeview', 'uploader-html5', 'wegas-menu',
                        'wegas-progressbar', 'wegas-fileexplorercss',
                        'wegas-content-entities', 'wegas-tooltip', 'treeview-filter'],
                    ws_provides: "FileExplorer"
                },
                'wegas-progressbar': {
                    path: 'js/util/wegas-progressbar-min.js',
                    requires: ['widget'],
                    ws_provides: 'ProgressBar'
                },
                'wegas-statemachineviewer': {
                    path: 'js/widget/wegas-statemachineviewer-min.js',
                    requires: ['dd-constrain', 'wegas-datasource',
                        'wegas-statemachineviewercss', 'jsplumb-yui', 'button',
                        'wegas-statemachine-entities', 'event-mousewheel',
                        'scrollview', 'slider'],
                    ws_provides: 'StateMachineViewer'
                },
                'wegas-statemachineviewercss': {
                    path: 'css/wegas-statemachineviewer-min.css'
                },
                'wegas-editor-pagetreeview': {
                    path: 'js/widget/wegas-editor-pagetreeview-min.js',
                    requires: ['wegas-datasource', "timers"],
                    ws_provides: "PageTreeview"
                },
                'gallery-colorpickercss': {
                    path: 'css/gallery-colorpicker-min.css',
                    type: 'css'
                }
            }
        },
        "wegas-mcq": {
            base: './wegas-mcq/',
            root: '/wegas-mcq/',
            modules: {
                /*
                 * MCQ
                 */
                'wegas-mcq-entities': {
                    requires: ['wegas-entity'],
                    ws_provides: "QuestionDescriptor"
                },
                'wegas-mcq-tabview': {
                    requires: ['tabview', 'wegas-tabviewcss', 'wegas-gallery', "wegas-jstranslator", 'wegas-mcq-tabviewcss'],
                    ws_provides: "MCQTabView"
                },
                'wegas-mcq-tabviewcss': {
                    path: 'css/wegas-mcq-tabview-min.css',
                    type: 'css'
                }}
        },
        "wegas-pmg": {
            base: './wegas-pmg/',
            root: '/wegas-pmg/',
            modules: {
                /**
                 * Project Management Game
                 */
                'wegas-pmgwidget-css': {
                    path: 'css/wegas-pmgwidget-min.css',
                    type: 'css'
                },
                'wegas-pmg-breadcrumb': {
                    ws_provides: "PmgBreadcrumb"
                },
                'wegas-pmg-datatable': {
                    /*requires:['wegas-pmg-datatable', 'datatable', 'datatable-mutable', 'datasource-arrayschema', 'gallery-treeble'],*/ //Using Treeble
                    requires: ['wegas-datatable', 'datatable', 'datatable-mutable', "template"], //Using simple datatable
                    ws_provides: "PmgDatatable"
                },
                'wegas-pmg-slidepanel': {
                    requires: ['anim', 'wegas-pmgwidget-css'],
                    ws_provides: "PmgSlidePanel"
                },
                "wegas-pmg-reservation": {
                    path: 'js/plugin/wegas-pmg-reservation-min.js',
                    ws_provides: 'Reservation'
                },
                "wegas-pmg-occupationcolor": {
                    path: 'js/plugin/wegas-pmg-occupationcolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'OccupationColor'
                },
                "wegas-pmg-activitycolor": {
                    path: 'js/plugin/wegas-pmg-activitycolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'ActivityColor'
                },
                "wegas-pmg-assignment": {
                    path: 'js/plugin/wegas-pmg-assignment-min.js',
                    requires: ['sortable', 'wegas-pmgwidget-css', 'wegas-widgetmenu', 'event-hover'],
                    ws_provides: 'Assignment'
                },
                "wegas-pmg-planification": {
                    path: 'js/plugin/wegas-pmg-planification-min.js',
                    ws_provides: 'Planification'
                },
                "wegas-pmg-plannificationcolor": {
                    path: 'js/plugin/wegas-pmg-plannificationcolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'Plannificationcolor'
                },
                "wegas-pmg-plannificationactivitycolor": {
                    path: 'js/plugin/wegas-pmg-plannificationactivitycolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'PlannificationActivityColor'
                },
                "wegas-pmg-plannificationprogresscolor": {
                    path: 'js/plugin/wegas-pmg-plannificationprogresscolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'PlannificationProgressColor'
                },
                "wegas-pmg-bac": {
                    path: 'js/plugin/wegas-pmg-bac-min.js',
                    ws_provides: 'Bac'
                },
                "wegas-pmg-tablepopup": {
                    path: 'js/plugin/wegas-pmg-tablepopup-min.js',
                    requires: ['wegas-widgetmenu'],
                    ws_provides: 'Tablepopup'
                }
            }
        },
        "wegas-crimesim": {
            base: './wegas-crimesim/',
            root: '/wegas-crimesim/',
            modules: {
                /** CrimeSim **/
                'wegas-crimesim-scheduledisplay': {
                    requires: ['wegas-widget', 'wegas-widgetmenu', 'wegas-crimesim-treeble', 'wegas-gallery', 'wegas-crimesim-translator'],
                    ws_provides: "ScheduleDisplay"
                },
                'wegas-crimesim-resultsdisplay': {
                    requires: ['wegas-widget', 'wegas-crimesim-treeble', 'wegas-crimesim-translator'],
                    ws_provides: "ResultsDisplay"
                },
                'wegas-crimesim-choicesrepliesunreadcount': {
                    requires: ['wegas-button'],
                    ws_provides: "ChoicesRepliesUnreadCount"
                },
                'wegas-crimesim-treeble': {
                    requires: ['datatable', 'datasource-arrayschema', 'gallery-treeble', 'wegas-crimesim-translator'],
                    ws_provides: "CrimeSimTreeble"
                },
                "wegas-crimesim-translator": {
                    path: 'js/wegas-crimesim-translator/wegas-crimesim-translator-min.js',
                    pkg: 'js/wegas-crimesim-translator',
                    lang: ["fr"]
                }
            }
        },
        "wegas-resourcemanagement": {
            base: './wegas-resourcemanagement/',
            root: '/wegas-resourcemanagement/',
            modules: {
                /** Resource Management **/
                'wegas-nodeformatter': {
                    ws_provides: "NodeFormatter"
                },
                'wegas-itemselector': {
                    requires: ['wegas-nodeformatter', 'scrollview', 'wegas-widgetmenu'],
                    ws_provides: "ItemSelector"
                },
                'wegas-resourcemanagement-entities': {
                    requires: ['wegas-entity'],
                    ws_provides: ['ResourceDescriptor', 'TaskDescriptor']
                },
                "wegas-inputex-var-autocomplete": {
                    requires: ['inputex-string'],
                    ix_provides: 'wegasvarautocomplete'
                },
                "wegas-scheduledatatable": {
                    ws_provides: 'ScheduleDT'
                }
            }
        },
        "wegas-leaderway": {
            base: './wegas-leaderway/',
            root: '/wegas-leaderway/',
            modules: {
                /* Leaderway */
                'wegas-leaderway': {
                    requires: ['wegas-leaderway-folder', 'wegas-leaderway-tasklist',
                        'wegas-leaderway-score', 'wegas-leaderway-dialogue', "wegas-injector"]/*,
                         ws_provides: "HRList"*/
                },
                'wegas-leaderway-folder': {
                    requires: ['wegas-itemselector'],
                    ws_provides: "LWFolder"
                },
                'wegas-leaderway-tasklist': {
                    requires: ['datatable'],
                    ws_provides: "TaskList"
                },
                'wegas-leaderway-score': {
                    requires: ['datatable'],
                    ws_provides: "Score"
                },
                'wegas-leaderway-dialogue': {
                    requires: ['charts', 'charts-legend'],
                    ws_provides: "Dialogue"
                },
                "wegas-leaderway-translator": {
                    path: 'js/wegas-leaderway-translator/wegas-leaderway-translator-min.js',
                    pkg: 'js/wegas-leaderway-translator',
                    lang: ["en"]
                }
            }
        },
        "wegas-proggame": {
            base: './wegas-proggame/',
            root: '/wegas-proggame/',
            modules: {
                /** Prog game **/
                'wegas-proggame-level': {
                    requires: ['tabview', "treeview",
                        'wegas-tabview', 'wegas-widget', 'wegas-inputex-ace',
                        'wegas-proggame-display', 'wegas-proggame-jsinstrument'],
                    ws_provides: 'ProgGameLevel'
                },
                'wegas-proggame-display': {
                    requires: ['wegas-widget', 'crafty'],
                    ws_provides: 'ProgGameDisplay'
                },
                'wegas-proggame-inputex': {
                    requires: ['wegas-inputex', "inputex-list"],
                    ix_provides: ['proggametile', "proggamemap"]
                },
                'wegas-proggame-objective': {
                    requires: "treeview",
                    ws_provides: ["Objective", "TreeViewWidget"]
                },
                'wegas-proggame-jsinstrument': {
                    requires: ["esprima", "escodegen"]
                },
                'wegas-popup': {
                    ws_provides: ["Popup"]
                },
                'wegas-proggame-scriptfiles': {
                    requires: "wegas-panel",
                    ws_provides: "ScriptFiles"
                }
            }
        },
        /**
         * Flexitests
         */
        "wegas-flexitests": {
            base: './wegas-flexitests/',
            root: '/wegas-flexitests/',
            modules: {
                'wegas-flexitests-controller': {
                    requires: ["wegas-layout-absolute", "timers"],
                    ws_provides: ["FlexitestsController", "FlexiResponse"]
                },
                'wegas-flexitests-mcqdisplay': {
                    requires: ["wegas-widget", "template"],
                    ws_provides: "FlexitestsMCQ"
                },
                'wegas-flexitests-results': {
                    requires: ["wegas-widget", "datatable", "datatable-csv"],
                    ws_provides: "FlexitestsResults"
                },
                'wegas-addimages-action': {
                    requires: ["wegas-action", "wegas-panel-fileselect"],
                    ws_provides: "AddImagesWidgetAction"
                }
            }
        },
        /* Teaching */
        "wegas-teaching": {
            base: './wegas-teaching/',
            root: '/wegas-teaching/',
            modules: {
                'wegas-teaching-arrow': {
                    requires: "graphics"
                },
                'wegas-teaching-rectangle': {},
                'wegas-teaching-main': {
                    ws_provides: "TeachingMain",
                    requires: ["panel", "editor", "gallery-itsatoolbar",
                        "autocomplete", "autocomplete-highlighters", "autocomplete-filters",
                        "dd-plugin", 'dd-drop', 'dd-proxy', 'dd-constrain', "button-group",
                        "wegas-teaching-arrow", "wegas-teaching-rectangle"]
                },
            }
        },
        /* Lobby */
        "wegas-lobby": {
            base: './wegas-lobby/',
            root: '/wegas-lobby/',
            modules: {
                'wegas-inputex-permissionselect': {
                    requires: ['inputex-list', 'inputex-field', "inputex-checkbox", "wegas-inputex-roleselect"],
                    ws_provides: 'RolePermissionList'
                },
                'wegas-inputex-gamemodelselect': {
                    requires: ['inputex-select', 'inputex-list', "inputex-uneditable"],
                    ix_provides: ['gamemodelselect', "enrolementkeylist"]
                },
                'wegas-inputex-roleselect': {
                    requires: ['inputex-select'],
                    ix_provides: 'roleselect'
                },
                'wegas-join': {
                    requires: ['wegas-widget', "wegas-inputex", 'wegas-button',
                        'wegas-editor-action', "wegas-inputex-multipleoptions",
                        'inputex-select', 'inputex-string', "inputex-list", "inputex-hidden",
                        "inputex-autocomplete", "inputex-password", "inputex-email"],
                    ws_provides: ["JoinTeam", "GameDescription"]
                },
                'wegas-join-token': {
                    requires: ['wegas-join'],
                    ws_provides: "TokenJoin"
                },
                'wegas-loginwidget': {
                    requires: ['wegas-widget', 'inputex-group', 'inputex-password', 'inputex-string',
                        "inputex-hidden", "inputex-email", "inputex-checkbox", 'button', 'wegas-logincss'],
                    ws_provides: "LoginWidget"
                },
                'wegas-logincss': {
                    path: 'css/wegas-login-min.css',
                    type: 'css'
                },
                'wegas-sharerole': {
                    requires: ['inputex-select', 'inputex-list', "inputex-checkbox"],
                    ws_provides: ["ShareRole", "TeamsList"]
                },
                'wegas-shareuser': {
                    requires: ['inputex-list', "inputex-checkbox", "inputex-autocomplete", 'autocomplete-highlighters',
                        'inputex-hidden', 'wegas-inputex-markup'],
                    ws_provides: "ShareUser"
                },
                'wegas-lobby-datatable': {
                    requires: ['datatable'],
                    ws_provides: "GameDataTable"
                }
            }
        },
        "wegas-others": {
            base: './',
            root: '/',
            modules: {
                /**book CYOA**/
                'wegas-book': {
                    path: 'wegas-book/js/wegas-book-fight-min.js',
                    requires: ['wegas-book-fight', 'wegas-book-dice'],
                    ws_provides: "Fight"
                },
                'wegas-book-dice': {
                    path: 'wegas-book/js/wegas-book-dice-min.js',
                    ws_provides: "Dice"
                },
                /**monopoly**/
                'wegas-monopoly-controller': {
                    path: 'wegas-monopoly/js/wegas-monopoly-controller-min.js',
                    requires: ['wegas-monopoly-controller', 'wegas-book-dice', 'wegas-button'],
                    ws_provides: "MonopolyController"
                },
                'wegas-monopoly-display': {
                    path: 'wegas-monopoly/js/wegas-monopoly-display-min.js',
                    requires: ['wegas-monopoly-display'],
                    ws_provides: "Monopolydisplay"
                },
                /**CEP**/
                'wegas-cep-folder': {
                    path: 'wegas-cep/js/wegas-cep-folder-min.js',
                    requires: ['wegas-nodeformatter', 'wegas-itemselector', "wegas-injector"],
                    ws_provides: 'CEPFolder'
                },
                /* SimpleDialogue */
                'wegas-simpledialogue': {
                    path: "wegas-simpledialogue/js/wegas-simpledialogue-main.js",
                    ws_provides: "SimpleDialogueMain"
                }
                /* Chess */
                //'wegas-chess': {
                //    path: "wegas-chess/js/wegas-chess-min.js",
                //    ws_provides: "ChessBoard",
                //    requires: ["transition"]
                //}
            }
        },
        /* Other libraries */
        "wegas-libraries": {
            base: "./lib/",
            root: "/lib/",
            modules: {
                gauge: {
                    path: "gauge-min.js"
                },
                diff_match_patch: {
                    path: "diffmatchpatch/diff_match_patch.js"
                }
            }
        },
        /* Other libraries (that should not be combined) */
        "libraries": {
            async: false,
            combine: false,
            base: "./lib/",
            root: "/lib/",
            modules: {
                'jsplumb-yui': {
                    path: 'jsPlumb/yui.jsPlumb-1.5.4.js'
                },
                esprima: {
                    path: 'esprima/esprima-min.js'
                },
                escodegen: {
                    path: 'escodegen/escodegen-min.js'
                },
                tinymce: {
                    path: "tinymce/tinymce.min.js"
                },
                excanvas: {
                    path: 'excanvas/excanvas.compiled.js'
                },
                crafty: {
                    path: 'crafty/0.5.3/crafty-min.js'
                },
                ace: {
                    async: false,
                    path: "ace/src-min/ace.js"
                            //fullpath: "http://rawgithub.com/ajaxorg/ace-builds/master/src-min-noconflict/ace.js"
                },
                pusher: {
                    fullpath: "http://js.pusher.com/1.12/pusher.min.js"
                },
                googletranslate: {
                    async: false,
                    fullpath: "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
                            //fullpath: "//translate.google.com/translate_a/element.js?ug=section&hl=en&cb=googleSectionalElementInit&hl=en"
                }
            }
        }
    });
    function loadModules(group) {
        var i, modules = group.modules,
                module, type,
                moduleName,
                allModules = [];
        for (moduleName in modules) {                                           // Loop through all modules
            if (modules.hasOwnProperty(moduleName)) {
                allModules.push(moduleName); // Build a list of all modules

                module = modules[moduleName];
                type = module.type || "js";
                module.path = module.path || type + "/" + moduleName + "-min." + type;

                if (module.ws_provides) {                                       // Build a reverse index on which module provides what type (Wegas)
                    if (Y.Lang.isArray(module.ws_provides)) {
                        for (i = 0; i < module.ws_provides.length; i = i + 1) {
                            YUI_config.groups.wegas.modulesByType[module.ws_provides[i]] = moduleName;
                        }
                    } else {
                        YUI_config.groups.wegas.modulesByType[module.ws_provides] = moduleName;
                    }
                }
                if (module.ix_provides) {                                       // Build a reverse index on which module provides what type (inputEx)
                    if (Y.Lang.isArray(module.ix_provides)) {
                        for (i = 0; i < module.ix_provides.length; i = i + 1) {
                            YUI_config.groups.inputex.modulesByType[module.ix_provides[i]] = moduleName;
                        }
                    } else {
                        YUI_config.groups.inputex.modulesByType[module.ix_provides] = moduleName;
                    }
                }

            }
        }
        group.allModules = allModules;
    }
    YUI_config.groups.wegas.modulesByType = {};

    for (var i in YUI_config.groups) {
        if (i.indexOf("wegas") > -1) {
            loadModules(YUI_config.groups[i]);
        }
    }
});
