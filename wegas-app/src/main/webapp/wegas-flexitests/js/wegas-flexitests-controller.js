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
            this.awaitedKeypress = true;
            this.events = [];
        },
        renderUI: function() {
            this.get("contentBox").append("<div class='feedback'></div>");
            this.get("contentBox").append("<div class='input'></div>");
        },
        bindUI: function() {
            this.get("root").set("tabIndex", -1);
            this.events.push(this.get("root").get("boundingBox").after("keypress", function(e) {
                if (this.awaitedKeypress) {
                    this.keyPressed(String.fromCharCode(e.keyCode));
                }
            }, this));

        },
        syncUI: function() {
            //this.mask();
            this.leftElement = Y.Widget.getByNode(this.get("root").get("contentBox").one("#leftElement"));
            this.rightElement = Y.Widget.getByNode(this.get("root").get("contentBox").one("#rightElement"));
            this.centerElement = Y.Widget.getByNode(this.get("root").get("contentBox").one("#centerElement"));
            this.maxSize = Math.max(this.leftElement.size(), this.rightElement.size(), this.centerElement.size());
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
            if (this.centerElement.getActiveElement().get("response") === awaited) {
                this.success();
            } else {
                this.error();
            }
        },
        next: function() {
            this.centerElement.set("element", +this.centerElement.get("element") + 1);
            this.awaitedKeypress = true;
        },
        mask: function() {
            this.get("root").showOverlay();
        },
        unmask: function() {
            this.get("root").showOverlay();
        },
        success: function() {
            this.showMessage("success", "", 500);
            this.next();
        },
        error: function() {
            this.showMessage("error", "", 500);
            this.next();
        },
        destructor: function() {
            var i;
            for (i = 0; i < this.events.length; i += 1) {
                this.events[i].detach();
            }
        }
    }, {
    });
});

