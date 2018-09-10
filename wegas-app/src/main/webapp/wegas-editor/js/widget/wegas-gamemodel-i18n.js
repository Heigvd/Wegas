/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


/* global I18n, tinyMCE, Promise */

/**
 * @fileOverview GameModel langueages management widgets
 * @author Maxence
 */
YUI.add('wegas-gamemodel-i18n', function(Y) {
    "use strict";
    var LanguagesManager,
        TranslationEditor,
        GameModelScriptUpgrader;
    LanguagesManager = Y.Base.create("wegas-i18n-manager", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        initializer: function() {
            this.handlers = {};
            this.plug(Y.Plugin.TranslationEditor);
            this.plug(Y.Plugin.Injector);
            this.showTable = {};
            var langs = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("languages"),
                i, count = 0;
            // show first to languages by default
            for (i in langs) {
                if (langs[i] && langs[i].get("id") && count < 2) {
                    this.showTable[langs[i].get("id")] = true;
                    count++;
                }
            }
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                if (this.handlers.hasOwnProperty(k)) {
                    this.handlers[k].detach();
                }
            }
        },
        renderUI: function() {
            this.header = new Y.Wegas.FlexList({
                cssClass: "wegas-i18n-manager--header",
                direction: 'horizontal'
            });

            this.title = new Y.Wegas.Text({
                cssClass: "wegas-i18n-manager--title",
                content: I18n.t("i18n.manager.title")
            });
            this.refreshButton = new Y.Button({
                label: "<i class=\"fa fa-refresh\"></i>"
            });
            this.addBtn = new Y.Wegas.Text({
                cssClass: "create-button",
                content: "<i class='fa fa-plus'></i>"
            });
            this.languages = new Y.Wegas.FlexList({
                cssClass: "wegas-i18n-manager--languages",
                direction: 'horizontal'
            });
            this.editor = new Y.Wegas.Text({
                cssClass: "wegas-i18n-manager--editor",
                content: "loading translation table <i class='fa fa-pulse fa-spinner'></i>"
            });
            this.header.add(this.title);
            this.header.add(this.refreshButton);
            this.add(this.header);
            this.add(this.addBtn);
            this.add(this.languages);
            this.add(this.editor);
        },
        syncUI: function() {
            var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                languages = gm.get("languages"),
                i, lang;
            this.languages.destroyAll();
            for (i in languages) {
                lang = languages[i];
                this.renderLanguage(lang.get("id"), lang.get("code"), lang.get("lang"), lang.get("active"));
            }

            var globals = [Y.Wegas.RForm.Script.getGlobals('getter'), Y.Wegas.RForm.Script.getGlobals('condition')];
            Promise.all(globals).then(Y.bind(function(globalsP) {
                this.globals = Y.mix(Y.mix({}, globalsP[0]), globalsP[1]);
                this.rebuildEditor();
            }, this));
        },
        renderLanguage: function(id, code, lang, active) {
            if (this.languages.size() && id) {
                this.languages.add(new Y.Wegas.Text({
                    content: "<span class='move-up fa fa-arrows-h' data-language-id='" + id + "'></>"
                }));
            }
            this.languages.add(new Y.Wegas.Text({
                content: "<div class='language" + (!id ? " unsaved" : "") + "' data-language-id='" + id + "'>" +
                    "<div class='form'>" +
                    "<div><label>Code:</label> <input size='5' class='language-code' value='" + code + "'></div>" +
                    "<div><label>Name:</label> <input class='language-name' value='" + lang + "'></div>" +
                    "<div><label>Active:</label> <input type='checkbox' class='language-active' " + (active ? "checked" : "") + "></div>" +
                    "<div class='tools'>" +
                    "  <span class='validate fa fa-check'></span>" +
                    "  <span class='cancel fa fa-times'></span>" +
                    "</div>" +
                    "</div>" +
                    (id ? "<div><label>Show:</label> <input type='checkbox' class='language-show' " + (this.showTable[id] ? "checked" : "") + "></div>" : "") +
                    "</div>"
            }));
        },
        bindUI: function() {
            this.get("contentBox").delegate("click", this.addLanguageClick, ".create-button i", this);
            this.languages.get("contentBox").delegate("change", this.toggleShow, ".language input.language-show", this);
            this.languages.get("contentBox").delegate(["input", "change"], this.languageChange, ".language .form input", this);
            this.languages.get("contentBox").delegate("click", this.languageUp, ".move-up", this);
            this.languages.get("contentBox").delegate("click", this.languageSave, ".language .validate", this);
            this.languages.get("contentBox").delegate("click", this.languageCancel, ".language .cancel", this);

            this.handlers.onRefresh = this.refreshButton.on("click", Y.bind(this.rebuildEditor, this));

            // scroll on TV select
            this.handlers.onEditEntity = Y.after("edit-entity:edit", function(e) {
                var anchor = this.get("contentBox").one(".anchor[data-entityid=\"" + e.entity._yuid + "\"]"),
                    node = this.get("contentBox").one(".node[data-entityid=\"" + e.entity._yuid + "\"] .node-name");
                this.get("contentBox").all(".highlight").removeClass("highlight");
                if (anchor) {
                    Y.Wegas.Helper.scrollIntoViewIfNot(anchor);
                }
                if (node) {
                    node.addClass("highlight");
                }
            }, this);
        },
        findLanguage: function(attr, needle, langToIgnore) {
            return Y.Array.find(Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("languages"), function(item) {
                return (!langToIgnore || item.get("id") !== langToIgnore.get("id")) && item.get(attr) === needle;
            });
        },
        toggleShow: function(e) {
            var langNode = e.target.ancestor(".language"),
                langId = langNode.getData("language-id");
            if (langId) {
                this.showTable[langId] = !this.showTable[langId];
                this.rebuildEditor();
            }
        },
        languageChange: function(e) {
            var langNode = e.target.ancestor(".language");
            langNode.addClass("unsaved");
        },
        languageUp: function(e) {
            this.moveLanguageUp(e.target.getData("language-id"));
        },
        languageSave: function(e) {
            var langNode = e.target.ancestor(".language"),
                lang = this.findLanguage("id", +langNode.getData("language-id")),
                code = langNode.one(".language-code").getDOMNode().value,
                active = langNode.one(".language-active").getDOMNode().checked,
                name = langNode.one(".language-name").getDOMNode().value;
            if (!code || !name) {
                this.showMessage("error", "Code or name missing");
            } else if (this.findLanguage("code", code, lang)) {
                this.showMessage("error", "Language code already exists");
            } else if (this.findLanguage("lang", name, lang)) {
                this.showMessage("error", "Language name already exists");
            } else {
                if (lang) {
                    // language already exists -> update
                    lang.set("code", code);
                    lang.set("lang", name);
                    lang.set("active", active);
                    this.updateLanguage(lang);
                } else {
                    // create new language
                    this.createNewLanguage(code, name, active);
                }
            }
            //langNode.addClass("unsaved");
        },
        languageCancel: function(e) {
            var langNode = e.target.ancestor(".language"),
                lang = this.findLanguage("id", +langNode.getData("language-id"));
            if (lang) {
                // revert changes
                langNode.removeClass("unsaved");
                langNode.one(".language-code").getDOMNode().value = lang.get("code");
                langNode.one(".language-name").getDOMNode().value = lang.get("lang");
                langNode.one(".language-active").getDOMNode().checked = lang.get("active");
            } else {
                // do not create new language
                langNode.remove(true);
            }
        },
        getLanguagesToEdit: function() {
            return Y.Array.filter(Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("languages"), Y.bind(function(lang) {
                return this.showTable[lang.get("id")];
            }, this));
        },
        rebuildEditor: function() {
            this.tree = this.genTree(Y.Wegas.Facade.GameModel.cache.getCurrentGameModel());
            //this.treeview.set("content", "<ul>" + this.genTreeviewMarkup(this.tree) + "</ul>");
            //this.treeview.syncUI();

            if (this.tree.containsOutdated && !this.upgrader) {
                this.upgrader = new Y.Wegas.GameModelScriptUpgrader();
                this.handlers.onGmUpgrade = this.upgrader.on("upgraded", Y.bind(this.rebuildEditor, this));
                this.add(this.upgrader, 1);
            } else {
                if (this.upgrader) {
                    this.handlers.onGmUpgrad && this.handlers.onGmUpgrad.detach();
                    this.upgrader.remove(true);
                    this.upgrader = null;
                }
            }

            this.editor.set("content", this.genEditorMarkup(this.tree, this.getLanguagesToEdit()));
            this.editor.syncUI();
        },
        mapASTObjectProperties: function(node) {
            if (node && node.type && node.type === "ObjectExpression") {
                var i, p, properties = {};

                if (node.properties) {
                    for (i in node.properties) {
                        p = node.properties[i];
                        properties[p.key.value] = p.value;
                    }
                }
                return properties;
            }
            return null;
        },
        extractTranslatableContents: function(script, key, entity, cfg) {
            var stack = [],
                sub,
                properties,
                content,
                goIn,
                index = 0,
                goOut;

            goIn = function(name, label) {
                if (sub) {
                    stack.push(sub);
                }
                sub = {
                    type: "Script",
                    nodeName: name,
                    nodeLabel: label,
                    hasTranslations: false,
                    containsOutdated: false,
                    translations: [],
                    children: []
                };
            };

            goOut = function() {
                var parent = stack.pop();
                if (parent) {
                    parent.children.push(sub);
                    parent.containsOutdated = parent.containsOutdated || sub.containsOutdated;
                    parent.hasTranslations = parent.hasTranslations || sub.hasTranslations;
                    sub = parent;
                }
            };
            // init root level
            goIn(key, cfg && cfg.view && cfg.view.label);

            Y.inputEx.WysiwygScript.visitAST(script, {
                onEnterFn: Y.bind(function(node, args) {
                    var method = Y.inputEx.WysiwygScript.parseMethod(node, this.globals);
                    if (method && method.method) {
                        goIn(method.methodName, method.methodName);
                    }

                    if (args && args.properties && args.properties["@class"]
                        && args.properties["@class"].value === "TranslatableContent") {
                        // expecting TranslatableContent
                        properties = this.mapASTObjectProperties(node);
                        if (!properties || !properties["@class"] || properties["@class"].value !== "TranslatableContent") {
                            // but no TranslatableContent found
                            sub.containsOutdated = true;
                        }
                    }

                    if (args && args.properties && args.properties["@class"]
                        && args.properties["@class"].value === "Attachment") {
                        // expecting attachment
                        properties = this.mapASTObjectProperties(node);
                        if (!properties || !properties["@class"] || properties["@class"].value !== "Attachment") {
                            // but no Attachement found
                            sub.containsOutdated = true;
                        }
                    }

                    if (node && node.type && node.type === "ObjectExpression") {
                        properties = this.mapASTObjectProperties(node);
                        if (properties) {
                            if (properties["@class"] && properties["@class"].value === "TranslatableContent") {
                                sub.hasTranslations = true;
                                content = {
                                    parentClass: entity.get("@class"),
                                    parentId: entity.get("id"),
                                    index: index,
                                    key: key,
                                    label: null,
                                    value: {
                                        astNode: node,
                                        translations: {},
                                        cfg: args
                                    }
                                };
                                index++;

                                properties["translations"].properties.forEach(function(p) {
                                    content.value.translations[p.key.value] = p.value.value;
                                });
                                sub.translations.push(content);
                                return false;
                            }
                        }
                    }
                    return true;
                }, this),
                onExitFn: Y.bind(function(node) {
                    var method = Y.inputEx.WysiwygScript.parseMethod(node, this.globals);
                    if (method && method.method) {
                        goOut();
                    }
                }, this),
                globals: this.globals
            });

            return sub;

        },
        genEditorMarkup: function(node, languages, level) {
            level = level || 0;
            var child, tr, markup = [], field, i;
            if (node.hasTranslations) {
                markup.push("<div class='node' data-entityid='", node.entityId, "' data-level='", level, "'>");
                markup.push("<span class='anchor' data-entityid='", node.entityId, "'></span>");

                if ((node.nodeLabel || node.nodeName) && ((node.translations && node.translations.length > 0) || node.type === 'Script')) {
                    markup.push("<div class='node-name'>", (node.nodeLabel || node.nodeName), " <span class='node-scriptalias'>(", node.nodeName, ")</span></div>");
                }

                if (node.translations && node.translations.length > 0) {
                    markup.push("<div class='translatedcontents'>");
                    for (var i in node.translations) {
                        tr = node.translations[i];
                        if (node.type === 'Script') {
                            // In Script translations
                            var cfg, type, label;
                            label = tr.key;
                            // fetch label from attr config
                            if (tr.value.cfg) {
                                cfg = tr.value.cfg;
                                if (cfg && cfg.properties && cfg.properties.translations
                                    && cfg.properties.translations && cfg.properties.translations.view) {
                                    type = cfg.properties.translations.view.type.replace("I18n", "");
                                    label = cfg.properties.translations.view.label;
                                }
                            }
                            var domNode = (type === "html" ? "div" : "span");
                            markup.push("<div class='translatedcontent'>");
                            for (var l in languages) {
                                markup.push("<div class='translation'>");
                                markup.push("<div class='translation-title'>");
                                markup.push("<span class='field-name'>", label, "</span>");
                                markup.push("<span class='translation-language'> [", languages[l].get("code"), "]</span>");
                                markup.push("</div>"); // /translation title
                                markup.push("<", domNode, " class='wegas-translation favorite-lang wegas-translation-inscript wegas-translation-", type, "' lang='", languages[l].get("refName"),
                                    "' data-index='", tr.index,
                                    "' data-parentClass='", tr.parentClass,
                                    "' data-parentId='", tr.parentId,
                                    "' data-fieldName='", tr.key,
                                    "' data-refName='", languages[l].get("refName"),
                                    "'>",
                                    "<span class='tools'>",
                                    "<span class='inline-editor-validate fa fa-check'></span>" +
                                    "<span class='inline-editor-cancel fa fa-times'></span>" +
                                    "</span>",
                                    "<", domNode, " class='wegas-translation--toolbar'></", domNode, ">" +
                                    "<", domNode, " tabindex='0'");

                                if (type === "wegasurl") {
                                    markup.push(" role='button'");
                                }
                                markup.push(" class='wegas-translation--value");
                                if (type === "wegasurl") {
                                    markup.push(" fa fa-folder-o");
                                }
                                markup.push("'>",
                                    tr.value.translations[languages[l].get("refName")],
                                    "</", domNode, ">", "</", domNode, ">");
                                markup.push("</div>");
                            }
                            markup.push("</div>");
                        } else {
                            field = tr.label || tr.key;
                            markup.push("<div class='translatedcontent'>");
                            for (var l in languages) {
                                markup.push("<div class='translation'>");
                                markup.push("<div class='translation-title'>");
                                markup.push("<span class='field-name'>", field, "</span>");
                                markup.push("<span class='translation-language'> [", languages[l].get("code"), "]</span>");
                                markup.push("</div>"); // /translation title
                                markup.push(I18n.t(tr.value, {
                                    lang: languages[l].get("refName"),
                                    inlineEditor: tr.type && tr.type.replace("I18n", "")
                                }));
                                markup.push("</div>"); // /translation
                            }
                            markup.push("</div>"); // /translatedcontent
                        }
                    }
                    markup.push("</div>"); // translatedcontens
                }

                markup.push("<div class='node-children'>");
                for (var i in node.children) {
                    child = node.children[i];
                    markup.push(this.genEditorMarkup(child, languages, level + 1));
                }
                markup.push("</div>");
                markup.push("</div>"); // /node
            }
            return markup.join("");
        },
        genTree: function(entity) {
            var attrs, key, attr, sub, i, child, children,
                node;
            if (entity instanceof Y.Wegas.persistence.Entity) {
                node = {
                    entityId: entity._yuid,
                    nodeName: entity.get("name"),
                    nodeLabel: entity.getEditorLabel(),
                    hasTranslations: false,
                    containsOutdated: false,
                    translations: [],
                    children: []
                };
                if (node.nodeLabel && entity.getIconCss) {
                    // prefix non emtpy label with icon if any
                    node.nodeLabel = "<i class='" + entity.getIconCss() + "'></i> " + node.nodeLabel;
                }

                attrs = entity.getAttrs();
                for (key in attrs) {
                    if (attrs.hasOwnProperty(key)) {
                        attr = attrs[key];
                        if (attr) {
                            sub = null;
                            var cfg = entity.getAttrCfgs()[key];
                            if ((!cfg["transient"] || key === "items") // transient "items" args is allowed
                                && (!cfg.visible || cfg.visible(attr, attrs))) { // check attre against visible method if any
                                if (Array.isArray(attr) ||
                                    // attr is an object but is not a wegasEntity -> process as a collection
                                        (Y.Lang.isObject(attr) && !(attr instanceof Y.Wegas.persistence.Entity))) {
                                    children = {
                                        nodeName: key,
                                        nodeLabel: key,
                                        hasTranslations: false,
                                        containsOutdated: false,
                                        translations: [],
                                        children: []
                                    };
                                    for (i in attr) {
                                        child = attr[i];
                                        sub = this.genTree(child);
                                        if (sub && sub.hasTranslations) {
                                            children.hasTranslations = true;
                                            children.children.push(sub);
                                        }
                                        if (sub && sub.containsOutdated) {
                                            children.containsOutdated = true;
                                        }
                                    }
                                    sub = children;
                                } else if (attr instanceof Y.Wegas.persistence.TranslatableContent) {
                                    // TranslatableContent found, register in node.translations
                                    node.hasTranslations = true;
                                    var type = null, label = null;
                                    if (cfg && cfg.properties && cfg.properties.translations
                                        && cfg.properties.translations && cfg.properties.translations.view) {
                                        type = cfg.properties.translations.view.type;
                                        label = cfg.properties.translations.view.label;
                                    }
                                    node.translations.push({
                                        type: type,
                                        label: label,
                                        key: key,
                                        value: attr
                                    });
                                } else if (attr instanceof Y.Wegas.persistence.Script) {
                                    // extract translatables from script content
                                    sub = this.extractTranslatableContents(attr, key, entity, cfg);
                                } else {
                                    sub = this.genTree(attr);
                                }

                                if (sub && (sub.hasTranslations || sub.containsOutdated)) {
                                    node.hasTranslations = node.hasTranslations || sub.hasTranslations;
                                    node.containsOutdated = node.containsOutdated || sub.containsOutdated;
                                    node.children.push(sub);
                                }
                            }
                        }
                    }

                }
            }

            return node;
        },
        addLanguageClick: function(e) {
            this.renderLanguage("", "", "", false);
        },
        createNewLanguage: function(code, name, active) {
            Y.Wegas.Facade.GameModel.sendRequest({
                request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + "/I18n/Lang",
                cfg: {
                    method: "POST",
                    data: {
                        "@class": "GameModelLanguage",
                        code: code,
                        lang: name,
                        active: active
                    }
                },
                on: {
                    success: Y.bind(this.syncUI, this),
                    failure: Y.bind(this.syncUI, this)
                }
            });
        },
        updateLanguage: function(language) {
            Y.Wegas.Facade.GameModel.sendRequest({
                request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + "/I18n/Lang",
                cfg: {
                    method: "PUT",
                    data: language.toObject()
                },
                on: {
                    success: Y.bind(this.syncUI, this),
                    failure: Y.bind(this.syncUI, this)
                }
            });
        },
        moveLanguageUp: function(langId) {
            Y.Wegas.Facade.GameModel.sendRequest({
                request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + "/I18n/Lang/" + langId + "/Up",
                cfg: {
                    method: "PUT"
                },
                on: {
                    success: Y.bind(this.syncUI, this),
                    failure: Y.bind(this.syncUI, this)
                }
            });
        }
    }, {
        EDITORNAME: "Languages Manager",
        ATTRS: {}
    });
    Y.Wegas.LanguagesManager = LanguagesManager;
    TranslationEditor = Y.Base.create('wegas-translation-editor', Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            this.handlers = {};
            var hostCB = this.get("host").get("contentBox");
            hostCB.delegate("focus", this.setupEditor, ".wegas-translation.favorite-lang .wegas-translation--value", this);
            hostCB.delegate("click", this.selectFile, ".wegas-translation-wegasurl.favorite-lang .wegas-translation--value", this);
            hostCB.delegate("keydown", this.selectFileOnKeyDown, ".wegas-translation-wegasurl.favorite-lang .wegas-translation--value", this);

            hostCB.delegate("click", this.save, ".wegas-translation.favorite-lang .inline-editor-validate", this);
            hostCB.delegate("key", this.ctrlSave, 'down:83+ctrl', ".wegas-translation.favorite-lang .wegas-translation--value", this);
            hostCB.delegate("key", this.ctrlSave, 'down:83+meta', ".wegas-translation.favorite-lang .wegas-translation--value", this);
            //hostCB.delegate("key", this.selectAllInSpan, 'down:65+ctrl', ".wegas-translation-string span[contenteditable]", this);
            hostCB.delegate("click", this.cancel, ".wegas-translation.favorite-lang .inline-editor-cancel", this);
            this.contents = {};
            //hostCB.delegate("blur", this.onBlurString, ".wegas-translation-blur.favorite-lang", this);
        },
        _getCfgFromEvent: function(e) {
            var node, trId, refName;
            if (e.target && e.target.ancestor) {
                node = e.currentTarget.ancestor(".wegas-translation");
            } else {
                node = Y.one("#" + e.target.id).ancestor(".wegas-translation");
            }

            refName = node.getData("refname");
            if (node.hasClass("wegas-translation-inscript")) {
                var cfg = {
                    type: "inscript",
                    node: node,
                    refName: refName,
                    parentClass: node.getData('parentClass'),
                    parentId: node.getData('parentId'),
                    index: node.getData('index'),
                    fieldName: node.getData('fieldName')
                };
                cfg.key = cfg.parentClass + "-" + cfg.parentId + "-" + cfg.fieldName + "#" + cfg.index + ":" + refName;
                return cfg;
            } else {
                trId = node.getData("trid");
                return {
                    type: 'std',
                    node: node,
                    trId: trId,
                    refName: refName,
                    key: refName + "-" + trId
                };
            }
        },
        _onHtmlChange: function(e) {
            var newContent = this.toInjectorStyle(this.editor.getContent()),
                cfg = this._getCfgFromEvent(e),
                updated = newContent !== this.contents[cfg.key];
            cfg.node.toggleClass("unsaved", updated);
        },
        _onHtmlBlur: function(e) {
            /*if (this.editor) {
             //this.removeEditor();
             }*/
        },
        ctrlSave: function(e) {
            e.halt(true);
            this.save(e);
        },
        save: function(e) {
            var cfg = this._getCfgFromEvent(e),
                rawValue = cfg.node.one(".wegas-translation--value").getContent(),
                newValue = this.toInjectorStyle(rawValue);
            if (cfg.type === "inscript") {
                this.saveInScriptTranslation(cfg, newValue);
            } else {
                this.saveTranslation(cfg, newValue);
            }
            // save wegas-translation--value 
        },
        cancel: function(e) {
            var cfg = this._getCfgFromEvent(e);
            this.contents[cfg.key];
            // reset wegas-translation--value to initial one and remove tools
            cfg.node.one(".wegas-translation--value").setContent(this.contents[cfg.key]);
            cfg.node.removeClass("unsaved");
        },
        saveInScriptTranslation: function(cfg, translation) {
            Y.Wegas.Facade.GameModel.sendRequest({
                request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + "/I18n/ScriptTr",
                cfg: {
                    method: "PUT",
                    data: {
                        "@class": "ScriptUpdate",
                        parentClass: cfg.parentClass,
                        parentId: cfg.parentId,
                        fieldName: cfg.fieldName,
                        refName: cfg.refName,
                        index: cfg.index,
                        value: translation
                    }
                },
                on: {
                    success: Y.bind(this.inScriptSuccess, this, cfg, translation),
                    failure: Y.bind(this.inScriptError, this, cfg, translation)
                }
            });
        },
        inScriptSuccess: function(cfg, translation, response) {
            Y.log("SUCCESS");
            this.contents[cfg.key] = translation;
            cfg.node.removeClass("unsaved");
            this.removeEditor();
        },
        inScriptError: function() {
            Y.log("ERROR");
        },
        saveTranslation: function(cfg, translation) {
            Y.Wegas.Facade.GameModel.sendRequest({
                request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + "/I18n/Tr/" + cfg.refName + "/" + cfg.trId,
                cfg: {
                    method: "PUT",
                    data: translation
                },
                on: {
                    success: Y.bind(this.success, this, cfg),
                    failure: Y.bind(this.error, this, cfg)
                }
            });
        },
        success: function(cfg, response) {
            Y.log("SUCCESS");
            this.contents[cfg.key] = response.response.entity.get("translations")[cfg.refName];
            cfg.node.removeClass("unsaved");
            this.removeEditor();
        },
        error: function() {
            Y.log("ERROR");
        },
        toInjectorStyle: function(content) {
            // remove yui ids
            var root = document.createElement('div');
            root.innerHTML = content;
            var yuiId = root.querySelectorAll('[id^="yui_"]');
            for (var n = 0; n < yuiId.length; n += 1) {
                yuiId[n].removeAttribute('id');
            }

            return root.innerHTML
                .replace(
                    new RegExp(
                        '((src|href)="[^"]*/rest/File/GameModelId/[^"]*/read([^"]*)")',
                        'gi'
                        ),
                    'data-file="$3"'
                    ) // Replace absolute path with injector style path (old version)
                .replace(
                    new RegExp(
                        '((src|href)="[^"]*/rest/GameModel/[^"]*/File/read([^"]*)")',
                        'gi'
                        ),
                    'data-file="$3"'
                    ); // Replace absolute path with injector style path
        },
        removeEditor: function() {
            if (this.editor) {
                this.editor.remove();
                this.editor.destroy();
            }
            this.currentEditorKey = undefined;
            Y.log("Destroy editor ");
        },
        selectFileOnKeyDown: function(event) {
            if (event.type === 'keydown') {
                if (event.keyCode === 13 || event.keyCode === 32) {
                    this.selectFile(event);
                    event.preventDefault();
                }
            }
        },
        selectFile: function(e) {
            var cfg = this._getCfgFromEvent(e);
            if (cfg.node.hasClass("wegas-translation-wegasurl")) {
                Y.log("Select File for " + cfg.key);
                if (this.contents[cfg.key] === undefined) {
                    // save initial values
                    this.contents[cfg.key] = this.toInjectorStyle(cfg.node.one(".wegas-translation--value").getHTML());
                }

                var filepanel = new Y.Wegas.FileSelect();
                filepanel.on('*:fileSelected', Y.bind(function(e, path) {
                    e.halt(true);
                    filepanel.destroy();
                    var updated = path !== this.contents[cfg.key];
                    cfg.node.toggleClass("unsaved", updated);
                    cfg.node.one(".wegas-translation--value").setHTML(path)
                }, this));
            }
        },
        setupEditor: function(e) {
            var cfg = this._getCfgFromEvent(e);
            if (this.editor) {
                if (cfg.key === this.currentEditorKey) {
                    return;
                }
                this.removeEditor();
            }

            if (!cfg.node.hasClass("wegas-translation-wegasurl")) {
                Y.log("SetupEditor for " + cfg.key);
                this.currentEditorKey = cfg.key;
                if (this.contents[cfg.key] === undefined) {
                    // save initial values
                    this.contents[cfg.key] = this.toInjectorStyle(cfg.node.one(".wegas-translation--value").getHTML());
                }

                var tinyConfig = {
                    inline: true,
                    selector: "#" + cfg.node.get("id") + " .wegas-translation--value",
                    browser_spellcheck: true,
                    plugins: [
                        'autolink link image lists code media table',
                        'paste advlist textcolor',
                            // textcolor wordcount autosave contextmenu
                            // advlist charmap print preview hr anchor pagebreak spellchecker
                            // directionality
                    ],
                    external_plugins: {
                        "dynamic_toolbar": Y.Wegas.app.get("base") +
                            "wegas-editor/js/plugin/wegas-tinymce-dynamictoolbar.js"
                    },
                    toolbar1: 'bold italic bullist | link image media  addToolbarButton', /* 'code' not working!!! */
                    toolbar2: 'forecolor backcolor underline alignleft aligncenter alignright alignjustify table',
                    toolbar3: 'fontsizeselect styleselect',
                    //selection_toolbar: 'bold italic bullist | quicklink quickimage media ',
                    fixed_toolbar_container: "#" + cfg.node.get("id") + " .wegas-translation--toolbar",
                    // formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect
                    // fontsizeselect styleselect spellchecker template
                    // contextmenu: 'link image inserttable | cell row
                    // column deletetable | formatselect forecolor',
                    paste_preprocess: function(plugin, args) {
                        var root = document.createElement('div'),
                            editorContainer;
                        root.innerHTML = args.content;
                        editorContainer = root.querySelector("[contenteditable=\"true\"]");
                        if (editorContainer) {
                            args.content = editorContainer.innerHTML;
                        }

                    },
                    paste_postprocess: function(plugin, args) {
                    },
                    menubar: false,
                    resize: 'both',
                    max_height: 500,
                    statusbar: true,
                    branding: false,
                    relative_urls: false,
                    toolbar_items_size: 'small',
                    hidden_tootlbar: [2, 3],
                    file_browser_callback: Y.bind(this.onFileBrowserClick, this),
                    image_advtab: true,
                    content_css: [
                        '//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
                        Y.Wegas.app.get('base') + "wegas-editor/css/wegas-tinymce-editor.css",
                    ],
                    style_formats: [
                        {
                            // Style formats
                            title: 'Title 1',
                            block: 'h1',
                        },
                        {
                            title: 'Title 2',
                            block: 'h2',
                            // styles : {
                            //    color : '#ff0000'
                            // }
                        },
                        {
                            title: 'Title 3',
                            block: 'h3',
                        },
                        {
                            title: 'Normal',
                            inline: 'span',
                        },
                        {
                            title: 'Code',
                            // icon: 'code',
                            block: 'code',
                        },
                    ],
                    formats: {}
                };
                if (cfg.node.hasClass("wegas-translation-string")) {
                    tinyConfig.theme = 'inlite';
                }

                var extraButtons = Y.Wegas.Config.TinyExtraButtons;

                if (extraButtons) {
                    /* config example :
                     Y.namespace("Wegas.Config").TinyExtraButtons = {
                     className : "off-game",
                     cssIcon: "fa fa-asterisk",
                     tooltip : "off-game information style"
                     },
                     danger: {
                     block: "div",
                     className : "danger-message",
                     cssIcon: "fa fa-warning",
                     tooltip : "danger message style"
                     }};
                     */
                    var toolbar = tinyConfig.toolbar1.split(" ");
                    toolbar.pop(); // remove addToolbarButton
                    toolbar.push("|");

                    var initFunctions = [];

                    for (var name in extraButtons) {
                        var btnCfg = extraButtons[name];
                        tinyConfig.formats[name] = {
                            attributes: {
                                'class': btnCfg.className
                            }
                        };

                        if (btnCfg.block) {
                            tinyConfig.formats[name].block = btnCfg.block;
                        } else if (btnCfg.inline) {
                            tinyConfig.formats[name].inline = btnCfg.inline;
                        } else {
                            tinyConfig.formats[name].inline = "span";
                        }

                        toolbar.push(name);

                        initFunctions.push({
                            name: name,
                            config: btnCfg,
                            'function':
                                function(editor, name, btnCfg) {
                                    editor.addButton(name, {
                                        icon: "x " + btnCfg.cssIcon,
                                        stateSelector: "." + btnCfg.className,
                                        tooltip: btnCfg.tooltip,
                                        onclick: function(e) {
                                            tinymce.activeEditor.formatter.toggle(name);
                                        }
                                    });
                                }
                        });

                        tinyConfig.setup = Y.bind(function(editor) {
                            this.editor = editor;
                            editor.on('change', Y.bind(this._onHtmlChange, this));
                            editor.on('keyUp', Y.bind(this._onHtmlChange, this));
                            editor.on('blur', Y.bind(this._onHtmlBlur, this)); // text input & ctrl-related operations
                            editor.on('init', Y.bind(function() {
                                this.editor = editor;
                                this.editor.fire("focus");
                                this.editor.focus();
                            }, this));
                            //this.editor.focus();
                            //this.editor.targetElm.click();


                            // call each initFunction
                            for (var i in initFunctions) {
                                initFunctions[i].function.call(editor, editor,
                                    initFunctions[i].name, initFunctions[i].config);
                            }
                        }, this);
                    }

                    // rebuilf toolbar1
                    toolbar.push("|");
                    toolbar.push("addToolbarButton");
                    tinyConfig.toolbar1 = toolbar.join(" ");
                }
            } else {
                tinyConfig.setup = Y.bind(function(editor) {
                    this.editor = editor;
                    editor.on('change', Y.bind(this._onHtmlChange, this));
                    editor.on('keyUp', Y.bind(this._onHtmlChange, this));
                    editor.on('blur', Y.bind(this._onHtmlBlur, this)); // text input & ctrl-related operations
                    editor.on('init', Y.bind(function() {
                        this.editor = editor;
                        this.editor.fire("focus");
                        this.editor.focus();
                    }, this));
                    //this.editor.focus();
                    //this.editor.targetElm.click();
                }, this)
            }
            tinyMCE.init(tinyConfig);
        },
        onFileBrowserClick: function(field_name, url, type, win) {
            this.filePanel = new Y.Wegas.FileSelect();
            this.filePanel.after("*:fileSelected", Y.bind(function(e, path) {
                e.stopImmediatePropagation();
                e.preventDefault();
                var win = this.filePanel.win,
                    field_name = this.filePanel.field_name,
                    targetInput = win.document.getElementById(field_name);
                targetInput.value = Y.Wegas.Facade.File.getPath() + path; // update the input field

                if (typeof (win.ImageDialog) !== "undefined") { // are we an image browser
                    if (win.ImageDialog.getImageData) { // we are, so update image dimensions...
                        win.ImageDialog.getImageData();
                    }

                    if (win.ImageDialog.showPreviewImage) { // ... and preview if necessary
                        win.ImageDialog.showPreviewImage(Wegas.Facade.File.getPath() + path);
                    }
                }
                if (win.Media) { // If in an editor window
                    win.Media.formToData("src"); // update the data
                }
                this.filePanel.destroy();
            }, this));
            this.filePanel.win = win;
            this.filePanel.field_name = field_name;
            return false;
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
        }
    }, {
        NS: 'TranslationEditor',
        ATTRS: {
        }
    });
    Y.Plugin.TranslationEditor = TranslationEditor;




    GameModelScriptUpgrader = Y.Base.create("wegas-i18n-upgrader", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        initializer: function() {
            this.handlers = {};
            this.publish('upgraded', {
                emitFacade: true
            });
        },
        renderUI: function() {
            this.text = new Y.Wegas.Text({
                content: "GameModel still contains non-internationalised impacts! Click to upgrade"
            });
            this.add(this.text);
            this.upgradeBtn = new Y.Button({
                label: "<i class=\"fa fa-3x fa-level-up\"></i>"
            });
            this.add(this.upgradeBtn);
        },
        bindUI: function() {
            this.handlers.onUpgrade = this.upgradeBtn.on("click", this.execute, this);
        },
        processScript: function(entity, attrName, attr, globals) {
            var toUpgrade = [],
                payload = [],
                content = attr.get("content"),
                i, node, newContent, before, after;
            Y.inputEx.WysiwygScript.visitAST(content, {
                onEnterFn: Y.bind(function(node, args) {
                    if (args && args.properties && args.properties["@class"]
                        && args.properties["@class"].value === "TranslatableContent") {

                        if (node && node.type && node.type === "Literal") {
                            toUpgrade.unshift({
                                type: "TR",
                                node: node
                            });
                        }
                    }
                    if (args && args.properties && args.properties["@class"]
                        && args.properties["@class"].value === "Attachment") {

                        if (node && node.type && node.type === "Literal") {
                            toUpgrade.unshift({
                                type: "Attachment",
                                node: node
                            });
                        }
                    }
                    return true;
                }, this),
                globals: globals
            });

            if (toUpgrade.length) {
                Y.log("Entity: " + entity.get("@class") + "#" + entity.get("id") + "::" + attrName + ": ");
                Y.log("CONTENT:" + content);
                // sort by range, last first to not alter first ranges location
                toUpgrade.sort(function(a, b) {
                    if (a && a.node && a.node.range &&
                        b && b.node && b.node.range) {
                        return b.node.range[0] - a.node.range[0];
                    }
                    return 0;
                });
                for (i in toUpgrade) {
                    node = toUpgrade[i].node;
                    // new argument value
                    newContent = {
                        "@class": "TranslatableContent",
                        "translations": {
                            def: JSON.parse(content.substring(node.range[0], node.range[1]))
                        }
                    };
                    if (toUpgrade[i].type === "Attachment") {
                        newContent = {
                            "@class": "Attachment",
                            file: newContent
                        };
                    }
                    // script before argument
                    before = content.substring(0, node.range[0]);
                    // script after argument
                    after = content.substring(node.range[1]);
                    // combine before, newArg and after
                    content = before + JSON.stringify(newContent) + after;
                }

                Y.log("NEW CONTENT:" + content);
                // all args processed
                payload.push({
                    "@class": "ScriptUpdate",
                    "parentClass": entity.get("@class"),
                    "parentId": entity.get("id"),
                    "fieldName": attrName,
                    "value": content
                });
            }
            return payload;
        },
        saveScripts: function(payload) {
            if (payload.length) {
                Y.Wegas.Facade.GameModel.sendRequest({
                    request: '/' + Y.Wegas.Facade.GameModel.get('currentGameModelId') + "/I18n/ScriptBatchUpdate",
                    cfg: {
                        method: "PUT",
                        data: payload
                    },
                    on: {
                        success: Y.bind(this.batchSuccess, this),
                        failure: Y.bind(this.batchFailure, this)
                    }
                });
            }
        },
        batchSuccess: function(e) {
            this.fire("upgraded");
        },
        batchFailure: function(e) {
            alert("SOMETHING WENT WRONG");
        },
        execute: function() {
            var globals = [Y.Wegas.RForm.Script.getGlobals('getter'),
                Y.Wegas.RForm.Script.getGlobals('condition')];
            Promise.all(globals).then(Y.bind(function(globals) {
                var scriptToUpdate = this.extractScripts(Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                    Y.mix(Y.mix({}, globals[0]), globals[1]));
                this.saveScripts(scriptToUpdate);
            }, this));
        },
        extractScripts: function(entity, globals) {
            var attrs, key, attr, sub, i, child, children,
                results = [];
            if (entity instanceof Y.Wegas.persistence.Entity) {
                attrs = entity.getAttrs();
                for (key in attrs) {
                    if (attrs.hasOwnProperty(key)) {
                        attr = attrs[key];
                        if (attr) {
                            sub = null;
                            var cfg = entity.getAttrCfgs()[key];
                            if ((!cfg["transient"] || key === "items") // transient "items" args is allowed
                                && (!cfg.visible || cfg.visible(attr, attrs))) { // check attre against visible method if any
                                if (Array.isArray(attr) ||
                                    // attr is an object but is not a wegasEntity -> process as a collection
                                        (Y.Lang.isObject(attr) && !(attr instanceof Y.Wegas.persistence.Entity))) {
                                    for (i in attr) {
                                        child = attr[i];
                                        results = results.concat(this.extractScripts(child, globals));
                                    }
                                    sub = children;
                                } else if (attr instanceof Y.Wegas.persistence.Script) {
                                    results = results.concat(this.processScript(entity, key, attr, globals));
                                    // 
                                } else {
                                    results = results.concat(this.extractScripts(attr, globals));
                                }
                            }
                        }
                    }

                }
            }
            return results;
        },
        destructor: function() {
            var k;
            for (k in this.handlers) {
                if (this.handlers.hasOwnProperty(k)) {
                    this.handlers[k].detach();
                }
            }
        }
    }, {
        EDITORNAME: "Languages Manager",
        ATTRS: {}
    });
    Y.Wegas.GameModelScriptUpgrader = GameModelScriptUpgrader;
});
