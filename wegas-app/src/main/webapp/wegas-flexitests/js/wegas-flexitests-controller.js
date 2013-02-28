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
    "use strict";
    Y.Wegas.FlexitestsController = Y.Base.create("wegas-flexitests-controller", Y.Wegas.AbsoluteLayout, [], {
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        initializer: function() {
            this.leftElement = null;
            this.rightElement = null;
            this.centerElement = null;
            this.mcq = null;
            this.maxSize = 0;
            this.ongoing = false;
            this.currentQuestionId = -1;
            this.questionToDo = [];
            this.startTime = null;
            this.events = [];
            this.eventuallyLoad = null;
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        bindUI: function() {
            this.set("tabIndex", -1);
            this.after("*:currentLoadingChange", function(e) {
                var noready = false;
                try {
                    this.eventuallyLoad.cancel();
                } catch (e) {
                }
                this.eventuallyLoad = Y.later(10000, this, this.set, "currentLoading", {"dummy": true});
                for (var i in e.newVal) {
                    noready = (noready || e.newVal[i]);
                    if (noready) {
                        break;
                    }
                }
                if (!noready) {
                    this.eventuallyLoad.cancel();
                    this.startStimuli();
                }
            });
            this.on("*:clientResponse", function(e) {
                if (this.ongoing) {
                    this.responseGiven(e.value);
                }
            });
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        syncUI: function() {
            this.leftElement = this.getChildById("leftElement");
            this.rightElement = this.getChildById("rightElement");
            this.centerElement = this.getChildById("centerElement");
            this.mcq = this.getChildById("flexi-mcq");
            this.maxSize = Math.max(this.leftElement.size(), this.rightElement.size(), this.centerElement.size());
            for (var i = 0; i < this.maxSize; i += 1) {
                this.questionToDo[i] = i;
            }
            this.mask();
            this.next();
        },
        responseGiven: function(response) {
            var responseTime = Y.Lang.now() - this.startTime;
            this.ongoing = false;
            if (this.centerElement.getActiveElement().get("response") === response) {
                this.mcq.success(responseTime);
            } else {
                this.mcq.error(responseTime);
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
            this.centerElement.getActiveElement().onceAfter("render", function(e) {
                this.set("currentLoading.center", false);
            }, this);
            this.leftElement.getActiveElement().onceAfter("render", function(e) {

                this.set("currentLoading.left", false);

            }, this);
            this.rightElement.getActiveElement().onceAfter("render", function(e) {

                this.set("currentLoading.right", false);

            }, this);
        },
        generateNextId: function() {
            return this.get("random") ?
                    this.questionToDo.splice(Math.round(Math.random() * (this.questionToDo.length - 1)), 1)[0] :
                    this.questionToDo.shift();
        },
        startStimuli: function() {
            this.get("boundingBox").focus();
            this.restartTimer(this.leftElement);
            this.restartTimer(this.rightElement);
            this.restartTimer(this.centerElement);
            Y.later(3, this, this.unmask);
            this.ongoing = true;
        },
        restartTimer: function(widget) {
            if (widget) {
                widget.fire("visibility-timer:restart");
            }
        },
        mask: function() {
            this.showOverlay();
        },
        unmask: function() {
            this.hideOverlay();
            this.startTime = Y.Lang.now();
        },
        getChildById: function(id) {
            var returnItem = null;
            this.some(function(item) {
                if (item.get("id") === id) {
                    returnItem = item;
                    return true;
                }
            });
            return returnItem;
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.events.length; i += 1) {
                this.events[i].detach();
            }
        }
    }, {
        EDITORNAME: "Flexitests Controller",
        ATTRS: {
            currentLoading: {
                value: {},
                "transient": true
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

