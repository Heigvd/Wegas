/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @fileOverview 
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-flexitests-controller", function(Y) {
    Y.Wegas.FlexitestsController = Y.Base.create("wegas-flexitests-controller", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable, Y.WidgetChild], {
        initializer: function() {
            this.leftElement = null;
            this.rightElement = null;
            this.centerElement = null;
            this.maxSize = 0;
            this.awaitedKeypress = this.get("keyPress");
            this.ongoing = false;
            this.currentQuestionId = -1;
            this.questionToDo = [];
            this.startTime = null;
            this.events = [];
        },
        renderUI: function() {
            this.get("contentBox").append("<div class='feedback'></div>");
            this.get("contentBox").append("<div class='input'></div>");
        },
        bindUI: function() {
            this.get("root").set("tabIndex", -1);
            this.events.push(this.get("root").get("boundingBox").after("keypress", function(e) {
                if (this.awaitedKeypress && this.ongoing) {
                    this.keyPressed(String.fromCharCode(e.keyCode));
                }
            }, this));
            this.after("*:currentLoadingChange", function(e) {
                var noready = false;
                for (var i in e.newVal) {
                    noready = (noready || e.newVal[i]);
                    if (noready) {
                        break;
                    }
                }
                if (!noready) {
                    this.startStimuli();
                }
            });
        },
        syncUI: function() {
            this.leftElement = this.getWidgetById("leftElement");
            this.rightElement = this.getWidgetById("rightElement");
            this.centerElement = this.getWidgetById("centerElement");
            this.maxSize = Math.max(this.leftElement.size(), this.rightElement.size(), this.centerElement.size());
            for (var i = 0; i < this.maxSize; i += 1) {
                this.questionToDo[i] = i;
            }
            this.mask();
            this.next();
        },
        keyPressed: function(key) {
            var awaited;
            this.awaitedKeypress = false;
            switch (key) {
                case "f":
                    awaited = this.leftElement.getActiveElement().get("response");
                    break;
                case "j":
                    awaited = this.rightElement.getActiveElement().get("response");
                    break;
                default:
                    this.awaitedKeypress = true;
                    return;
            }

            this.responseGiven(awaited);
        },
        responseGiven: function(response) {
            var responseTime = Y.Lang.now() - this.startTime;
            if (this.centerElement.getActiveElement().get("response") === response) {
                this.success(responseTime + " ms");
            } else {
                this.error(responseTime + " ms");
            }
            if (this.questionToDo.length === 0) {
                this.mask();
                alert("Test finished");
            } else {
                this.next();
            }
        },
        next: function() {
            this.mask();
            this.set("currentLoading", {"left": true, "center": true, "right": true});
            this.currentQuestionId = this.generateNextId();
            this.centerElement.set("element", +this.currentQuestionId);
            this.leftElement.set("element", +this.currentQuestionId);
            this.rightElement.set("element", +this.currentQuestionId);
            Y.later(this.get("fixPoint"), this, this.createLoadingEvent);
        },
        createLoadingEvent: function() {
            this.centerElement.getActiveElement().onceAfter("loaded", function(e) {
                this.set("currentLoading.center", false);
            }, this);
            this.leftElement.getActiveElement().onceAfter("loaded", function(e) {
                this.set("currentLoading.left", false);
            }, this);
            this.rightElement.getActiveElement().onceAfter("loaded", function(e) {
                this.set("currentLoading.right", false);
            }, this);
        },
        generateNextId: function() {
            return this.get("random") ?
                    this.questionToDo.splice(Math.round(Math.random() * (this.questionToDo.length - 1)), 1)[0] :
                    this.questionToDo.shift();
        },
        startStimuli: function() {
            this.awaitedKeypress = this.get("keyPress");
            this.get("root").get("boundingBox").focus();
            this.restartTimer(this.leftElement);
            this.restartTimer(this.rightElement);
            this.restartTimer(this.centerElement);
            Y.later(3, this, this.unmask);
            this.ongoing = true;
        },
        restartTimer: function(widget) {
            if (widget.showafter) {
                widget.showafter.start();
            }
            if (widget.hideafter) {
                widget.hideafter.start();
            }
        },
        mask: function() {
            this.get("root").showOverlay();
        },
        unmask: function() {
            this.get("root").hideOverlay();
            this.startTime = Y.Lang.now();
        },
        success: function(message) {
            if (this.get("feedback")) {
                this.showMessage("success", message || "", 500);
            }
        },
        error: function(message) {
            if (this.get("feedback")) {
                this.showMessage("error", message || "", 500);
            }
        },
        getWidgetById: function(id) {
            return Y.Widget.getByNode(this.get("root").get("contentBox").one("#" + id));
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.events.length; i += 1) {
                this.events[i].detach();
            }
        }
    }, {
        ATTRS: {
            keyPress: {
                value: true,
                type: "boolean",
                _inputex: {
                    label: "Keys 'f' and 'j'"
                }
            },
            currentLoading: {
                value: {},
                "transient": true
            },
            feedback: {
                value: true,
                type: "boolean"
            },
            fixPoint: {
                value: 2000,
                type: "number"
            },
            random: {
                value: true,
                type: "boolean"
            }
        }
    });
});

