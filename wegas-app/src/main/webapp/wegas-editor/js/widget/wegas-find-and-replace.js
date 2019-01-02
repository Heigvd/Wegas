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
            this.form = new Y.Wegas.RForm({
                values: {},
                cfg: {
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
                                label: "Pretend",
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
                                description: "Use $1, $2, ..., $n to use captured groups"
                            }
                        }
                    }
                }
            });
            this.form.render(this.get("contentBox").one(".the-form"));
        },
        execute: function() {
            this.get("contentBox").one(".find-result").setContent("");
            Y.Wegas.Facade.GameModel.sendRequest({
                request: "/" + this.get("gameModel").get("id") + "/FindAndReplace",
                cfg: {
                    method: "POST",
                    data: this.form.getValue()
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
                            + "<span class='fa-stack fa-1g'>"
                            + "  <i class='fa fa-search fa-stack-1x'></i> "
                            + "  <i class='fa fa-pencil fa-stack-1x'></i> "
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