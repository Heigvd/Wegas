/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


YUI.add('wegas-find-and-replace', function(Y) {
    'use strict';

    var FindAndReplace,
        FindAndReplaceModal,
        FindAndReplaceAction;

    FindAndReplace = Y.Base.create("wegas-find-and-replace", Y.Widget,
        [Y.WidgetParent, Y.WidgetChild, Y.Wegas.Editable, Y.Wegas.Parent], {
        CONTENT_TEMPLATE: '<div>'
            + '<div class="the-form">'
            + '</div>'
            + '<div class="find-result"></div>'
            + '</div>',
        renderUI: function() {
            var cfg = {
                type: "object",
                properties: {
                    '@class': {
                        value: 'FindAndReplacePayload',
                        type: "string",
                        view: {
                            type: "hidden"
                        }
                    },
                    find: {
                        value: "",
                        type: "string",
                        view: {
                            label: "Find"
                        }
                    },
                    replace: {
                        type: "string",
                        value: "",
                        view: {
                            label: "Replace"
                        }
                    },
                    pretend: {
                        type: "boolean",
                        value: true,
                        view: {
                            type: "boolean",
                            label: "Simulate",
                            description: "Only show differences",
                            layout: 'shortInline'
                        }
                    },
                    matchCase: {
                        type: "boolean",
                        value: false,
                        view: {
                            type: "boolean",
                            label: "Match case",
                            layout: 'shortInline',
                            description: "case insensitive"
                        }
                    },
                    regex: {
                        type: "boolean",
                        value: false,
                        view: {
                            className: 'wegas-advanced-feature',
                            type: "boolean",
                            label: "Regular Expression",
                            layout: 'shortInline',
                            description: "Use $1, $2, ..., $n"
                        }
                    },
                    processVariables: {
                        type: "boolean",
                        value: true,
                        view: {
                            className: 'wegas-advanced-feature',
                            type: "boolean",
                            label: "Variables",
                            description: "Search and replace in variables",
                            layout: 'shortInline'
                        }
                    },
                    processPages: {
                        type: "boolean",
                        value: false,
                        view: {
                            className: 'wegas-advanced-feature',
                            type: "boolean",
                            label: "Pages",
                            description: "Search and replace in Pages",
                            layout: 'shortInline'
                        }
                    },
                    processStyles: {
                        type: "boolean",
                        value: false,
                        view: {
                            className: 'wegas-advanced-feature',
                            type: "boolean",
                            label: "Styles",
                            description: "Search and replace in styles",
                            layout: 'shortInline'
                        }
                    },
                    processScripts: {
                        type: "boolean",
                        value: false,
                        view: {
                            className: 'wegas-advanced-feature',
                            type: "boolean",
                            label: "Scripts",
                            description: "Search and replace in client/server scripts",
                            layout: 'shortInline'
                        }
                    },
                    languages: {
                        type: "object",
                        value: {},
                        properties: {},
                        visible: function(val, formValue) {
                            return formValue.processVariables;
                        },
                        view: {
                            className: "wegas-internal-feature",
                            label: "Languages"
                        }
                    }
                }
            };

            var languages = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel().get("languages");
            for (var l in languages) {
                var lang = languages[l];
                var code = lang.get("code");
                cfg.properties.languages.value[code] = true;
                cfg.properties.languages.properties[code] = {
                    type: "boolean",
                    view: {
                        label: code,
                        layout: 'shortInline'
                    }
                };
            }

            this.form = new Y.Wegas.RForm({
                values: {},
                cfg: cfg
            });
            this.form.render(this.get("contentBox").one(".the-form"));
        },
        destructor: function() {
            this.form && this.form.destroy();
        },
        execute: function() {
            var data = this.form.getValue();

            if (data.pretend) {
                this._execute();
            } else {
                Y.Wegas.Panel.confirm("This cannot be cancelled, are you sure ?", Y.bind(this._execute, this));
            }
        },
        _execute: function() {
            this.get("contentBox").one(".find-result").setContent("");
            var data = this.form.getValue();
            Y.Wegas.Facade.GameModel.sendRequest({
                request: "/" + this.get("gameModel").get("id") + "/FindAndReplace",
                cfg: {
                    method: "POST",
                    data: data,
                    headers: {
                        'SocketId': ""
                    }
                },
                on: {
                    success: Y.bind(function(e) {
                        Y.Wegas.Alerts.showNotification("Successfull", {
                            timeout: 2500
                        });
                        this.fire("replace:success");
                        this.get("contentBox").one(".find-result").setContent(e.response.entity);
                    }, this),
                    failure: Y.bind(function(e) {
                        var cb = this.get("contentBox").one(".find-result");
                        this.fire("replace:failure");
                        var events = e.serverResponse.get("events");
                        for (var i in events) {
                            var event = events[i];

                            if (event.get("@class") === "ExceptionEvent") {
                                for (var j in event.get("val").exceptions) {
                                    var exception = event.get("val").exceptions[j];
                                    cb.append("<p>" +
                                        exception.get("val").message
                                        + "</p>");
                                }
                            }
                        }
                    }, this)
                }
            });
        }
    }, {
        ATTRS: {
            gameModel: {
                type: "Object"
            }
        }
    });
    Y.Wegas.FindAndReplace = FindAndReplace;

    FindAndReplaceModal = Y.Base.create("wegas-find-and-replace-modal", Y.Wegas.Modal, [], {
        initializer: function() {
            var gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel(),
                actions;

            if (gameModel) {
                actions = [{
                        "types": ["primary"],
                        "label": "<span class='actionButton'>"
                            + " <i class='fa fa-search'></i> "
                            + "</span>"
                            + "Find & Replace</span>",
                        "do": function() {
                            this.get("modalBox").one(".actionButton").toggleClass("loading", true);
                            this.item(0).execute();
                        }
                    }, {
                        "label": 'Close',
                        "do": function() {
                            this.close();
                        }
                    }];
                this.set("title", "Find & Replace");
                this.set("icon", "search");
                this.add(new Y.Wegas.FindAndReplace({
                    "gameModel": gameModel
                }));
                this.set("actions", actions);
            }
        }
    }, {
        ATTRS: {
            mode: {
                type: "string",
                value: "Create"
            },
            title: {
                type: "string",
                value: "Find & Replace all text occurences"
            }
        }
    });
    Y.Wegas.FindAndReplaceModal = FindAndReplaceModal;

    var FindAndReplaceWidget = Y.Base.create("wegas-find-and-replace-widget", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        CONTENT_TEMPLATE: '<div>'
            + '<div class="widget">'
            + '</div>'
            + '<div class="actions">'
            + '<span class="execute">Find & Replace</span>'
            + '</div>'
            + '</div>',
        initializer: function() {
        },
        renderUI: function() {
            var gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel();
            if (gameModel) {
                this.findAndReplace = new Y.Wegas.FindAndReplace({
                    "gameModel": gameModel
                });
                this.findAndReplace.render(this.get("contentBox").one((".widget")));
            }
        },
        bindUI: function() {
            this.get("contentBox").delegate("click", this.execute, ".actions .execute", this);
        },
        destructor: function() {
            this.findAndReplace && this.findAndReplace.destroy();
        },
        execute: function() {
            this.findAndReplace.execute();
        }
    }, {
        ATTRS: {
        }
    });
    Y.Wegas.FindAndReplaceWidget = FindAndReplaceWidget;



    FindAndReplaceAction = Y.Base.create("wegas-find-and-replace-action", Y.Plugin.Action, [], {
        execute: function() {
            new Y.Wegas.FindAndReplaceModal({
                "on": {
                    "replace:success": function() {
                        this.get("modalBox").one(".actionButton").toggleClass("loading", false);
                        //this.close();
                    },
                    "replace:failure": function() {
                        this.get("modalBox").one(".actionButton").toggleClass("loading", false);
                    }
                }
            }).render();
        }
    }, {
        NS: "FindAndReplaceAction"
    });
    Y.Plugin.FindAndReplaceAction = FindAndReplaceAction;

});
