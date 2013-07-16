/*
 * Wegas
 * http://www.albasim.ch/wegas/
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
                        'wegas-pageloader', 'wegas-button'
                                // 'wegas-rights'
                                // 'wegas-appcss',                              // @fixme There is an i in css include order, this one got hardcoded in the jsp file
                    ]
                },
                'wegas-appcss': {
                    path: 'wegas-app/css/wegas-app.css',
                    type: 'css'
                },
                'wegas-helper': {
                    path: 'wegas-app/js/util/wegas-helper-min.js'
                },
                'wegas-editable': {
                    path: 'wegas-app/js/util/wegas-editable-min.js',
                    requires: ['base', 'json']
                },
                'wegas-datasource': {
                    path: 'wegas-app/js/util/wegas-datasource-min.js',
                    requires: ['plugin', 'json', 'array-extras', 'io-base',
                        "datasource-io", "datasource-jsonschema", "datasource-cache",
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
                    path: 'wegas-app/js/persistence/wegas-mcq-entities-min.js',
                    requires: ['wegas-entity'],
                    ws_provides: "QuestionDescriptor"
                },
                'wegas-content-entities': {
                    path: 'wegas-app/js/persistence/wegas-content-entities.js',
                    requires: ['wegas-entity']
                },
                /**
                 * Widgets
                 */
                'wegas-widget': {
                    path: 'wegas-app/js/widget/wegas-widget-min.js',
                    requires: ['widget', 'widget-parent', 'widget-child', 'anim-easing', 'wegas-editable']
                },
                'wegas-pageloader': {
                    path: 'wegas-app/js/widget/wegas-pageloader-min.js',
                    ws_provides: 'PageLoader',
                    requires: ["wegas-widget"]
                },
                'wegas-popup-content': {
                    path: 'wegas-app/js/widget/wegas-popup-content-min.js',
                    ws_provides: 'Panel',
                    requires: ["wegas-popup-contentcss", "widget-buttons",
                        "widget-modality", "widget-position",
                        "widget-position-align",
                        "widget-stack", "widget-stdmod", "transition"]
                },
                'wegas-popup-contentcss': {
                    path: 'wegas-app/css/wegas-popup-content.css',
                    type: 'css'
                },
                'wegas-popuplistener': {
                    path: 'wegas-app/js/plugin/wegas-popuplistener-min.js',
                    ws_provides: 'PopupListener',
                    requires: ["wegas-popup-content"]
                },
                'wegas-button': {
                    path: 'wegas-app/js/widget/wegas-button-min.js',
                    requires: ['wegas-widget', 'wegas-action', 'button', 'wegas-button-css'],
                    ws_provides: 'Button'
                },
                'wegas-button-css': {
                    path: 'wegas-app/css/wegas-button.css',
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
                'wegas-layout': {
                    path: 'wegas-app/js/widget/wegas-layout-min.js',
                    requires: ['wegas-widget', 'widget-stdmod', 'event-resize',
                        'anim-easing', 'resize', 'wegas-layoutcss'],
                    ws_provides: 'Layout'
                },
                'wegas-layoutcss': {
                    path: 'wegas-app/css/wegas-layout.css',
                    type: 'css'
                },
                'wegas-list': {
                    path: 'wegas-app/js/widget/wegas-list-min.js',
                    requires: ['wegas-widget'],
                    ws_provides: 'List'
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
                'wegas-tabview': {
                    path: 'wegas-app/js/widget/wegas-tabview-min.js',
                    requires: ['tabview', 'wegas-tabviewcss', 'wegas-popuplistener'],
                    ws_provides: 'TabView'
                },
                'wegas-tabviewcss': {
                    path: 'wegas-app/css/wegas-tabview.css',
                    type: "css"
                },
                'wegas-variabledisplay': {
                    path: 'wegas-app/js/widget/wegas-variabledisplay-min.js',
                    ws_provides: 'VariableDisplay'
                },
                'wegas-gaugedisplay': {
                    path: 'wegas-app/js/widget/wegas-gaugedisplay-min.js',
                    requires: ["gauge"],
                    ws_provides: 'GaugeDisplay'
                },
                'wegas-absolutelayout': {
                    path: 'wegas-app/js/widget/wegas-absolutelayout-min.js',
                    requires: ["widget-child", "widget-parent", "wegas-editable", "wegas-absolutelayoutcss", "wegas-list", "wegas-cssposition"],
                    ws_provides: ['AbsoluteLayout', "Position"]
                },
                'wegas-absolutelayoutcss': {
                    path: 'wegas-app/css/wegas-absolutelayout.css'
                },
                'wegas-inbox': {
                    path: 'wegas-app/js/widget/wegas-inbox-min.js',
                    requires: ["tabview", "wegas-inboxcss", "wegas-widgettoolbar", "wegas-jstranslator"],
                    ws_provides: 'InboxDisplay'
                },
                'wegas-inboxcss': {
                    path: 'wegas-app/css/wegas-inbox.css',
                    type: 'css'
                },
                'wegas-form': {
                    path: 'wegas-app/js/widget/wegas-form-min.js',
                    requires: ['wegas-widget', 'wegas-inputex',
                        'inputex-string', 'inputex-jsonschema', "inputex-group",
                        'wegas-widgettoolbar', "wegas-button"],
                    ws_provides: "Form"
                },
                'wegas-loginwidget': {
                    path: 'wegas-app/js/widget/wegas-loginwidget-min.js',
                    requires: ['wegas-widget', 'inputex-group', 'inputex-password', 'inputex-string',
                        "inputex-hidden", "inputex-email", "inputex-checkbox", 'button', 'wegas-logincss'],
                    ws_provides: "LoginWidget"
                },
                'wegas-logincss': {
                    path: 'wegas-app/css/wegas-login.css',
                    type: 'css'
                },
                'wegas-jointeam': {
                    path: 'wegas-app/js/widget/wegas-jointeam-min.js',
                    requires: ['wegas-widget', "wegas-inputex", 'wegas-button',
                        'wegas-editor-action', 'inputex-select', 'inputex-string'],
                    ws_provides: "JoinTeam"
                },
                'wegas-joingame': {
                    path: 'wegas-app/js/widget/wegas-joingame-min.js',
                    requires: ['wegas-jointeam'],
                    ws_provides: "JoinGame"
                },
                'wegas-panelwidget': {
                    path: 'wegas-app/js/widget/wegas-panelwidget-min.js',
                    requires: ['panel', 'wegas-joingamewidget'],
                    ws_provides: "PanelWidget"
                },
                'wegas-imageloader': {
                    path: 'wegas-app/js/util/wegas-imageloader-min.js',
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
                    ws_provides: "WegasGallery"
                },
                'wegas-itemselector': {
                    path: 'wegas-app/js/widget/wegas-itemselector-min.js',
                    requires: ['wegas-nodeformatter', 'scrollview', 'wegas-widgetmenu'],
                    ws_provides: "ItemSelector"
                },
                'wegas-nodeformatter': {
                    path: 'wegas-app/js/widget/wegas-nodeformatter-min.js',
                    ws_provides: "NodeFormatter"
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
                'wegas-choicelist': {
                    path: "wegas-app/js/widget/wegas-choicelist-min.js",
                    requires: ["wegas-list", "wegas-choicelistcss"],
                    ws_provides: "ChoiceList"
                },
                'wegas-choicelistcss': {
                    path: "wegas-app/css/wegas-choicelist.css"
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
                    ws_provides: 'Button'
                },
                'wegas-templatecss': {
                    path: "wegas-app/css/wegas-template.css"
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
                    path: 'wegas-app/css/wegas-widgetmenu.css',
                    type: "css"
                },
                'wegas-widgettoolbar': {
                    path: 'wegas-app/js/plugin/wegas-widgettoolbar-min.js',
                    requires: ['wegas-widgettoolbarcss'],
                    ws_provides: 'WidgetToolbar'
                },
                'wegas-widgettoolbarcss': {
                    path: 'wegas-app/css/wegas-widgettoolbar.css',
                    type: "css"
                },
                "wegas-cssloader": {
                    path: 'wegas-app/js/plugin/wegas-cssloader-min.js',
                    requires: ['stylesheet'],
                    ws_provides: 'CSSLoader'
                },
                "wegas-cssstyles": {
                    path: 'wegas-app/js/plugin/wegas-cssstyles-min.js',
                    requires: ['stylesheet'],
                    ws_provides: 'CSSStyles'
                },
                "wegas-cssbackground": {
                    path: 'wegas-app/js/plugin/wegas-cssbackground-min.js',
                    requires: ['wegas-cssstyles'],
                    ws_provides: 'CSSBackground'
                },
                "wegas-csstext": {
                    path: 'wegas-app/js/plugin/wegas-csstext-min.js',
                    requires: ['wegas-cssstyles'],
                    ws_provides: 'CSSText'
                },
                "wegas-cssposition": {
                    path: 'wegas-app/js/plugin/wegas-cssposition-min.js',
                    requires: ['wegas-cssstyles'],
                    ws_provides: 'CSSPosition'
                },
                "wegas-csssize": {
                    path: 'wegas-app/js/plugin/wegas-csssize-min.js',
                    requires: ['wegas-cssstyles'],
                    ws_provides: 'CSSSize'
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
                    requires: ['wegas-inputex', 'inputex-group', 'inputex-combine',
                        'inputex-select'],
                    ix_provides: ["entityarrayfieldselect", "variabledescriptorselect"]
                },
                'wegas-inputex-wysiwygscript': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-wysiwygscript-min.js',
                    requires: ['wegas-inputex', 'wegas-inputex-list', 'wegas-inputex-script',
                        'wegas-inputex-variabledescriptorselect',
                        'wegas-button', 'inputex-jsonschema', 'inputex-list',
                        'wegas-inputex-url', "wegas-inputex-rte", // for mail attachements in script
                        'esprima'],
                    ix_provides: ['script']
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
                'wegas-inputex-markup': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-markup-min.js',
                    ix_provides: 'markup'
                },
                'wegas-inputex-permissionselect': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-permissionselect-min.js',
                    requires: ['inputex-list', 'inputex-field', "inputex-checkbox", "wegas-inputex-roleselect"],
                    ws_provides: 'RolePermissionList'
                },
                'wegas-inputex-gamemodelselect': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-gamemodelselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'gamemodelselect'
                },
                'wegas-inputex-roleselect': {
                    path: 'wegas-editor/js/inputex/wegas-inputex-roleselect-min.js',
                    requires: ['inputex-select'],
                    ix_provides: 'roleselect'
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
                /** Common Widgets **/
                'treeview': {
                    path: 'wegas-editor/js/util/treeview-min.js',
                    requires: ['widget', 'widget-parent', 'widget-child', 'treeviewcss']
                },
                'treeviewcss': {
                    path: 'wegas-editor/css/treeview.css',
                    type: 'css'
                },
                'treeview-filter': {
                    path: 'wegas-editor/js/util/treeview-filter-min.js',
                    requires: ['plugin'],
                    ws_provides: 'TreeViewFilter'
                },
                /** Editor **/
                'wegas-editorcss': {
                    path: 'wegas-editor/css/wegas-editor.css',
                    type: 'css'
                },
                'wegas-rightscss': {
                    path: 'wegas-editor/css/wegas-rights.css',
                    type: 'css'
                },
                'gallery-colorpickercss': {
                    path: 'wegas-editor/css/gallery-colorpicker.css',
                    type: 'css'
                },
                /**
                 *  Editor's Widgets
                 */
                'wegas-editor-action': {
                    path: 'wegas-editor/js/plugin/wegas-editor-action-min.js',
                    requires: ['wegas-action', 'wegas-editor-entityaction'],
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
                'wegas-pageeditor': {
                    path: 'wegas-editor/js/plugin/wegas-pageeditor-min.js',
                    ws_provides: 'PageEditor',
                    requires: ['diff_match_patch', "wegas-editor-widgetaction", "event-mouse-startstop", "node-scroll-info", "anim"]
                },
                'wegas-console': {
                    path: 'wegas-editor/js/widget/wegas-console-min.js',
                    requires: ['wegas-inputex-ace'],
                    ws_provides: 'Console'
                },
                'wegas-impactgame': {
                    path: 'wegas-editor/js/widget/wegas-impactgame-min.js',
                    requires: ['wegas-console', 'wegas-inputex-wysiwygscript', "inputex-hidden"],
                    ws_provides: 'ImpactGame'
                },
                'wegas-editor-treeview': {
                    path: 'wegas-editor/js/widget/wegas-editor-treeview-min.js',
                    requires: ['wegas-widget', "treeview", "treeview-filter",
                        "wegas-widgetmenu", 'wegas-editor-treeviewcss'],
                    ws_provides: ['EditorTreeView', "JoinedGameTreeView"]
                },
                'wegas-editor-treeviewcss': {
                    path: 'wegas-editor/css/wegas-editor-treeview.css',
                    type: "css"
                },
                'wegas-editor-variabletreeview': {
                    path: 'wegas-editor/js/widget/wegas-editor-variabletreeview-min.js',
                    requires: ['wegas-editor-treeview', 'sortable', 'sortable-scroll'],
                    ws_provides: 'VariableTreeView'
                },
                'wegas-datatable': {
                    path: 'wegas-editor/js/widget/wegas-datatable-min.js',
                    requires: ['datatable', 'datatable-sort'],
                    ws_provides: 'DataTable'
                },
                'wegas-menucss': {
                    path: 'wegas-app/css/wegas-menu.css',
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
                    path: 'wegas-editor/css/wegas-fileexplorer.css',
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
                        'wegas-statemachineviewercss', 'jsplumb-yui-all', 'button',
                        'wegas-statemachine-entities'],
                    ws_provides: 'StateMachineViewer'
                },
                'wegas-statemachineviewercss': {
                    path: 'wegas-editor/css/wegas-statemachineviewer.css'
                },
                'wegas-mcqtabview': {
                    path: 'wegas-app/js/widget/wegas-mcqtabview-min.js',
                    requires: ['tabview', 'wegas-tabviewcss', 'wegas-gallery', "wegas-jstranslator"],
                    ws_provides: "MCQTabView"
                },
                'wegas-editor-pagetreeview': {
                    path: 'wegas-editor/js/widget/wegas-editor-pagetreeview-min.js',
                    requires: ['wegas-datasource', 'wegas-list'],
                    ws_provides: "PageTreeview"
                },
                'wegas-sharerole': {
                    path: 'wegas-editor/js/widget/wegas-sharerole-min.js',
                    requires: ['inputex-select', 'inputex-list', "inputex-checkbox"],
                    ws_provides: "ShareRole"
                },
                'wegas-shareuser': {
                    path: 'wegas-editor/js/widget/wegas-shareuser-min.js',
                    requires: ['inputex-list', "inputex-checkbox", "inputex-autocomplete", 'autocomplete-highlighters',
                        'inputex-hidden', 'wegas-inputex-markup'],
                    ws_provides: "ShareUser"
                },
                /**
                 * Project Management Game
                 */
                'wegas-pmg': {
                    path: 'wegas-pmg/js/wegas-pmg-breadcrumb-min.js',
                    requires: ['wegas-pmg-breadcrumb'],
                    ws_provides: "PmgBreadcrumb"
                },
                'wegas-pmg-tasklist': {//Using simple taskList
                    path: 'wegas-pmg/js/wegas-pmg-tasklist-min.js',
                    requires: ['wegas-pmg-tasklist', 'wegas-pmg-datatable'],
                    ws_provides: "PmgTasklist"
                },
                //'wegas-pmg-treebletasklist': { //Using Treeble
                //    path: 'wegas-pmg/js/wegas-pmg-treebletasklist.js',
                //    requires: ['wegas-pmg-treebletasklist', 'wegas-pmg-datatable'],
                //    ws_provides: "PmgTreebleTasklist"
                //},
                'wegas-pmg-gantt': {
                    path: 'wegas-pmg/js/wegas-pmg-gantt-min.js',
                    requires: ['wegas-pmg-gantt', 'wegas-pmg-datatable'],
                    ws_provides: "PmgGantt"
                },
                'wegas-pmg-resourcelist': {
                    path: 'wegas-pmg/js/wegas-pmg-resourcelist-min.js',
                    requires: ['wegas-widgetmenu', 'wegas-pmg-gantt', 'sortable'],
                    ws_provides: "PmgResourcelist"
                },
                'wegas-pmg-datatable': {
                    path: 'wegas-pmg/js/wegas-pmg-datatable-min.js',
                    /*requires:['wegas-pmg-datatable', 'datatable', 'datatable-mutable', 'datasource-arrayschema', 'gallery-treeble'],*/ //Using Treeble
                    requires: ['wegas-pmg-datatable', 'datatable', 'datatable-mutable'], //Using simple datatable
                    ws_provides: "PmgDatatable"
                },
                'wegas-pmg-slidepanel': {
                    path: 'wegas-pmg/js/wegas-pmg-slidepanel-min.js',
                    requires: ['anim'],
                    ws_provides: "PmgSlidePanel"
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
                'wegas-monopoly-entities': {
                    path: 'wegas-monopoly/js/wegas-monopoly-entities.js',
                    requires: ['wegas-entity'],
                    ws_provides: ['ObjectDescriptor']
                },
                /**CEP**/
                'wegas-cep': {
                    path: 'wegas-cep/js/wegas-cep-folder-min.js',
                    requires: ['wegas-nodeformatter', 'wegas-itemselector', 'wegas-cep-folder', "wegas-injector", "wegas-inbox"],
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
                /**Leaderway**/
                'wegas-leaderway-entities': {
                    path: 'wegas-leaderway/js/wegas-leaderway-entities.js',
                    requires: ['wegas-entity'],
                    ws_provides: ['ResourceDescriptor', 'TaskDescriptor']
                },
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
                /**
                 * Flexitests
                 */
                'wegas-flexitests-controller': {
                    path: "wegas-flexitests/js/wegas-flexitests-controller-min.js",
                    requires: ["wegas-absolutelayout", "timers"],
                    ws_provides: ["FlexitestsController", "FlexiResponse"]
                },
                'wegas-flexitests-mcqdisplay': {
                    path: "wegas-flexitests/js/wegas-flexitests-mcqdisplay-min.js",
                    requires: ["wegas-widget", "template"],
                    ws_provides: "FlexitestsMCQ"
                },
                'wegas-flexitests-results': {
                    path: "wegas-flexitests/js/wegas-flexitests-results-min.js",
                    requires: ["wegas-widget", "datatable"],
                    ws_provides: "FlexitestsResults"
                },
                /* Chess */
                'wegas-chess': {
                    path: "wegas-chess/js/wegas-chess-min.js",
                    ws_provides: "ChessBoard",
                    requires: ["transition"]
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
                /* jsPlumb */
                jsplumb: {
                    path: 'jsPlumb/jsPlumb-1.3.10-RC1.js',
                    requires: ['jsplumb-utils', 'dd']
                },
                'jsplumb-utils': {
                    path: 'jsPlumb/jsPlumb-util-1.3.10-RC1.js',
                    requires: []
                },
                'jsplumb-svg': {
                    path: 'jsPlumb/jsPlumb-renderers-svg-1.3.10-RC1.js',
                    requires: ['jsplumb']
                },
                'jsplumb-defaults': {
                    path: 'jsPlumb/jsPlumb-defaults-1.3.10-RC1.js',
                    requires: ['jsplumb']
                },
                'jsplumb-statemachine': {
                    path: 'jsPlumb/jsPlumb-connectors-statemachine-1.3.10-RC1.js',
                    requires: ['jsplumb', 'jsbezier']
                },
                'jsplumb-yui': {
                    path: 'jsPlumb/yui.jsPlumb-1.3.10-RC1.js',
                    requires: ['jsplumb']
                },
                'jsplumb-yui-all': {
                    path: 'jsPlumb/yui.jsPlumb-1.3.15-all-min.js',
                    requires: ["node", "dd", "anim"/*, "node-event-simulate"*/]
                },
                jsbezier: {
                    path: 'jsPlumb/jsBezier-0.3-min.js'
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
                    charset: 'utf-8',
                    //path: "ace/src-min-noconflict/ace.js"
                    fullpath: "http://rawgithub.com/ajaxorg/ace-builds/master/src-min-noconflict/ace.js"

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
                allModules.push(moduleName);                                    // Build a list of all modules
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
