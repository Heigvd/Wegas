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
            base: './',
            root: '/',
            modules: {
                /**
                 * Base
                 */
                'wegas-app': {
                    path: 'wegas-app/js/wegas-app-min.js',
                    requires: [
                        'wegas-helper', 'wegas-entity', 'wegas-datasource',
                        'wegas-pageloader', 'wegas-button',
                        "event-key"
                                // 'wegas-appcss',                              // @fixme There is an i in css include order, this one got hardcoded in the jsp file
                    ]
                },
                'wegas-appcss': {
                    path: 'wegas-app/css/wegas-app-min.css',
                    type: 'css'
                },
                'wegas-helper': {
                    path: 'wegas-app/js/util/wegas-helper-min.js',
                    requires: ['array-extras', 'base']
                },
                'wegas-editable': {
                    path: 'wegas-app/js/util/wegas-editable-min.js',
                    requires: ['base', 'json']
                },
                'wegas-datasource': {
                    path: 'wegas-app/js/util/wegas-datasource-min.js',
                    requires: ['plugin', 'json', 'array-extras', 'io-base',
                        "datasource-io", "datasource-jsonschema", /*"datasource-cache",*/
                        "wegas-widget"]
                },
                'wegas-scripteval': {
                    path: 'wegas-app/js/plugin/wegas-scripteval-min.js',
                    requires: ['plugin'],
                    ws_provides: ['ScriptEval']
                },
                'wegas-websocketlistener': {
                    path: 'wegas-app/js/util/wegas-websocketlistener-min.js',
                    requires: ['plugin', 'wegas-pusher-connector'],
                    ws_provides: "WebSocketListener"
                },
                "wegas-pusher-connector": {
                    path: 'wegas-app/js/util/wegas-pusher-connector-min.js',
                    requires: ['pusher', 'wegas-datasource'],
                    ws_provides: "PusherDataSource"
                },
                "wegas-pdf": {
                    path: 'wegas-app/js/plugin/wegas-pdf-min.js',
                    requires: ['jspdf', 'jspdfPlugin', 'plugin'],
                    ws_provides: 'PDF'
                },
                'event-mouse-startstop': {
                    path: "wegas-app/js/util/event-mouse-startstop-min.js",
                    requires: ["event-base"]
                },
                /**
                 * Persistence
                 */
                'wegas-entity': {
                    path: 'wegas-app/js/persistence/wegas-entity-min.js',
                    requires: ['wegas-editable'],
                    ws_provides: ['Entity', 'GameModel']
                },
                'wegas-statemachine-entities': {
                    path: 'wegas-app/js/persistence/wegas-statemachine-entities-min.js',
                    requires: ['wegas-entity'],
                    ws_provides: ["DialogueDescriptor", "TriggerDescriptor", "FSMDescriptor"]
                },
                'wegas-mcq-entities': {
                    path: 'wegas-mcq/js/wegas-mcq-entities-min.js',
                    requires: ['wegas-entity'],
                    ws_provides: "QuestionDescriptor"
                },
                'wegas-content-entities': {
                    path: 'wegas-app/js/persistence/wegas-content-entities-min.js',
                    requires: ['wegas-entity']
                },
                'wegas-object-entities': {
                    path: 'wegas-app/js/persistence/wegas-object-entities-min.js',
                    requires: ['wegas-entity'],
                    ws_provides: 'ObjectDescriptor'
                },
                /**
                 * Widgets
                 */
                'wegas-widget': {
                    path: 'wegas-app/js/widget/wegas-widget-min.js',
                    requires: ['widget', 'widget-child', 'widget-parent', 'wegas-editable']
                },
                'wegas-layout': {
                    path: 'wegas-app/js/widget/wegas-layout-min.js',
                    requires: ['wegas-widget', 'widget-parent']
                },
                'wegas-layout-list': {
                    path: 'wegas-app/js/widget/wegas-layout-list-min.js',
                    requires: ['wegas-layout'],
                    ws_provides: 'List'
                },
                'wegas-layout-absolute': {
                    path: 'wegas-app/js/widget/wegas-layout-absolute-min.js',
                    requires: ["wegas-layout-absolutecss", "wegas-cssposition",
                        "wegas-csssize", "wegas-layout"],
                    ws_provides: ['AbsoluteLayout', "Position"]
                },
                'wegas-layout-absolutecss': {
                    path: 'wegas-app/css/wegas-layout-absolute-min.css'
                },
                'wegas-layout-choicelist': {
                    path: "wegas-app/js/widget/wegas-layout-choicelist-min.js",
                    requires: ["wegas-layout-list", "wegas-layout-choicelistcss"],
                    ws_provides: "ChoiceList"
                },
                'wegas-layout-choicelistcss': {
                    path: "wegas-app/css/wegas-layout-choicelist-min.css"
                },
                'wegas-layout-resizable': {
                    path: 'wegas-app/js/widget/wegas-layout-resizable-min.js',
                    requires: ['wegas-widget', 'widget-stdmod', 'event-resize',
                        'anim-easing', 'resize', 'wegas-layout-resizablecss'],
                    ws_provides: 'ResizableLayout'
                },
                'wegas-layout-resizablecss': {
                    path: 'wegas-app/css/wegas-layout-resizable.css',
                    type: 'css'
                },
                'wegas-pageloader': {
                    path: 'wegas-app/js/widget/wegas-pageloader-min.js',
                    ws_provides: 'PageLoader',
                    requires: ["wegas-widget", "timers"]
                },
                'wegas-panel': {
                    path: 'wegas-app/js/util/wegas-panel-min.js',
                    ws_provides: 'Panel',
                    requires: ["wegas-panelcss", "widget-buttons",
                        "widget-modality", "widget-position",
                        "widget-position-align",
                        "widget-stack", "widget-stdmod", "transition"]
                },
                'wegas-panelcss': {
                    path: 'wegas-app/css/wegas-panel-min.css',
                    type: 'css'
                },
                'wegas-popuplistener': {
                    path: 'wegas-app/js/plugin/wegas-popuplistener-min.js',
                    ws_provides: 'PopupListener',
                    requires: ["wegas-panel"]
                },
                'wegas-button': {
                    path: 'wegas-app/js/widget/wegas-button-min.js',
                    requires: ['wegas-widget', 'wegas-action', 'button', 'wegas-button-css'],
                    ws_provides: 'Button'
                },
                'wegas-button-css': {
                    path: 'wegas-app/css/wegas-button-min.css',
                    type: 'css'
                },
                'wegas-loginbutton': {
                    path: 'wegas-app/js/widget/wegas-loginbutton-min.js',
                    requires: ['wegas-button', 'wegas-widgetmenu'],
                    ws_provides: 'LoginButton'
                },
                'wegas-chat': {
                    path: 'wegas-app/js/widget/wegas-chat-min.js',
                    requires: ['inputex-field', 'inputex-textarea', 'button'],
                    ws_provides: 'Chat'
                },
                'wegas-chart': {
                    path: 'wegas-app/js/widget/wegas-chart-min.js',
                    requires: ['charts', 'charts-legend'],
                    ws_provides: 'Chart'
                },
                'wegas-langselector': {
                    path: 'wegas-app/js/widget/wegas-langselector-min.js',
                    ws_provides: 'LangSelector'
                },
                'wegas-text': {
                    path: 'wegas-app/js/widget/wegas-text-min.js',
                    ws_provides: "Text",
                    requires: ['wegas-widget']
                },
                'wegas-image': {
                    path: 'wegas-app/js/widget/wegas-image-min.js',
                    ws_provides: "Image"
                },
                'wegas-box': {
                    path: 'wegas-app/js/widget/wegas-box-min.js',
                    ws_provides: "Box",
                    requires: ['wegas-widget']
                },
                'wegas-tabview': {
                    path: 'wegas-app/js/widget/wegas-tabview-min.js',
                    requires: ['tabview', 'wegas-tabviewcss', 'wegas-popuplistener'],
                    ws_provides: 'TabView'
                },
                'wegas-tabviewcss': {
                    path: 'wegas-app/css/wegas-tabview-min.css',
                    type: "css"
                },
                'wegas-variabledisplay': {
                    path: 'wegas-app/js/widget/wegas-variabledisplay-min.js',
                    ws_provides: 'VariableDisplay'
                },
                'wegas-gaugedisplay': {
                    path: 'wegas-app/js/widget/wegas-gaugedisplay-min.js',
                    requires: ["gauge", "wegas-templatecss"],
                    ws_provides: 'GaugeDisplay'
                },
                'wegas-inbox': {
                    path: 'wegas-app/js/widget/wegas-inbox-min.js',
                    requires: ["tabview", "wegas-inboxcss", "wegas-widgettoolbar", "wegas-jstranslator"],
                    ws_provides: 'InboxDisplay'
                },
                'wegas-inboxcss': {
                    path: 'wegas-app/css/wegas-inbox-min.css',
                    type: 'css'
                },
                'wegas-form': {
                    path: 'wegas-app/js/widget/wegas-form-min.js',
                    requires: ['wegas-widget', 'wegas-inputex',
                        'inputex-string', 'inputex-jsonschema', "inputex-group",
                        'wegas-widgettoolbar', "wegas-button", "inputex-checkbox"],
                    ws_provides: "Form"
                },
                form: {
                    path: 'wegas-app/js/util/form-min.js',
                    requires: ['widget', 'widget-parent', 'widget-child', 'formcss', 'wegas-widget']
                },
                formcss: {
                    path: 'wegas-app/css/form-min.css',
                    type: "css"
                },
                'wegas-layout-widget': {
                    path: 'wegas-app/js/widget/wegas-layout-panel-min.js',
                    requires: ['panel'],
                    ws_provides: "PanelWidget"
                },
                'wegas-imageloader': {
                    path: 'wegas-app/js/util/wegas-imageloader-min.js',
                    requires: ['io-base', 'imageloader']
                },
                'wegas-gallerycss': {
                    path: 'wegas-app/css/wegas-gallery-min.css',
                    type: 'css'
                },
                'wegas-gallery': {
                    path: 'wegas-app/js/widget/wegas-gallery-min.js',
                    requires: ['wegas-widget', 'wegas-imageloader', 'scrollview-base',
                        'scrollview-paginator', 'scrollview-scrollbars', 'wegas-gallerycss',
                        'stylesheet', 'event-resize'],
                    ws_provides: "WegasGallery"
                },
                'wegas-googletranslate': {
                    path: 'wegas-app/js/widget/wegas-googletranslate-min.js',
                    //requires: ["googletranslate"],
                    ws_provides: "GoogleTranslate"
                },
                "wegas-jstranslator": {
                    path: 'wegas-app/js/util/jstranslator/wegas-jstranslator-min.js',
                    pkg: 'wegas-app/js/util/jstranslator',
                    lang: ["fr"]
                },
                /** Plugins **/
                'wegas-userpreferences': {
                    path: 'wegas-app/js/plugin/wegas-userpreferences-min.js',
                    requires: ["wegas-form", "wegas-action"],
                    ws_provides: "UserPreferences"
                },
                'wegas-action': {
                    path: 'wegas-app/js/plugin/wegas-action-min.js',
                    requires: ['plugin']
                },
                'wegas-popup': {
                    path: 'wegas-app/js/plugin/wegas-popup-min.js',
                    ws_provides: ["Popup"]
                },
                'wegas-tooltip': {
                    path: 'wegas-app/js/plugin/wegas-tooltip-min.js',
                    requires: ["wegas-action", "event-mouseenter", "widget", "widget-stack",
                        "widget-position", 'widget-position-constrain'],
                    ws_provides: 'Tooltip'
                },
                'wegas-templatecss': {
                    path: "wegas-app/css/wegas-template-min.css"
                },
                'wegas-template': {
                    path: "wegas-app/js/widget/wegas-template-min.js",
                    requires: ["template", "wegas-templatecss"],
                    ws_provides: "Template"
                },
                'wegas-injector': {
                    path: 'wegas-app/js/plugin/wegas-injector-min.js',
                    ws_provides: "Injector"
                },
                'wegas-widgetmenu': {
                    path: 'wegas-app/js/plugin/wegas-widgetmenu-min.js',
                    requires: ['plugin', 'yui-later', 'event-mouseenter', 'event-outside',
                        'widget', 'widget-parent', 'widget-child', 'widget-stack',
                        'widget-position', 'widget-position-align', 'widget-position-constrain',
                        'wegas-widgetmenucss']
                },
                'wegas-widgetmenucss': {
                    path: 'wegas-app/css/wegas-widgetmenu-min.css',
                    type: "css"
                },
                'wegas-widgettoolbar': {
                    path: 'wegas-app/js/plugin/wegas-widgettoolbar-min.js',
                    requires: ['wegas-widgettoolbarcss'],
                    ws_provides: 'WidgetToolbar'
                },
                'wegas-widgettoolbarcss': {
                    path: 'wegas-app/css/wegas-widgettoolbar-min.css',
                    type: "css"
                },
                "wegas-cssloader": {
                    path: 'wegas-app/js/plugin/wegas-cssloader-min.js',
                    requires: ['stylesheet'],
                    ws_provides: 'CSSLoader'
                },
                'wegas-slideshow': {
                    path: "wegas-app/js/plugin/wegas-slideshow-min.js",
                    requires: ["plugin", "wegas-editable"],
                    ws_provides: "SlideShow"
                },
                "wegas-cssstyles": {
                    path: 'wegas-app/js/plugin/wegas-cssstyles-min.js',
                    ws_provides: 'CSSStyles'
                },
                "wegas-cssstyles-extra": {
                    path: 'wegas-app/js/plugin/wegas-cssstyles-extra-min.js',
                    requires: ['wegas-cssstyles'],
                    ws_provides: ['CSSBackground', 'CSSText', 'CSSPosition', 'CSSSize']
                },
                "wegas-scheduledatatable": {
                    path: 'wegas-app/js/plugin/wegas-scheduledatatable-min.js',
                    ws_provides: 'ScheduleDT'
                },
                "wegas-conditionaldisable": {
                    path: 'wegas-app/js/plugin/wegas-conditionaldisable-min.js',
                    ws_provides: 'ConditionalDisable'
                },
                "wegas-blockrightclick": {
                    path: 'wegas-app/js/plugin/wegas-blockrightclick-min.js',
                    ws_provides: 'BlockRightclick'
                },
                "wegas-visibilitytimer": {
                    path: 'wegas-app/js/plugin/wegas-visibilitytimer-min.js',
                    requires: ["wegas-editable", "plugin", "wegas-action"],
                    ws_provides: ["ShowAfter", "HideAfter"]
                },
                'datatable-csv': {
                    path: 'wegas-app/js/plugin/datatableCSV-min.js',
                    requires: ["plugin"],
                    ws_provides: ["DatatableCSV"]
                },
                /**
                 * Inputex Fields
                 */
                'wegas-inputex': {
                    path: 'wegas-editor/css/wegas-inputex-min.css',
                    type: 'css',
                    //path: 'wegas-editor/js/inputex/wegas-inputex-min.js',
                    requires: ['inputex'/*, 'wegas-inputexcss'*/]
                },
                'wegas-inputexcss': {
                    path: 'wegas-editor/css/wegas-inputex-min.css',
                    type: 'css'
                },
                "wegas-inputex-object": {
                    path: 'wegas-editor/js/inputex/wegas-inputex-object-min.js',
                    requires: ['inputex-object'],
                    ix_provides: 'wegasobject'
                },
                "wegas-inputex-colorpicker": {
                    path: 'wegas-editor/js/inputex/wegas-inputex-colorpicker-min.js',
                    requires: ['inputex-field', 'overlay'],
                    ix_provides: 'colorpicker'
                },
                "wegas-inputex-keyvalue": {
                    path: 'wegas-editor/js/inputex/wegas-inputex-keyvalue-min.js',
                    requires: ['inputex-keyvalue'],
                    ix_provides: 'wegaskeyvalue'
                },
                'wegas-inputex-rte': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-rte-min.js',
                    requires: ['wegas-inputex', 'inputex-textarea', 'tinymce', 'panel',
                        'wegas-fileexplorer'],
                    ix_provides: 'html'
                },
                'wegas-inputex-list': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-list-min.js',
                    requires: ['inputex-group', 'wegas-text'],
                    ix_provides: ['listfield', "editablelist", "pluginlist"]
                },
                'wegas-inputex-hashlist': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-hashlist-min.js',
                    requires: ['inputex-list'],
                    ix_provides: 'hashlist'
                },
                'wegas-inputex-script': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-script-min.js',
                    requires: ['inputex-textarea']
                },
                'wegas-inputex-variabledescriptorselect': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-variabledescriptorselect-min.js',
                    requires: ['wegas-inputex', 'inputex-group', 'inputex-combine', 'inputex-number',
                        'inputex-select'],
                    ix_provides: ["entityarrayfieldselect", "variabledescriptorselect"]
                },
                'wegas-inputex-pageloaderselect': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-pageloaderselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'pageloaderselect'
                },
                'wegas-inputex-wysiwygscript': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-wysiwygscript-min.js',
                    requires: ['wegas-inputex', 'wegas-inputex-list', 'wegas-inputex-script',
                        'wegas-inputex-variabledescriptorselect',
                        'wegas-button', 'inputex-jsonschema', 'inputex-list',
                        'wegas-inputex-url',
                        "wegas-inputex-rte", // for mail attachements in script
                        'esprima'],
                    ix_provides: ['script']
                },
                'wegas-inputex-url': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-url-min.js',
                    requires: ['inputex-url', 'panel', 'wegas-fileexplorer'],
                    ix_provides: ['wegasurl', 'wegasimageurl']
                },
                'wegas-inputex-ace': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-ace-min.js',
                    requires: ['inputex-field', 'ace', 'inputex-textarea', 'wegas-inputex'],
                    ix_provides: "ace"
                },
                'wegas-inputex-markup': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-markup-min.js',
                    ix_provides: 'markup'
                },
                'wegas-inputex-pageselect': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-pageselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'pageselect'
                },
                'wegas-inputex-variableselect': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-variableselect-min.js',
                    requires: ['wegas-inputex', 'inputex-group', 'inputex-textarea',
                        'wegas-inputex-variabledescriptorselect', 'wegas-button',
                        'esprima'],
                    ix_provides: 'variableselect'
                },
                'wegas-inputex-now': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-now-min.js',
                    requires: ['wegas-inputex', 'inputex-hidden'],
                    ix_provides: 'now'
                },
                /** Treeview **/
                'treeview': {
                    path: 'wegas-editor/js/util/treeview-min.js',
                    requires: ['widget', 'widget-parent', 'widget-child', 'treeviewcss']
                },
                'treeviewcss': {
                    path: 'wegas-editor/css/treeview-min.css',
                    type: 'css'
                },
                'treeview-filter': {
                    path: 'wegas-editor/js/util/treeview-filter-min.js',
                    requires: ['plugin'],
                    ws_provides: 'TreeViewFilter'
                },
                'treeview-sortable': {
                    path: 'wegas-editor/js/util/treeview-sortable-min.js',
                    requires: ['plugin', 'sortable', 'sortable-scroll'],
                    ws_provides: 'TreeViewSortable'
                },
                /* Lobby */
                'wegas-inputex-permissionselect': {
                    path: 'wegas-lobby/js/wegas-inputex-permissionselect-min.js',
                    requires: ['inputex-list', 'inputex-field', "inputex-checkbox", "wegas-inputex-roleselect"],
                    ws_provides: 'RolePermissionList'
                },
                'wegas-inputex-gamemodelselect': {
                    path: 'wegas-lobby/js/wegas-inputex-gamemodelselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'gamemodelselect'
                },
                'wegas-inputex-roleselect': {
                    path: 'wegas-lobby/js/wegas-inputex-roleselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'roleselect'
                },
                'wegas-jointeam': {
                    path: 'wegas-lobby/js/wegas-jointeam-min.js',
                    requires: ['wegas-widget', "wegas-inputex", 'wegas-button',
                        'wegas-editor-action', 'inputex-select', 'inputex-string'],
                    ws_provides: "JoinTeam"
                },
                'wegas-joingame': {
                    path: 'wegas-lobby/js/wegas-joingame-min.js',
                    requires: ['wegas-jointeam'],
                    ws_provides: "JoinGame"
                },
                'wegas-loginwidget': {
                    path: 'wegas-lobby/js/wegas-loginwidget-min.js',
                    requires: ['wegas-widget', 'inputex-group', 'inputex-password', 'inputex-string',
                        "inputex-hidden", "inputex-email", "inputex-checkbox", 'button', 'wegas-logincss'],
                    ws_provides: "LoginWidget"
                },
                'wegas-logincss': {
                    path: 'wegas-lobby/css/wegas-login-min.css',
                    type: 'css'
                },
                'wegas-sharerole': {
                    path: 'wegas-lobby/js/widget/wegas-sharerole-min.js',
                    requires: ['inputex-select', 'inputex-list', "inputex-checkbox"],
                    ws_provides: "ShareRole"
                },
                'wegas-shareuser': {
                    path: 'wegas-lobby/js/wegas-shareuser-min.js',
                    requires: ['inputex-list', "inputex-checkbox", "inputex-autocomplete", 'autocomplete-highlighters',
                        'inputex-hidden', 'wegas-inputex-markup'],
                    ws_provides: "ShareUser"
                },
                /**
                 * Editor
                 */
                'wegas-editorcss': {
                    path: 'wegas-editor/css/wegas-editor-min.css',
                    type: 'css'
                },
                'wegas-editor-action': {
                    path: 'wegas-editor/js/plugin/wegas-editor-action-min.js',
                    requires: ['wegas-action'],
                    ws_provides: ["OpenTabAction", "Linkwidget"]
                },
                'wegas-editor-entityaction': {
                    path: 'wegas-editor/js/plugin/wegas-editor-entityaction-min.js',
                    requires: ['wegas-action', 'inputex-jsonschema', 'wegas-form'],
                    ws_provides: ['NewEntityAction', 'EditEntityAction', "NewEntityButton"]
                },
                'wegas-editor-widgetaction': {
                    path: 'wegas-editor/js/plugin/wegas-editor-widgetaction-min.js',
                    requires: ['wegas-editor-entityaction'],
                    ws_provides: ['EditWidgetAction', '"DeleteWidgetAction']
                },
                'wegas-logger': {
                    path: 'wegas-editor/js/widget/wegas-logger-min.js',
                    requires: ['console', 'console-filters'],
                    ws_provides: 'Logger'
                },
                'wegas-editor-buttons': {
                    path: 'wegas-editor/js/widget/wegas-editor-buttons-min.js',
                    requires: ['wegas-button', 'wegas-widgetmenu'],
                    ws_provides: ['SelectPlayerButton', 'SelectGameButton']
                },
                'wegas-pageeditorcss': {
                    path: "wegas-editor/css/wegas-pageeditor-min.css",
                    type: "css"
                },
                'wegas-pageeditor': {
                    path: 'wegas-editor/js/plugin/wegas-pageeditor-min.js',
                    ws_provides: 'PageEditor',
                    requires: ['diff_match_patch', "wegas-editor-widgetaction",
                        "event-mouse-startstop", "node-scroll-info", "anim",
                        "wegas-pageeditor-dragdrop", 'wegas-pageeditorcss',
                        'wegas-pageeditor-resize']
                },
                'wegas-preview-fullscreen': {
                    path: 'wegas-editor/js/plugin/wegas-preview-fullscreen-min.js',
                    ws_provides: 'PreviewFullScreen',
                    requires: ["plugin"]
                },
                'wegas-pageeditor-dragdrop': {
                    path: 'wegas-editor/js/util/wegas-pageeditor-dragdrop-min.js',
                    ws_provides: "PageEditorDD",
                    requires: ['dd-constrain', 'dd-scroll', 'wegas-pageeditorcss']
                },
                'wegas-pageeditor-resize': {
                    path: 'wegas-editor/js/util/wegas-pageeditor-resize-min.js',
                    ws_provides: "PageEditorResize",
                    requires: ['dd-constrain', 'dd-scroll', 'wegas-pageeditorcss']
                },
                'wegas-console': {
                    path: 'wegas-editor/js/widget/wegas-console-min.js',
                    requires: ['wegas-inputex-ace'],
                    ws_provides: 'Console'
                },
                'wegas-console-wysiwyg': {
                    path: 'wegas-editor/js/widget/wegas-console-wysiwyg-min.js',
                    requires: ['wegas-console', 'wegas-inputex-wysiwygscript', "inputex-hidden"],
                    ws_provides: 'WysiwygConsole'
                },
                'wegas-editor-treeview': {
                    path: 'wegas-editor/js/widget/wegas-editor-treeview-min.js',
                    requires: ['wegas-widget', "treeview", "treeview-filter",
                        "wegas-widgetmenu", 'wegas-editor-treeviewcss'],
                    ws_provides: ['EditorTreeView', "JoinedGameTreeView"]
                },
                'wegas-editor-treeviewcss': {
                    path: 'wegas-editor/css/wegas-editor-treeview-min.css',
                    type: "css"
                },
                'wegas-editor-variabletreeview': {
                    path: 'wegas-editor/js/widget/wegas-editor-variabletreeview-min.js',
                    requires: ['wegas-editor-treeview', 'treeview-sortable'],
                    ws_provides: 'VariableTreeView'
                },
                'wegas-datatable': {
                    path: 'wegas-editor/js/widget/wegas-datatable-min.js',
                    requires: ['datatable', 'datatable-sort'],
                    ws_provides: 'DataTable'
                },
                'wegas-menucss': {
                    path: 'wegas-app/css/wegas-menu-min.css',
                    type: 'css'
                },
                'wegas-menu': {
                    path: 'wegas-app/js/util/wegas-menu-min.js',
                    requires: ['button', 'wegas-menucss'],
                    ws_provides: 'WegasMenu'
                },
                'wegas-scriptlibrary': {
                    path: 'wegas-editor/js/widget/wegas-scriptlibrary-min.js',
                    requires: ['button', 'wegas-inputex-ace', 'inputex-select'],
                    ws_provides: 'ScriptLibrary'
                },
                'wegas-fileexplorercss': {
                    path: 'wegas-editor/css/wegas-fileexplorer-min.css',
                    type: 'css'
                },
                'wegas-fileexplorer': {
                    path: 'wegas-editor/js/widget/wegas-fileexplorer-min.js',
                    requires: ['treeview', 'uploader-html5', 'wegas-menu',
                        'wegas-progressbar', 'wegas-fileexplorercss',
                        'wegas-content-entities', 'wegas-tooltip', 'treeview-filter'],
                    ws_provides: "FileExplorer"
                },
                'wegas-progressbar': {
                    path: 'wegas-editor/js/util/wegas-progressbar-min.js',
                    requires: ['widget'],
                    ws_provides: 'ProgressBar'
                },
                'wegas-statemachineviewer': {
                    path: 'wegas-editor/js/widget/wegas-statemachineviewer-min.js',
                    requires: ['dd-constrain', 'wegas-datasource',
                        'wegas-statemachineviewercss', 'jsplumb-yui', 'button',
                        'wegas-statemachine-entities', 'event-mousewheel'],
                    ws_provides: 'StateMachineViewer'
                },
                'wegas-statemachineviewercss': {
                    path: 'wegas-editor/css/wegas-statemachineviewer-min.css'
                },
                'wegas-editor-pagetreeview': {
                    path: 'wegas-editor/js/widget/wegas-editor-pagetreeview-min.js',
                    requires: ['wegas-datasource', "timers"],
                    ws_provides: "PageTreeview"
                },
                'gallery-colorpickercss': {
                    path: 'wegas-editor/css/gallery-colorpicker-min.css',
                    type: 'css'
                },
                /*
                 * MCQ
                 */
                'wegas-mcq-tabview': {
                    path: 'wegas-mcq/js/wegas-mcqtabview-min.js',
                    requires: ['tabview', 'wegas-tabviewcss', 'wegas-gallery', "wegas-jstranslator", 'wegas-mcq-tabviewcss'],
                    ws_provides: "MCQTabView"
                },
                'wegas-mcq-tabviewcss': {
                    path: 'wegas-mcq/css/wegas-mcqtabview-min.css',
                    type: 'css'
                },
                /**
                 * Project Management Game
                 */
                'wegas-pmgwidget-css': {
                    path: 'wegas-pmg/css/wegas-pmgwidget.css',
                    type: 'css'
                },
                'wegas-pmg': {
                    path: 'wegas-pmg/js/wegas-pmg-breadcrumb-min.js',
                    requires: ['wegas-pmg-breadcrumb'],
                    ws_provides: "PmgBreadcrumb"
                },
                'wegas-pmg-datatable': {
                    path: 'wegas-pmg/js/wegas-pmg-datatable-min.js',
                    /*requires:['wegas-pmg-datatable', 'datatable', 'datatable-mutable', 'datasource-arrayschema', 'gallery-treeble'],*/ //Using Treeble
                    requires: ['wegas-datatable', 'datatable', 'datatable-mutable', "template"], //Using simple datatable
                    ws_provides: "PmgDatatable"
                },
                'wegas-pmg-slidepanel': {
                    path: 'wegas-pmg/js/wegas-pmg-slidepanel-min.js',
                    requires: ['anim', 'wegas-pmgwidget-css'],
                    ws_provides: "PmgSlidePanel"
                },
                "wegas-pmg-reservation": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-reservation-min.js',
                    ws_provides: 'Reservation'
                },
                "wegas-pmg-occupationcolor": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-occupationcolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'OccupationColor'
                },
                "wegas-pmg-activitycolor": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-activitycolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'ActivityColor'
                },
                "wegas-pmg-assignment": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-assignment-min.js',
                    requires: ['sortable', 'wegas-pmgwidget-css', 'wegas-widgetmenu'],
                    ws_provides: 'Assignment'
                },
                "wegas-pmg-planification": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-planification-min.js',
                    ws_provides: 'Planification'
                },
                "wegas-pmg-plannificationcolor": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-plannificationcolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'Plannificationcolor'
                },
                "wegas-pmg-plannificationactivitycolor": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-plannificationactivitycolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'PlannificationActivityColor'
                },
                "wegas-pmg-plannificationprogresscolor": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-plannificationprogresscolor-min.js',
                    requires: ['wegas-pmgwidget-css'],
                    ws_provides: 'PlannificationProgressColor'
                },
                "wegas-pmg-bac": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-bac-min.js',
                    requires: ['inputex-string'],
                    ws_provides: 'Bac'
                },
                "wegas-pmg-tablepopup": {
                    path: 'wegas-pmg/js/plugin/wegas-pmg-tablepopup-min.js',
                    requires: ['wegas-widgetmenu'],
                    ws_provides: 'Tablepopup'
                },
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
                /** CrimeSim **/
                'wegas-crimesim-scheduledisplay': {
                    path: 'wegas-crimesim/js/wegas-crimesim-scheduledisplay-min.js',
                    requires: ['wegas-widget', 'wegas-widgetmenu', 'wegas-crimesim-treeble', 'wegas-gallery', 'wegas-crimesim-translator'],
                    ws_provides: "ScheduleDisplay"
                },
                'wegas-crimesim-resultsdisplay': {
                    path: 'wegas-crimesim/js/wegas-crimesim-resultsdisplay-min.js',
                    requires: ['wegas-widget', 'wegas-crimesim-treeble', 'wegas-crimesim-translator'],
                    ws_provides: "ResultsDisplay"
                },
                'wegas-crimesim-choicesrepliesunreadcount': {
                    path: 'wegas-crimesim/js/wegas-crimesim-choicesrepliesunreadcount-min.js',
                    requires: ['wegas-button'],
                    ws_provides: "ChoicesRepliesUnreadCount"
                },
                'wegas-crimesim-treeble': {
                    path: 'wegas-crimesim/js/wegas-crimesim-treeble-min.js',
                    requires: ['datatable', 'datasource-arrayschema', 'gallery-treeble', 'wegas-crimesim-translator'],
                    ws_provides: "CrimeSimTreeble"
                },
                "wegas-crimesim-translator": {
                    path: 'wegas-crimesim/js/wegas-crimesim-translator/wegas-crimesim-translator-min.js',
                    pkg: 'wegas-crimesim/js/wegas-crimesim-translator',
                    lang: ["fr"]
                },
                /** Resource Management **/
                'wegas-nodeformatter': {
                    path: 'wegas-resourcemanagement/js/wegas-nodeformatter-min.js',
                    ws_provides: "NodeFormatter"
                },
                'wegas-itemselector': {
                    path: 'wegas-resourcemanagement/js/wegas-itemselector-min.js',
                    requires: ['wegas-nodeformatter', 'scrollview', 'wegas-widgetmenu'],
                    ws_provides: "ItemSelector"
                },
                'wegas-resourcemanagement-entities': {
                    path: 'wegas-resourcemanagement/js/wegas-resourcemanagement-entities-min.js',
                    requires: ['wegas-entity'],
                    ws_provides: ['ResourceDescriptor', 'TaskDescriptor']
                },
                "wegas-inputex-var-autocomplete": {
                    path: 'wegas-resourcemanagement/wegas-inputex-var-autocomplete-min.js',
                    requires: ['inputex-string'],
                    ix_provides: 'wegasvarautocomplete'
                },
                /* Leaderway */
                'wegas-leaderway': {
                    path: 'wegas-leaderway/js/wegas-leaderway-hrlist-min.js',
                    requires: ['wegas-leaderway-folder', 'wegas-leaderway-tasklist',
                        'wegas-leaderway-score', 'wegas-leaderway-dialogue', "wegas-injector"]/*,
                         ws_provides: "HRList"*/
                },
                'wegas-leaderway-folder': {
                    path: 'wegas-leaderway/js/wegas-leaderway-folder-min.js',
                    requires: ['wegas-itemselector'],
                    ws_provides: "LWFolder"
                },
                'wegas-leaderway-tasklist': {
                    path: 'wegas-leaderway/js/wegas-leaderway-tasklist-min.js',
                    requires: ['datatable'],
                    ws_provides: "TaskList"
                },
                'wegas-leaderway-score': {
                    path: 'wegas-leaderway/js/wegas-leaderway-score-min.js',
                    requires: ['datatable'],
                    ws_provides: "Score"
                },
                'wegas-leaderway-dialogue': {
                    path: 'wegas-leaderway/js/wegas-leaderway-dialogue-min.js',
                    requires: ['charts', 'charts-legend'],
                    ws_provides: "Dialogue"
                },
                "wegas-leaderway-translator": {
                    path: 'wegas-leaderway/js/wegas-leaderway-translator/wegas-leaderway-translator-min.js',
                    pkg: 'wegas-leaderway/js/wegas-leaderway-translator',
                    lang: ["en"]
                },
                /** MMO **/
                'wegas-proggame-level': {
                    path: 'wegas-proggame/js/wegas-proggame-level-min.js',
                    requires: ['wegas-widget', 'wegas-inputex-ace', 'wegas-proggame-display'],
                    ws_provides: 'ProgGameLevel'
                },
                'wegas-proggame-display': {
                    path: 'wegas-proggame/js/wegas-proggame-display-min.js',
                    requires: ['wegas-widget', 'crafty'],
                    ws_provides: 'ProgGameDisplay'
                },
                'wegas-proggame-inputex': {
                    path: 'wegas-proggame/js/wegas-proggame-inputex-min.js',
                    requires: ['wegas-inputex'],
                    ix_provides: ['proggametile', "proggamemap"]
                },
                /**
                 * Flexitests
                 */
                'wegas-flexitests-controller': {
                    path: "wegas-flexitests/js/wegas-flexitests-controller-min.js",
                    requires: ["wegas-layout-absolute", "timers"],
                    ws_provides: ["FlexitestsController", "FlexiResponse"]
                },
                'wegas-flexitests-mcqdisplay': {
                    path: "wegas-flexitests/js/wegas-flexitests-mcqdisplay-min.js",
                    requires: ["wegas-widget", "template"],
                    ws_provides: "FlexitestsMCQ"
                },
                'wegas-flexitests-results': {
                    path: "wegas-flexitests/js/wegas-flexitests-results-min.js",
                    requires: ["wegas-widget", "datatable", "datatable-csv"],
                    ws_provides: "FlexitestsResults"
                },
                /* Chess */
                //'wegas-chess': {
                //    path: "wegas-chess/js/wegas-chess-min.js",
                //    ws_provides: "ChessBoard",
                //    requires: ["transition"]
                //}
                /* Teaching */
                'wegas-teaching-arrow': {
                    path: "wegas-teaching/js/wegas-teaching-arrow-min.js",
                    ws_provides: "TeachingArrow",
                    requires: ["graphics"]
                },
                'wegas-teaching-rectangle': {
                    path: "wegas-teaching/js/wegas-teaching-rectangle-min.js",
                    ws_provides: "TeachingRectangle"
                },
                'wegas-teaching-main': {
                    path: "wegas-teaching/js/wegas-teaching-main.js",
                    ws_provides: "TeachingMain",
                    requires: ["plugin", "panel", "wegas-teaching-arrow", "wegas-teaching-rectangle",
                        "editor", "gallery-yui-tooltip", "dd-plugin", "autocomplete",
                        "autocomplete-highlighters", "autocomplete-filters"]
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
                'jsplumb-yui': {
                    path: 'jsPlumb/yui.jsPlumb-1.5.3.js'
                },
                esprima: {
                    path: 'esprima/esprima-min.js'
                },
                escodegen: {
                    path: 'escodegen/escodegen-min.js'
                },
                gauge: {
                    path: "gauge-min.js"
                },
                pusher: {
                    fullpath: "http://js.pusher.com/1.12/pusher.min.js"
                },
                tinymce: {
                    path: "tiny_mce/tiny_mce.js"
                },
                diff_match_patch: {
                    path: "diffmatchpatch/diff_match_patch.js"
                },
                excanvas: {
                    path: 'excanvas/excanvas.compiled.js'
                },
                crafty: {
                    path: 'crafty/crafty-min.js'
                },
                ace: {
                    fullpath: "http://ajaxorg.github.io/ace-builds/src/ace.js"
                            //charset: 'utf-8',
                            //path: "ace/src-min-noconflict/ace.js"
                            //fullpath: "http://rawgithub.com/ajaxorg/ace-builds/master/src-min-noconflict/ace.js"

                },
                googletranslate: {
                    async: false,
                    fullpath: "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
                            //fullpath: "//translate.google.com/translate_a/element.js?cb=googleSectionalElementInit&"
                            //fullpath: "//translate.google.com/translate_a/element.js?ug=section&hl=en&cb=googleSectionalElementInit"
                            //fullpath: "//translate.google.com/translate_a/element.js?hl=en"
                }
            }
        }
    });
    function loadModules(group) {
        var i, modules = group.modules,
                moduleName,
                allModules = [],
                modulesByType = {};
        for (moduleName in modules) {                                           // Loop through all modules
            if (modules.hasOwnProperty(moduleName)) {
                allModules.push(moduleName); // Build a list of all modules
                if (modules[moduleName].ws_provides) {                          // Build a reverse index on which module provides what type
                    if (Y.Lang.isArray(modules[moduleName].ws_provides)) {
                        for (i = 0; i < modules[moduleName].ws_provides.length; i = i + 1) {
                            modulesByType[modules[moduleName].ws_provides[i]] = moduleName;
                        }
                    } else {
                        modulesByType[modules[moduleName].ws_provides] = moduleName;
                    }
                }
                if (modules[moduleName].ix_provides) {                          // Build a reverse index on which module provides what type
                    if (Y.Lang.isArray(modules[moduleName].ix_provides)) {
                        for (i = 0; i < modules[moduleName].ix_provides.length; i = i + 1) {
                            YUI_config.groups.inputex.modulesByType[modules[moduleName].ix_provides[i]] = moduleName;
                        }
                    } else {
                        YUI_config.groups.inputex.modulesByType[modules[moduleName].ix_provides] = moduleName;
                    }
                }

            }
        }
        group.allModules = allModules;
        group.modulesByType = modulesByType;
    }

    loadModules(YUI_config.groups.wegas);
    loadModules(YUI_config.groups.libraries);
});
