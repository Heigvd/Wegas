/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/*global YUI, I18n*/
YUI.add('wegas-panel-pageloader', function(Y) {
    'use strict';
    /**
     * Open a panel with a page in it.
     * @type {OpenPanelPageloader}
     */
    Y.Plugin.OpenPanelPageloader = Y.Base.create(
        'wegas-panel-pageloader',
        Y.Plugin.Action,
        [],
        {
            execute: function() {
                var cfg = {
                    plugins: [{
                            "fn": "Injector"
                        }
                    ],
                    children: [
                        new Y.Wegas.PageLoader({
                            pageId: this.get('page'),
                            cssClass: 'wegas-panel-pageloader',
                            pageLoaderId: 'Modalpageloader' + Y.Lang.now()
                        })
                    ],
                    buttons: {},
                    width: this.get('width'),
                    height: this.get('height'),
                    modal: this.get('modal')
                };
                switch (this.get("style")) {
                    case "legacy":
                        cfg.buttons.footer = [{
                                name: 'proceed',
                                label: 'OK',
                                action: "exit"
                            }];
                        break;
                    case "modern":
                        cfg.buttons.header = [{
                                name: 'proceed',
                                label: '',
                                action: "exit"
                            }];
                        var title = "";
                        if (this.get("titleVariable")) {
                            title = this.get("titleVariable.evaluated").getValue();
                        } else if (this.get("title")) {
                            title = I18n.t(this.get("title"));
                        }

                        // always set the title even if it's empty -> flex-grow to align buttons
                        cfg.headerContent = "<span class='modern-title'>" + title + "<span>";
                        break;
                }
                var thePanel = new Y.Wegas.Panel(cfg).render();
                thePanel.get("contentBox").addClass("wegas-panel-" + this.get("style"));
                this.get("cssClass") && thePanel.get("contentBox").addClass(this.get("cssClass"));
                thePanel.get("contentBox").setAttribute("data-pageId", this.get("page"));
            }
        },
        {
            NS: 'wegaspanelpageloader',
            ATTRS: {
                page: {
                    type: 'string',
                    view: {
                        label: 'Popup page',
                        type: 'pageselect'
                    }
                },
                width: {
                    value: '80%',
                    type: 'string',
                    view: {
                        label: 'Width',
                        layout: 'shortInline'
                    }
                },
                height: {
                    value: '80%',
                    type: 'string',
                    view: {
                        label: 'Height',
                        layout: 'shortInline'
                    }
                },
                modal: {
                    value: true,
                    type: 'boolean',
                    view: {label: 'Modal'}
                },
                style: {
                    type: "string",
                    value: "legacy",
                    view: {
                        label: 'Style',
                        type: "select",
                        choices: [{
                                value: 'legacy'
                            },
                            {
                                value: 'modern'
                            }
                        ]
                    }
                },
                title: Y.Wegas.Helper.getTranslationAttr({
                    label: "Title",
                    type: "string",
                    visible: function(val, formVal) {
                        return formVal.cfg.style === "modern";
                    }
                }),
                titleVariable: {
                    type: 'object',
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    visible: function(val, formVal) {
                        return formVal.cfg.style === "modern";
                    },
                    view: {
                        type: "variableselect",
                        label: "Title Variable",
                        classFilter: ["StringDescriptor", "TextDescriptor"],
                        className: "wegas-advanced-feature"
                    }
                },
                cssClass: {
                    type: "string",
                    value: "",
                    view: {
                        label: 'CSS class'
                    }
                }
            }
        }
    );

    /**
     * Open a panel with a cfg in it.
     * @type {OpenPanelPageloader}
     */
    Y.Plugin.OpenPanelWithCfg = Y.Base.create(
        'wegas-panel-withcfg',
        Y.Plugin.Action,
        [],
        {
            execute: function() {
                var cfg = {
                    plugins: [{
                            "fn": "Injector"
                        }
                    ],
                    children: this.get("children"),
                    buttons: {},
                    width: this.get('width'),
                    height: this.get('height'),
                    modal: this.get('modal')
                };
                switch (this.get("style")) {
                    case "legacy":
                        cfg.buttons.footer = [{
                                name: 'proceed',
                                label: 'OK',
                                action: "exit"
                            }];
                        break;
                    case "modern":
                        cfg.buttons.header = [{
                                name: 'proceed',
                                label: '',
                                action: "exit"
                            }];
                        var title = "";
                        if (this.get("titleVariable")) {
                            title = this.get("titleVariable.evaluated").getValue();
                        } else if (this.get("title")) {
                            title = I18n.t(this.get("title"));
                        }

                        // always set the title even if it's empty -> flex-grow to align buttons
                        cfg.headerContent = "<span class='modern-title'>" + title + "<span>";
                        break;
                }
                var thePanel = new Y.Wegas.Panel(cfg).render();
                thePanel.get("contentBox").addClass("wegas-panel-" + this.get("style"));
                this.get("cssClass") && thePanel.get("contentBox").addClass(this.get("cssClass"));
            }
        },
        {
            NS: 'wegaspanelwithcfg',
            ATTRS: {
                children: {
                    type: 'array',
                    value: [],
                    view: {type: 'hidden'},
                    items: {
                        type: "object",
                        view: {type: 'hidden'},
                    }
                },
                width: {
                    value: '80%',
                    type: 'string',
                    view: {
                        label: 'Width',
                        layout: 'shortInline'
                    }
                },
                height: {
                    value: '80%',
                    type: 'string',
                    view: {
                        label: 'Height',
                        layout: 'shortInline'
                    }
                },
                modal: {
                    value: true,
                    type: 'boolean',
                    view: {label: 'Modal'}
                },
                style: {
                    type: "string",
                    value: "legacy",
                    view: {
                        label: 'Style',
                        type: "select",
                        choices: [{
                                value: 'legacy'
                            },
                            {
                                value: 'modern'
                            }
                        ]
                    }
                },
                title: Y.Wegas.Helper.getTranslationAttr({
                    label: "Title",
                    type: "string",
                    visible: function(val, formVal) {
                        return formVal.cfg.style === "modern";
                    }
                }),
                titleVariable: {
                    type: 'object',
                    getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                    visible: function(val, formVal) {
                        return formVal.cfg.style === "modern";
                    },
                    view: {
                        type: "variableselect",
                        label: "Title Variable",
                        classFilter: ["StringDescriptor", "TextDescriptor"],
                        className: "wegas-advanced-feature"
                    }
                },
                cssClass: {
                    type: "string",
                    value: "",
                    view: {
                        label: 'CSS class',
                        className: 'wegas-advanced-feature'
                    }
                }
            }
        }
    );

    /**
     * Open a panel with a cfg in it.
     * @type {OpenPanelPageloader}
     */
    Y.Plugin.ClosePanel = Y.Base.create('wegas-panel-closepanel', Y.Plugin.Action, [],
        {
            execute: function() {
                Y.later(0, this, function() {
                    var panelNode = this.get("host").get("boundingBox").ancestor(".wegas-panel");
                    var panel = Y.Widget.getByNode(panelNode);
                    panel && panel.destroy();
                });
            }
        }, {
        NS: 'closepanel',
        closePage: function(pageId) {
            var panelNode = Y.one(".wegas-panel-content[data-pageId=\"" + pageId + "\"]");
            var panel = Y.Widget.getByNode(panelNode);
            panel && panel.destroy();
        },
        ATTRS: {
        }
    });
});
