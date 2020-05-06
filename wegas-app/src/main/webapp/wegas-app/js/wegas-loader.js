/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * Wegas loader, contains module definitions.
 *
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
/*global YUI_config, YUI:true*/
YUI().use(function(Y) {
    "use strict";
    var CSS = "css";
    if (!YUI_config) {
        YUI_config = {};
    }
    if (!YUI_config.groups) {
        YUI_config.groups = {
            inputex: {
                modulesByType: {}
            }
        };
    }
    if (!YUI_config.Wegas) {
        YUI_config.Wegas = {};
    }
    YUI_config.Wegas.modulesByType = {};
    /**
     *
     */
    YUI.addGroup = function(name, group) {
        YUI_config.groups[name] = group;
        group.combine = false;
        group.filter = YUI_config.debug ? "raw" : "min"; // Select raw files
        group.base = YUI_config.Wegas.base + group.root; // Set up path
        loadModules(group);
        //YUI.applyConfig(YUI_config);
    };
    YUI.addGroup("wegas", {
        base: "./wegas-app/",
        root: "/wegas-app/",
        modules: {
            /**
             * Base
             */
            "wegas-app": {
                requires: ["base", "plugin", "array-extras", "timers",
                    "wegas-alerts", "wegas-helper", "wegas-entity", "wegas-datasource", "font-awesome", "template-micro",
                    "wegas-i18n", "wegas-keyframescss", "wegas-lockmanager", "wegas-surveylistener"]
            },
            "wegas-alerts": {
                requires: ["widget"]
            },
            "wegas-keyframescss": {
                type: CSS
            },
            "wegas-editable": {
            },
            "wegas-i18n-global-fr": {
                path: 'js/i18n/i18n-global-fr-min.js'
            },
            "wegas-i18n-global-en": {
                path: 'js/i18n/i18n-global-en-min.js'
            },
            "wegas-i18n-global-de": {
                path: 'js/i18n/i18n-global-de-min.js'
            },
            "wegas-i18n-global-it": {
                path: 'js/i18n/i18n-global-it-min.js'
            },
            "wegas-i18n-global": {
                path: 'js/i18n/i18n-global-min.js',
                requires: ['wegas-i18n']
            },
            "wegas-i18n": {
                requires: ['datatype-number']
            },
            /**
             * Persistence
             */
            "wegas-datasource": {
                requires: ["datasource-io", "json", "widget", "gzip"]
            },
            "wegas-scripteval": {
                path: "js/persistence/wegas-scripteval-min.js",
                requires: "wegas-variabledescriptor-entities",
                ws_provides: "ScriptEval"
            },
            "wegas-websocketlistener": {
                path: "js/persistence/wegas-websocketlistener-min.js",
                requires: "wegas-cssloader",
                ws_provides: "WebSocketListener"
            },
            "wegas-pusher-connector": {
                path: "js/persistence/wegas-pusher-connector-min.js",
                requires: "pusher",
                ws_provides: "PusherDataSource"
            },
            "wegas-entity": {
                path: "js/persistence/wegas-entity-min.js",
                requires: "wegas-editable",
                ws_provides: ["Entity", "GameModel"]
            },
            "wegas-variabledescriptor-entities": {
                path: "js/persistence/wegas-variabledescriptor-entities-min.js",
                requires: ["wegas-entity", "promise"],
                ws_provides: [
                    "BooleanDescriptor",
                    "BooleantInstance",
                    "InboxDescriptor",
                    "InboxInstance",
                    "ListDescriptor",
                    "ListInstance",
                    "NumberDescriptor",
                    "NumberInstance",
                    "StringDescriptor",
                    "StringInstance",
                    "TextDescriptor",
                    "TextInstance",
                    "StaticTextDescriptor"
                ]
            },
            "wegas-statemachine-entities": {
                path: "js/persistence/wegas-statemachine-entities-min.js",
                ws_provides: [
                    "DialogueDescriptor",
                    "TriggerDescriptor",
                    "FSMDescriptor",
                    "FSMInstance"
                ]
            },
            "wegas-content-entities": {
                path: "js/persistence/wegas-content-entities-min.js"
            },
            "wegas-object-entities": {
                path: "js/persistence/wegas-object-entities-min.js",
                ws_provides: [
                    "ObjectDescriptor",
                    "ObjectInstance"
                ]
            },
            "wegas-resourcemanagement-entities": {
                path: "js/persistence/wegas-resourcemanagement-entities-min.js",
                requires: "arraysort",
                ws_provides: [
                    "ResourceDescriptor",
                    "ResourceInstance",
                    "TaskDescriptor",
                    "TaskInstance",
                    "BurndownDescriptor",
                    "BurndownInstance"
                ]
            },
            /**
             * Widgets
             */
            "wegas-widget": {
                requires: ["widget", "widget-child", "widget-parent", "wegas-editable"]
            },
            "wegas-parent": {
                requires: "wegas-widget"
            },
            "wegas-layout-panel": {
                path: "js/widget/wegas-layout-panel-min.js",
                requires: "panel",
                ws_provides: "PanelWidget"
            },
            "wegas-layout-list": {
                path: "js/widget/wegas-layout-list-min.js",
                requires: "wegas-parent",
                ws_provides: ["List", "FlexList"]
            },
            "wegas-layout-menu": {
                path: "js/widget/wegas-layout-menu-min.js",
                requires: ["wegas-parent", "wegas-layout-menucss"],
                ws_provides: ["LayoutMenu", "I18nMenu"]
            },
            "wegas-layout-menucss": {
                type: CSS
            },
            "wegas-layout-absolute": {
                path: "js/widget/wegas-layout-absolute-min.js",
                requires: ["wegas-plugin", "wegas-layout-absolutecss", "wegas-cssstyles-extra", "wegas-parent"],
                ws_provides: ["AbsoluteLayout", "Position"]
            },
            "wegas-layout-absolutecss": {
                type: CSS
            },
            "wegas-layout-choicelist": {
                path: "js/widget/wegas-layout-choicelist-min.js",
                requires: ["wegas-layout-list", "wegas-layout-choicelistcss"],
                ws_provides: "ChoiceList"
            },
            "wegas-layout-choicelistcss": {
                type: CSS
            },
            "wegas-layout-resizable": {
                path: "js/widget/wegas-layout-resizable-min.js",
                requires: ["wegas-widget", "widget-stdmod", "event-resize", "resize", "wegas-layout-resizablecss"],
                ws_provides: "ResizableLayout"
            },
            "wegas-layout-resizablecss": {
                type: CSS
            },
            "wegas-pageloader": {
                path: "js/widget/wegas-pageloader-min.js",
                ws_provides: ["PageLoader", "GetPageIdFromQueryString"],
                requires: ["wegas-plugin", "wegas-widget", "querystring-parse"]
            },
            "wegas-popuplistener": {
                path: "js/plugin/wegas-popuplistener-min.js",
                ws_provides: "PopupListener",
                requires: "wegas-panel"
            },
            "wegas-surveylistener": {
                path: "js/plugin/wegas-surveylistener-min.js",
                ws_provides: "SurveyListener",
            },
            "wegas-resizelistener": {
                path: "js/plugin/wegas-resizelistener-min.js",
                ws_provides: "ResizeListener"
                    //requires: "wegas-panel"
            },
            "wegas-button": {
                path: "js/widget/wegas-button-min.js",
                requires: ["wegas-widget", "wegas-plugin", "button", "wegas-tooltip", "wegas-button-css"],
                ws_provides: ["Button", "UnreadCount", "MarkAsUnread"]
            },
            "wegas-button-css": {
                type: CSS
            },
            "wegas-loginbutton": {
                path: "js/widget/wegas-loginbutton-min.js",
                requires: ["wegas-widgetmenu", "wegas-i18n-global"],
                ws_provides: ["LoginButton", "UserLoginButton", "RestartButton", "LanguageSelectionMenu"]
            },
            "wegas-chat": {
                path: "js/widget/wegas-chat-min.js",
                requires: ["button"],
                ws_provides: "Chat"
            },
            "wegas-chart-css": {
                type: CSS
            },
            "wegas-chart": {
                path: "js/widget/wegas-chart-min.js",
                requires: ["promise", "chartist", "wegas-chart-css"],
                ws_provides: "Chart"
            },
            "wegas-langselector": {
                path: "js/widget/wegas-langselector-min.js",
                ws_provides: "LangSelector"
            },
            "wegas-text-inputcss": {
                type: CSS
            },
            "wegas-text-input": {
                path: "js/widget/wegas-text-input-min.js",
                ws_provides: ["TextInput", "StringInput", "BooleanInput", "SaveStatusAggregator"],
                requires: ["sortable", "wegas-text-inputcss", "wegas-widget", "tinymce", "wegas-panel-fileselect", "wegas-button", "event-valuechange"]
            },
            "wegas-number-inputcss": {
                type: CSS
            },
            "wegas-number-input": {
                path: "js/widget/wegas-number-input-min.js",
                ws_provides: ["NumberInput", "BoxesNumberInput"],
                requires: ["wegas-number-inputcss", "wegas-widget", "wegas-button", "slider", "wegas-i18n-global", "event-valuechange"]
            },
            "wegas-pdf-print-css": {
                type: CSS
            },
            "wegas-prettyprinter": {
                path: "js/widget/wegas-prettyprinter-min.js",
                ws_provides: ["AbstractPrettyPrinter", "TextPrettyPrinter"],
                requires: ["wegas-widget", "wegas-pdf-print-css"]
            },
            "wegas-text": {
                path: "js/widget/wegas-text-min.js",
                ws_provides: ["Text", "String"],
                requires: "wegas-widget"
            },
            "wegas-image": {
                path: "js/widget/wegas-image-min.js",
                ws_provides: "Image"
            },
            "wegas-box": {
                path: "js/widget/wegas-box-min.js",
                ws_provides: ["Box", "Line"],
                requires: "wegas-widget"
            },
            "wegas-tabview": {
                path: "js/widget/wegas-tabview-min.js",
                requires: ["tabview", "wegas-parent", "wegas-tabviewcss", "wegas-popuplistener"],
                ws_provides: "TabView"
            },
            "wegas-tabviewcss": {
                type: CSS
            },
            "wegas-bscopeinspector": {
                path: "js/widget/wegas-bscopeinspector-min.js",
                ws_provides: "BScopeInspector"
            },
            "wegas-gaugedisplay": {
                path: "js/widget/wegas-gaugedisplay-min.js",
                requires: ["gauge", "wegas-templatecss"],
                ws_provides: "GaugeDisplay"
            },
            "wegas-inbox": {
                path: "js/widget/wegas-inbox-min.js",
                requires: ["wegas-responsive-tabview", "wegas-inboxcss"],
                ws_provides: "InboxDisplay"
            },
            "wegas-responsive-tabview": {
                path: "js/widget/wegas-responsive-tabview-min.js",
                requires: ["wegas-tabview", "wegas-tabviewcss",
                    "wegas-widgettoolbar", "wegas-responsive-tabviewcss", "wegas-i18n-global"],
                ws_provides: ["ReponsiveTabView"]
            },
            "wegas-responsive-tabviewcss": {
                type: CSS
            },
            "wegas-inboxcss": {
                type: CSS
            },
            "wegas-inbox-list": {
                path: "js/widget/wegas-inbox-list-min.js",
                requires: ["wegas-inbox", "wegas-inboxcss", "promise"],
                ws_provides: "InboxList"
            },
            "wegas-form": {
                path: "js/widget/wegas-form-min.js",
                requires: ["wegas-inputex", "wegas-widgettoolbar",
                    "inputex-group", "event-valuechange"],
                ws_provides: "Form"
            },
            "wegas-gallery": {
                path: "js/widget/wegas-gallery-min.js",
                requires: ["wegas-widget", "wegas-imageloader", "scrollview-base",
                    "scrollview-paginator", "scrollview-scrollbars", "wegas-gallerycss",
                    "stylesheet", "event-resize"],
                ws_provides: "Gallery"
            },
            "wegas-gallerycss": {
                type: CSS
            },
            "wegas-googletranslate": {
                path: "js/widget/wegas-googletranslate-min.js",
                requires: "googletranslate",
                ws_provides: "GoogleTranslate"
            },
            /** Plugins **/
            "wegas-plugin": {
                requires: ["timers", "wegas-widget"]
            },
            "wegas-userpreferences": {
                path: "js/plugin/wegas-userpreferences-min.js",
                requires: "wegas-plugin",
                ws_provides: "UserPreferences"
            },
            "wegas-tooltip": {
                path: "js/plugin/wegas-tooltip-min.js",
                requires: ["wegas-plugin", "event-mouseenter", "widget", "widget-stack",
                    "widget-position", "widget-position-constrain"],
                ws_provides: "Tooltip"
            },
            "wegas-templatecss": {
                type: CSS
            },
            "wegas-template": {
                path: "js/widget/wegas-template-min.js",
                requires: ["template-micro", "wegas-templatecss"],
                ws_provides: ["Template", "ValueboxTemplate", "BoxTemplate",
                    "NumberTemplate", "TitleTemplate", "FractionTemplate", "TextTemplate"]
            },
            "wegas-treeview": {
                path: "js/widget/wegas-treeview-min.js",
                requires: "treeview",
                ws_provides: "TreeViewWidget"
            },
            "wegas-injector": {
                path: "js/plugin/wegas-injector-min.js",
                ws_provides: "Injector"
            },
            "wegas-eventlogger": {
                path: "js/plugin/wegas-eventlogger-min.js",
                requires: "wegas-plugin",
                ws_provides: ["EventLogger"]
            },
            "wegas-lockmanager": {
                path: "js/plugin/wegas-lockmanager-min.js",
                requires: "wegas-plugin",
                ws_provides: ["LockManager", "Lockable"]
            },
            "wegas-cssloader": {
                path: "js/plugin/wegas-cssloader-min.js",
                requires: "stylesheet",
                ws_provides: "CSSLoader"
            },
            "wegas-slideshow": {
                path: "js/plugin/wegas-slideshow-min.js",
                requires: "wegas-plugin",
                ws_provides: "SlideShow"
            },
            "wegas-cssstyles": {
                path: "js/plugin/wegas-cssstyles-min.js",
                requires: "wegas-plugin",
                ws_provides: "CSSStyles"
            },
            "wegas-cssstyles-extra": {
                path: "js/plugin/wegas-cssstyles-extra-min.js",
                requires: "wegas-cssstyles",
                ws_provides: ["CSSBackground", "CSSBackgroundImage", "CSSText", "CSSPosition", "CSSSize"]
            },
            "wegas-conditionaldisplay": {
                path: "js/plugin/wegas-conditionaldisplay-min.js",
                ws_provides: "ConditionalDisplay"
            },
            "wegas-conditionaldisable": {
                path: "js/plugin/wegas-conditionaldisable-min.js",
                ws_provides: "ConditionalDisable"
            },
            "wegas-blockrightclick": {
                path: "js/plugin/wegas-blockrightclick-min.js",
                ws_provides: "BlockRightclick"
            },
            "wegas-editormode": {
                path: "js/plugin/wegas-editormode-min.js",
                ws_provides: "EditorMode"
            },
            "wegas-panel-pageloader": {
                path: "js/plugin/wegas-panel-pageloader-min.js",
                requires: ["wegas-plugin", "wegas-pageloader", "wegas-panel"],
                ws_provides: ["OpenPanelPageloader", "OpenPanelWithCfg", "ClosePanel"]
            },
            "wegas-visibilitytimer": {
                path: "js/plugin/wegas-visibilitytimer-min.js",
                requires: "wegas-plugin",
                ws_provides: ["ShowAfter", "HideAfter"]
            },
            "wegas-simpledialogue": {
                path: "js/widget/wegas-simpledialogue-min.js",
                requires: ["wegas-dialogcss"],
                ws_provides: "SimpleDialogue"
            },
            "wegas-historydialog": {
                path: "js/widget/wegas-historydialog-min.js",
                requires: ["wegas-simpledialogue", "wegas-dialogcss"],
                ws_provides: ["HistoryDialog"]
            },
            "wegas-dialogue-folder": {
                path: "js/widget/wegas-dialogue-folder-min.js",
                requires: ["wegas-entitychooser"],
                ws_provides: ["DialogueFolder"]
            },
            "wegas-dialogcss": {
                type: CSS
            },
            "wegas-entitychooser": {
                path: "js/widget/wegas-entitychooser-min.js",
                requires: ["wegas-entitychoosercss", "wegas-button", "wegas-react-form"],
                ws_provides: ["EntityChooser", "EntityChooser2", "ObjectPropertyEditor"]
            },
            "wegas-entitychoosercss": {
                type: CSS
            },
            "wegas-showoverlayonclickcss": {
                type: CSS
            },
            "wegas-showoverlayonclick": {
                path: "js/plugin/wegas-showoverlayonclick-min.js",
                requires: ["overlay", "wegas-showoverlayonclickcss"],
                ws_provides: ["ShowOverlayOnClick", "ShowInboxListOnClick"]
            },
            "wegas-chartistcss": {
                type: CSS
            },
            "wegas-spreadsheet": {
                path: "js/widget/wegas-spreadsheet-min.js",
                requires: ["wegas-spreadsheetcss", "wegas-mcq-viewcss", "wegas-panel", 
                    "wegas-i18n-global", "wegas-button"],
                ws_provides: "Spreadsheet"
            },
            "wegas-spreadsheetcss": {
                type: CSS
            }
        }
    });
    /**
     * Utilities
     */
    YUI.addGroup("wegas-util", {
        base: "./wegas-util/",
        root: "/wegas-util/",
        modules: {
            "wegas-helper": {},
            "wegas-script-helper": {
                requires: ["esprima"]
            },
            "datatable-csv": {
                ws_provides: "DatatableCSV"
            },
            "event-mouse-startstop": {
                requires: "event-base"
            },
            /** Treeview **/
            "treeview": {
                requires: ["widget", "widget-parent", "widget-child", "treeviewcss"]
            },
            "treeviewcss": {
                type: CSS
            },
            "treeview-filter": {},
            "treeview-sortable": {
                requires: ["plugin", "event", "array-extras", "yui-later"]
            },
            "wegas-progressbar": {
                requires: "widget"
            },
            "wegas-widgetmenu": {
                requires: ["event-mouseenter", "event-outside",
                    "widget-stack", "widget-position", "widget-position-align", "widget-position-constrain",
                    "wegas-button", "wegas-widgetmenucss"]
            },
            "wegas-widgetmenucss": {
                type: CSS
            },
            "wegas-widgettoolbar": {
                requires: ["wegas-widgettoolbarcss", "wegas-widgetmenu"],
                ws_provides: "WidgetToolbar"
            },
            "wegas-widgettoolbarcss": {
                type: CSS
            },
            "wegas-tutorialcss": {
                type: CSS
            },
            "wegas-tutorial": {
                requires: ["wegas-tutorialcss", "event-resize"]
            },
            "wegas-panel": {
                ws_provides: "Panel",
                requires: ["wegas-panelcss", "widget-buttons", "widget-modality",
                    "widget-position", "widget-position-align", "widget-stack",
                    "widget-stdmod", "transition", "event-resize"]
            },
            "wegas-panelcss": {
                type: CSS
            },
            "wegas-modal": {
                ws_provides: "Modal",
                requires: "wegas-modalcss"
            },
            "wegas-modalcss": {
                type: CSS
            },
            "wegas-menu": {
                requires: ["button", "wegas-menucss"],
                ws_provides: "WegasMenu"
            },
            "wegas-menucss": {
                type: CSS
            },
            "wegas-imageloader": {
                requires: ["io-base", "imageloader"]
            },
            "wegas-panel-node": {
                requires: ["dd-drag", "plugin"],
                ws_provides: "PanelNode"
            }
        }
    });
    /**
     * Editor
     */
    YUI.addGroup("wegas-editor", {
        base: "./wegas-editor/",
        root: "/wegas-editor/",
        modules: {
            /**
             * Inputex Fields
             */
            "wegas-inputex": {
                type: CSS,
                requires: "inputex"
            },
            "wegas-inputex-object": {
                path: "js/inputex/wegas-inputex-object-min.js",
                requires: "inputex-object",
                ix_provides: "wegasobject"
            },
            "wegas-inputex-multipleoptions": {
                path: "js/inputex/wegas-inputex-multipleoptions-min.js",
                requires: "inputex-group",
                ix_provides: "multipleoptions"
            },
            "wegas-inputex-colorpicker": {
                path: "js/inputex/wegas-inputex-colorpicker-min.js",
                requires: ["inputex-field", "overlay"],
                ix_provides: "colorpicker"
            },
            "wegas-inputex-keyvalue": {
                path: "js/inputex/wegas-inputex-keyvalue-min.js",
                requires: "inputex-keyvalue",
                ix_provides: "wegaskeyvalue"
            },
            "wegas-inputex-rte": {
                path: "js/inputex/wegas-inputex-rte-min.js",
                requires: ["wegas-inputex", "inputex-textarea", "tinymce", "wegas-panel-fileselect"],
                ix_provides: "html"
            },
            "wegas-inputex-list": {
                path: "js/inputex/wegas-inputex-list-min.js",
                requires: ["inputex-group", "wegas-text"],
                ix_provides: ["listfield", "editablelist", "pluginlist"]
            },
            "wegas-inputex-hashlist": {
                path: "js/inputex/wegas-inputex-hashlist-min.js",
                requires: "inputex-list",
                ix_provides: "hashlist"
            },
            "wegas-inputex-script": {
                path: "js/inputex/wegas-inputex-script-min.js",
                requires: "wegas-inputex-ace"
            },
            "wegas-inputex-variabledescriptorselect": {
                path: "js/inputex/wegas-inputex-variabledescriptorselect-min.js",
                requires: ["wegas-inputex", "inputex-group", "inputex-combine",
                    "inputex-number", "inputex-select"],
                ix_provides: ["entityarrayfieldselect", "variabledescriptorselect"]
            },
            "wegas-inputex-pageloaderselect": {
                path: "js/inputex/wegas-inputex-pageloaderselect-min.js",
                requires: "wegas-inputex-combobox",
                ix_provides: "pageloaderselect"
            },
            "wegas-inputex-wysiwygscript": {
                path: "js/inputex/wegas-inputex-wysiwygscript-min.js",
                requires: ["wegas-inputex", "wegas-inputex-list", "wegas-inputex-script",
                    "wegas-inputex-variabledescriptorselect",
                    "wegas-button", "inputex-list", "wegas-inputex-url",
                    "wegas-inputex-rte", // for mail attachments in script
                    "esprima"],
                ix_provides: ["script", "variableselect", "flatvariableselect"]
            },
            "wegas-inputex-url": {
                path: "js/inputex/wegas-inputex-url-min.js",
                requires: ["inputex-url", "wegas-panel-fileselect"],
                ix_provides: ["wegasurl", "wegasimageurl"]
            },
            "wegas-inputex-ace": {
                path: "js/inputex/wegas-inputex-ace-min.js",
                requires: ["ace", "inputex-textarea", "wegas-inputex"],
                ix_provides: "ace"
            },
            "wegas-inputex-markup": {
                path: "js/inputex/wegas-inputex-markup-min.js",
                ix_provides: "markup"
            },
            "wegas-inputex-pageselect": {
                path: "js/inputex/wegas-inputex-pageselect-min.js",
                requires: "inputex-select",
                ix_provides: "pageselect"
            },
            "wegas-inputex-now": {
                path: "js/inputex/wegas-inputex-now-min.js",
                requires: ["wegas-inputex", "inputex-hidden"],
                ix_provides: "now"
            },
            "wegas-inputex-contextgroup": {
                path: "js/inputex/wegas-inputex-contextgroup-min.js",
                requires: ["inputex-group", "inputex-select"],
                ix_provides: "contextgroup"
            },
            "wegas-inputex-combobox": {
                path: "js/inputex/wegas-inputex-combobox-min.js",
                requires: ["inputex-autocomplete", "inputex-string", "autocomplete",
                    "autocomplete-filters"],
                ix_provides: "combobox"
            },
            "wegas-panel-fileselect": {
                path: "js/widget/wegas-panel-fileselect-min.js",
                requires: ["panel", "wegas-fileexplorer"],
                ws_provides: "FileSelect"
            },
            "wegas-editorcss": {
                type: CSS
            },
            "wegas-editor-roundcss": {
                type: CSS
            },
            "wegas-editor-darkcss": {
                type: CSS
            },
            "wegas-editor-asciicss": {
                type: CSS
            },
            "wegas-editor-action": {
                path: "js/plugin/wegas-editor-action-min.js",
                requires: ["wegas-button", "wegas-plugin", "event-key"],
                ws_provides: ["OpenTabAction", "OpenTabButton", "Linkwidget", "OnDeleteListener", "ToggleAdvancedTabsMode"]
            },
            "wegas-editor-entityaction": {
                path: "js/plugin/wegas-editor-entityaction-min.js",
                requires: ["wegas-plugin", "wegas-form", "wegas-react-form", "wegas-panel", "wegas-tabview"],
                ws_provides: ["NewEntityAction", "EditEntityAction", "NewEntityButton"]
            },
            "wegas-editor-widgetaction": {
                path: "js/plugin/wegas-editor-widgetaction-min.js",
                requires: "wegas-editor-entityaction",
                ws_provides: ["EditWidgetAction", "DeleteWidgetAction"]
            },
            "wegas-logger": {
                path: "js/widget/wegas-logger-min.js",
                requires: ["console", "console-filters"],
                ws_provides: "Logger"
            },
            "wegas-pageeditorcss": {
                type: CSS
            },
            "wegas-pageeditor": {
                path: "js/plugin/wegas-pageeditor-min.js",
                ws_provides: "PageEditor",
                requires: ["json_patch", "wegas-editor-widgetaction",
                    "event-mouse-startstop", "node-scroll-info",
                    "wegas-pageeditor-dragdrop", "wegas-pageeditorcss",
                    "wegas-pageeditor-resize"]
            },
            "wegas-pageeditor-dragdrop": {
                path: "js/plugin/wegas-pageeditor-dragdrop-min.js",
                ws_provides: "PageEditorDD",
                requires: ["dd-constrain", "dd-scroll", "wegas-pageeditorcss", "wegas-editor-entityaction"]
            },
            "wegas-pageeditor-resize": {
                path: "js/plugin/wegas-pageeditor-resize-min.js",
                ws_provides: "PageEditorResize",
                requires: ["dd-constrain", "dd-scroll", "wegas-pageeditorcss", "wegas-editor-entityaction"]
            },
            "wegas-preview-fullscreen": {
                path: "js/plugin/wegas-preview-fullscreen-min.js",
                ws_provides: ["PreviewFullScreen", "ToggleBlockAction", "BlockAction", "BlockAnyAction"],
                requires: "wegas-pageeditorcss"
            },
            'wegas-fullwidthtab': {
                path: "js/plugin/wegas-fullwidthtab-min.js",
                requires: "event-resize",
                ws_provides: "FullWidthTab"
            },
            "wegas-console-wysiwyg": {
                path: "js/widget/wegas-console-wysiwyg-min.js",
                requires: ["wegas-widgettoolbar", "wegas-qrcode-scanner", "wegas-react-form"],
                ws_provides: "WysiwygConsole"
            },
            "wegas-console-custom": {
                path: "js/widget/wegas-console-custom-min.js",
                requires: ["wegas-react-form"],
                provides: "CustomConsole"
            },
            "wegas-editor-treeview": {
                path: "js/widget/wegas-editor-treeview-min.js",
                requires: ["treeview", "wegas-widgetmenu", "wegas-editor-treeviewcss", "wegas-editor-entityaction"],
                ws_provides: ["EditorTreeView", "TeamTreeView"]
            },
            "wegas-editor-treeviewcss": {
                type: CSS
            },
            "wegas-editor-variabletreeview": {
                path: "js/widget/wegas-editor-variabletreeview-min.js",
                requires: ["wegas-editor-treeview", "treeview-sortable", "treeview-filter"],
                ws_provides: "VariableTreeView"
            },
            "wegas-editor-pagetreeview": {
                path: "js/widget/wegas-editor-pagetreeview-min.js",
                ws_provides: ["PageTreeview", "UneditablePageDisabler", "AddPageIndexIdemButton"]
            },
            "wegas-scriptlibrary": {
                path: "js/widget/wegas-scriptlibrary-min.js",
                requires: ["button", "wegas-inputex-ace", "inputex-select", "wegas-cssloader"],
                ws_provides: "ScriptLibrary"
            },
            "wegas-fileexplorer": {
                path: "js/widget/wegas-fileexplorer-min.js",
                requires: ["treeview", "treeview-filter", "uploader-html5",
                    "wegas-menu", "wegas-progressbar", "wegas-fileexplorercss",
                    "wegas-content-entities", "wegas-tooltip"],
                ws_provides: "FileExplorer"
            },
            "wegas-fileexplorercss": {
                type: CSS
            },
            "wegas-gamemodel-i18n": {
                path: "js/widget/wegas-gamemodel-i18n-min.js",
                requires: ["wegas-layout-list", "wegas-script-helper", "wegas-tutorial", "wegas-react-form"],
                ws_provides: ["LanguagesManager", "TranslationEditor", "LanguageActivator"]
            },
            "wegas-gamemodel-extractor": {
                path: "js/widget/wegas-gamemodel-extractor-min.js",
                requires: ["wegas-modal", "wegas-plugin"],
                ws_provides: ["GmExtractorAction", "GmDefaulterAction"]
            },
            "wegas-model-propagator": {
                path: "js/widget/wegas-model-propagator-min.js",
                requires: ["wegas-modal", "wegas-plugin"],
                ws_provides: ["ModelPropagator", "WegasPropagatorModel", "WegasPropagatorAction"]
            },
            "wegas-find-and-replace": {
                path: "js/widget/wegas-find-and-replace-min.js",
                requires: ["wegas-modal", "wegas-plugin"],
                ws_provides: ["FindAndReplace", "FindAndReplaceWidget", "FindAndReplaceModal",
                    "FindAndReplaceAction", "FindAndReplaceEntityAction"]
            },
            "wegas-statemachineviewer": {
                path: "js/widget/wegas-statemachineviewer-min.js",
                requires: ["wegas-statemachineviewercss", "wegas-script-helper", "wegas-statemachine-entities",
                    "dd-constrain", "jsplumb-dom", "button", "event-mousewheel",
                    "slider", "wegas-panel-node"],
                ws_provides: "StateMachineViewer"
            },
            "wegas-statemachineviewercss": {
                type: CSS
            },
            "gallery-colorpickercss": {
                type: CSS
            },
            "wegas-dashboardcss": {
                type: CSS
            },
            "wegas-dashboard-modalscss": {
                type: CSS
            },
            "wegas-dashboard-modals": {
                path: "js/widget/wegas-dashboard-modals-min.js",
                requires: [
                    "promise",
                    "overlay",
                    "wegas-modal",
                    "wegas-console-custom",
                    "wegas-sendmail",
                    "wegas-dashboard-modalscss"
                ],
                ws_provides: ["ImpactsTeamModal", "EmailTeamModal"]
            },
            "wegas-dashboard": {
                path: "js/widget/wegas-dashboard-min.js",
                requires: [
                    "datatable",
                    "overlay",
                    "promise",
                    "widget-stdmod",
                    "wegas-dashboardcss",
                    "wegas-modal",
                    "wegas-dashboard-modals",
                    "font-awesome"
                ],
                ws_provides: ["Dashboard"]
            },
            "wegas-resetter": {
                path: "js/widget/wegas-resetter-min.js",
                ws_provides: "Resetter"
            },
            "wegas-sendmail": {
                path: "js/widget/wegas-sendmail-min.js",
                ws_provides: "SendMail"
            },
            "wegas-presencecss": {
                type: CSS
            },
            "wegas-presence": {
                path: "js/widget/wegas-presence-min.js",
                requires: ["overlay", "wegas-presencecss", "font-awesome", "escape"],
                ws_provides: "EditorChat"
            },
            "wegas-statistics": {
                path: "js/widget/wegas-statistics-min.js",
                requires: ["promise", "chartist"],
                ws_provides: "Statistics"
            }
        }
    });
    /*
     * MCQ
     */
    YUI.addGroup("wegas-mcq", {
        base: "./wegas-mcq/",
        root: "/wegas-mcq/",
        modules: {
            "wegas-mcq-entities": {
                requires: ["wegas-variabledescriptor-entities"],
                ws_provides: ["QuestionDescriptor", "QuestionInstance",
                    "WhQuestionDescriptor", "WhQuestionInstance"]
            },
            "wegas-mcq-tabview": {
                requires: ["wegas-responsive-tabview", "wegas-gallery",
                    "wegas-mcq-tabviewcss", "wegas-mcq-printcss", "wegas-mcq-view",
                    "wegas-mcq-entities", "wegas-i18n-mcq"],
                ws_provides: "MCQTabView"
            },
            "wegas-mcq-view": {
                requires: ["wegas-layout-absolute", "wegas-alerts", "wegas-gallery", "wegas-mcq-viewcss",
                    "wegas-mcq-printcss", "wegas-mcq-entities", "wegas-i18n-mcq",
                    "wegas-alerts", "wegas-text", "wegas-text-input",
                    "wegas-number-input", "wegas-layout-list"],
                ws_provides: ["MCQView", "WhView"]
            },
            "wegas-mcq-dialogview": {
                requires: ["wegas-layout-absolute", "wegas-alerts",
                    "wegas-mcq-entities", "wegas-i18n-mcq",
                    "wegas-alerts", "wegas-tooltip",
                    "wegas-layout-list", "wegas-dialogcss"],
                ws_provides: ["MCQDialogView"]
            },
            "wegas-mcq-selector": {
                requires: ["wegas-simpledialogue", "wegas-mcq-dialogview", "wegas-dialogcss", "wegas-tooltip",
                    "wegas-helper", "event-valuechange"],
                ws_provides: ["MCQSelector"]
            },
            "wegas-mcq-viewcss": {
                type: CSS
            },
            "wegas-mcq-tabviewcss": {
                type: CSS
            },
            "wegas-mcq-printcss": {
                type: CSS
            },
            "wegas-i18n-mcq-fr": {
                path: 'js/i18n/i18n-mcq-fr.js'
            },
            "wegas-i18n-mcq-de": {
                path: 'js/i18n/i18n-mcq-de.js'
            },
            "wegas-i18n-mcq-en": {
                path: 'js/i18n/i18n-mcq-en.js'
            },
            "wegas-i18n-mcq": {
                path: 'js/i18n/i18n-mcq.js',
                requires: ['wegas-i18n', 'wegas-i18n-global']
            }

        }
    });
    YUI.addGroup("wegas-react-form", {
        base: "./wegas-react-form/",
        root: "/wegas-react-form/",
        modules: {
            "wegas-react-form-binding": {
                path: "dist/bundle.js"
            },
            "wegas-react-form": {
                path: "dist/bundle.js",
                requires: ["roboto-font", "tinymce", "wegas-react-form-binding", "wegas-panel-fileselect"],
                ws_provides: "RForm"
            },
            // "wegas-react-manifest": {
            //     path: "dist/manifest.js"
            // },
            // "wegas-react-vendor":{
            //     path: "dist/vendor.js"
            // },
            "open-sans": {// Used in the react-based scenarist mode
                type: CSS,
                fullpath: "//fonts.googleapis.com/css?family=Open+Sans"
            }
        }
    });
    /**
     * Accounting
     */
    YUI.addGroup("wegas-accounting", {
        base: './wegas-accounting/',
        root: '/wegas-accounting/',
        modules: {
            "wegas-accounting-css": {
                type: CSS
            },
            "wegas-accounting-balance": {
                //path: 'js/wegas-accounting-balance-min.js',
                requires: ["wegas-accounting-css", "wegas-template"],
                ws_provides: ["BalanceSheet", "BalanceSheetWrapper"]
            }
        }
    });
    /**
     * PeerReview
     */
    YUI.addGroup("wegas-reviewing", {
        base: './wegas-reviewing/',
        root: '/wegas-reviewing/',
        modules: {
            "wegas-review-css": {
                type: CSS
            },
            "wegas-reviewing-entities": {
                requires: "wegas-entity",
                ws_provides: ["PeerReviewDescriptor", "PeerReviewInstance"]
            },
            "wegas-review-widgets": {
                requires: ["wegas-review-css",
                    "wegas-reviewing-entities",
                    "datatable",
                    "overlay",
                    "wegas-i18n-review",
                    "slider",
                    "wegas-teams-dashboard",
                    "wegas-layout-list",
                    "chartist",
                    "treeview",
                    "wegas-text-input",
                    "wegas-tabview"],
                ws_provides: ["ReviewVariableEditor",
                    "ReviewOrchestrator",
                    "ReviewTabView",
                    "ReviewTreeView",
                    "ReviewWidget",
                    "GradeInput",
                    "TextEvalInput",
                    "CategorizationInput"]
            },
            "wegas-i18n-review-de": {
                path: 'js/i18n/i18n-review-de-min.js'
            },
            "wegas-i18n-review-fr": {
                path: 'js/i18n/i18n-review-fr-min.js'
            },
            "wegas-i18n-review-en": {
                path: 'js/i18n/i18n-review-en-min.js'
            },
            "wegas-i18n-review": {
                path: 'js/i18n/i18n-review-min.js',
                requires: ['wegas-i18n', 'wegas-i18n-global']
            }
        }
    });
    /**
     * Survey
     */
    YUI.addGroup("wegas-survey", {
        base: './wegas-survey/',
        root: '/wegas-survey/',
        modules: {
            "wegas-survey-css": {
                type: CSS
            },
            "wegas-survey-entities": {
                requires: "wegas-entity",
                ws_provides: ["SurveyDescriptor", "SurveyInstance", "SurveySectionDescriptor", 
                    "SurveySectionInstance", "SurveyInputDescriptor", "SurveyInputInstance",
                    "SurveyNumberDescriptor", "SurveyTextDescriptor", "SurveyChoicesDescriptor"]
            },
            "wegas-survey-widgets": {
                requires: ["wegas-survey-css",
                    "wegas-survey-entities",
                    "wegas-i18n-survey",
                    "slider",
                    "wegas-text-input",
                    "wegas-panel"],
                ws_provides: [
                    "SurveyOrchestrator",
                    "SurveyWidget",
                    "SurveyNumberInput",
                    "SurveyTextInput",
                    "SurveyChoicesInput"]
            },
            "wegas-i18n-survey-de": {
                path: 'js/i18n/i18n-survey-de-min.js'
            },
            "wegas-i18n-survey-fr": {
                path: 'js/i18n/i18n-survey-fr-min.js'
            },
            "wegas-i18n-survey-en": {
                path: 'js/i18n/i18n-survey-en-min.js'
            },
            "wegas-i18n-survey": {
                path: 'js/i18n/i18n-survey-min.js',
                requires: ['wegas-i18n', 'wegas-i18n-global']
            }
        }
    });
    YUI.addGroup("wegas-others", {
        base: "./",
        root: "/",
        modules: {
            /** book CYOA **/
            "wegas-book": {
                path: "wegas-private/wegas-games/wegas-book/js/wegas-book-fight-min.js",
                requires: "wegas-book-dice",
                ws_provides: "Fight"
            },
            "wegas-book-dice": {
                path: "wegas-private/wegas-games/wegas-book/js/wegas-book-dice-min.js",
                ws_provides: "Dice"
            },
            /** Monopoly **/
            "wegas-monopoly-controller": {
                path: "wegas-private/wegas-games/wegas-monopoly/js/wegas-monopoly-controller-min.js",
                requires: ["wegas-monopoly-controller", "wegas-book-dice", "wegas-button"],
                ws_provides: "MonopolyController"
            },
            "wegas-monopoly-display": {
                path: "wegas-private/wegas-games/wegas-monopoly/js/wegas-monopoly-display-min.js",
                requires: "wegas-monopoly-display",
                ws_provides: "Monopolydisplay"
            },
            /** CEP **/
            "wegas-cep-folder": {
                path: "wegas-private/wegas-cep/js/wegas-cep-folder-min.js",
                requires: ["wegas-nodeformatter", "wegas-itemselector",
                    "wegas-panel", "wegas-simpledialogue"],
                ws_provides: "CEPFolder"
            },
            "wegas-urbactif": {
                path: "wegas-private/wegas-games/wegas-urbactif/urba-teamwidget.js",
                requires: ["wegas-button", "wegas-mcq-tabview", "wegas-layout-list", "wegas-i18n", "wegas-i18n-mcq-fr"],
                ws_provides: "TeamWidget"
            }
            /* Chess */
            //"wegas-chess": {
            //    path: "wegas-games/wegas-chess/js/wegas-chess-min.js",
            //    ws_provides: "ChessBoard",
            //    requires: "transition"
            //}
        }
    });
    /**
     * QRCode
     */
    YUI.addGroup("wegas-qrcode", {
        base: "./wegas-qrcode/",
        root: "/wegas-qrcode/",
        modules: {
            'wegas-qrcode-css': {
                type: CSS
            },
            "wegas-i18n-qrcode-fr": {
                path: 'js/i18n/i18n-qrcode-fr.js'
            },
            "wegas-i18n-qrcode-en": {
                path: 'js/i18n/i18n-qrcode-en.js'
            },
            'wegas-i18n-qrcode': {
                path: "js/i18n/i18n-qrcode.js",
                requires: ['wegas-i18n', 'wegas-i18n-global']
            },
            'wegas-qrcode-scanner': {
                path: "js/wegas-qrcode-scanner.js",
                requires: ['wegas-widget', 'qr-encoder', 'instascan', 'wegas-i18n-qrcode', 'wegas-qrcode-css'],
                ws_provides: "QrCodeScanner"
            }
        }
    });
    /* Other libraries */
    YUI.addGroup("wegas-libraries", {
        base: "./lib/",
        root: "/lib/",
        modules: {
            gauge: {
                path: "gauge-min.js"
            },
            gzip: {
                path: "zlib_and_gzip.min.js"
            },
            json_patch: {
                path: "jsonpatch/json-patch-duplex-min.js"
            },
            wikEdDiff: {
                path: "wikEdDiff-min.js"
            },
            // https://github.com/nimiq/qr-scanner, MIT
            "qr-scanner": {
                path: "qrcode/qr-scanner.min.js"
            },
            adapter: {
                path: "qrcode/adapter.min.js"
            },
            instascan: {
                path: "qrcode/instascan.min.js"
                    //requires: "adapter"
            },
            //https://github.com/davidshimjs/qrcodejs, Apache 2
            "qr-encoder": {
                path: "qrcode/qrcode.min.js"
            }

        }
    });
    /* Other libraries (that should not be combined) */
    YUI_config.groups.libraries = {
        async: false,
        combine: false,
        base: YUI_config.Wegas.base + "/lib/",
        root: "/lib/",
        modules: {
            "jsplumb-dom": {
                path: "jsPlumb/dom.jsPlumb-1.7.4-min.js"
            },
            esprima: {
                path: "esprima/esprima-min.js"
            },
            escodegen: {
                path: "escodegen/escodegen-min.js"
            },
            tinymce: {
                path: "tinymce/tinymce.min.js"
                    //fullpath: "//unpkg.com/tinymce@4.9.5/tinymce.js"
            },
            excanvas: {
                path: "excanvas/excanvas.compiled.js"
            },
            crafty: {
                path: "crafty/0.9.0/crafty-min.js"
            },
            ace: {
                async: false,
                path: "ace/src-min-noconflict/ace.js"
            },
            pusher: {
                fullpath: "//js.pusher.com/4.3.1/pusher.min.js"
            },
            googletranslate: {
                async: false,
                fullpath: "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
            },
            "font-awesome": {
                type: CSS,
                fullpath: "//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
            },
            "roboto-font": {
                type: CSS,
                fullpath: "//fonts.googleapis.com/css?family=Roboto:400,300,500"
            },
            "chart-js": {
                async: false,
                fullpath: "//cdnjs.cloudflare.com/ajax/libs/Chart.js/1.0.2/Chart.min.js"
            },
            "chartist-axistitle": {
                path: "chartist/chartist-plugin-axistitle.min.js"
            },
            "chartist": {
                fullpath: "//cdn.jsdelivr.net/chartist.js/latest/chartist.min.js",
                requires: ["wegas-chartistcss", "chartistcss"]
            },
            chartistcss: {
                fullpath: "//cdn.jsdelivr.net/chartist.js/latest/chartist.min.css",
                requires: ["wegas-chart-css"]
            }
        }
    };
    function loadModules(group) {
        var i, module, type, fileName, moduleName,
            modules = group.modules,
            allModules = [];
        for (moduleName in modules) { // Loop through all modules
            if (modules.hasOwnProperty(moduleName)) {
                allModules.push(moduleName); // Build a list of all modules

                module = modules[moduleName];
                type = module.type || "js";
                fileName = (type === CSS) ? moduleName.replace(/-?css$/gi, "") : moduleName;
                module.path = module.path || type + "/" + fileName + "-min." + type;
                if (type === CSS && YUI_config.debug) {
                    module.path = module.path.replace(/-min/gi, "");
                }

                if (module.ws_provides) { // Build a reverse index on which module provides what type (Wegas)
                    if (Y.Lang.isArray(module.ws_provides)) {
                        for (i = 0; i < module.ws_provides.length; i = i + 1) {
                            YUI_config.Wegas.modulesByType[module.ws_provides[i]] = moduleName;
                        }
                    } else {
                        YUI_config.Wegas.modulesByType[module.ws_provides] = moduleName;
                    }
                }
                if (module.ix_provides) { // Build a reverse index on which module provides what type (inputEx)
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

});
