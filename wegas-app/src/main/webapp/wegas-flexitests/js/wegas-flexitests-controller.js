/*
 * Wegas
 * http://wegas.albasim.ch
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
    Y.Wegas.FlexitestsController = Y.Base.create("wegas-flexitests-controller", Y.Wegas.AbsoluteLayout, [Y.Wegas.Widget, Y.Wegas.Editable], {
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
            this.config = {};
            this.currentQuestionId = -1;
            this.questionToDo = [];
            this.startTime = null;
            this.events = [];
            this.publish("visibility-timer:restart", {
                broadcast: 1
            });
            //this.get("contentBox").hide();
        },
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        bindUI: function() {
            this.constructor.superclass.bindUI.apply(this);
            this.set("tabIndex", -1);
            this.after("*:currentLoadingChange", function(e) {
                var i, noready = false;
                for (i in e.newVal) {
                    if (e.newVal.hasOwnProperty(i)) {
                        noready = (noready || e.newVal[i]);
                        if (noready) {
                            break;
                        }
                    }
                }
                if (!noready) {
                    this.get("contentBox").show();
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
            var props, exist = false, i, j, done = 0;
            this.mask();
            this.leftElement = this.getChildById("leftElement");
            this.rightElement = this.getChildById("rightElement");
            this.centerElement = this.getChildById("centerElement");
            this.fixPoint = this.get("contentBox").all(".fix-point");
            this.fixPoint.hide();
            this.mcq = this.getChildById("flexi-mcq");
            props = this.mcq.get("variable.evaluated").getInstance().get("properties");
            this.maxSize = Math.max(this.leftElement.size(), this.rightElement.size(), this.centerElement.size());
            for (i = 0; i < this.maxSize; i += 1) {
                exist = false;
                for (j in props) {
                    if (props.hasOwnProperty(j)) {
                        if (+(Y.JSON.parse(props[j]).id) === +i) {
                            exist = true;
                            done += 1;
                            break;
                        }
                    }
                }
                if (!exist) {
                    this.questionToDo[i - done] = i;
                }
            }
            this.onceAfter("render", this.next, this);
        },
        responseGiven: function(response) {
            var responseTime = Y.Lang.now() - this.startTime,
                    reponseElement,
                    elements = this.collectElements();
            this.ongoing = false;
            this.mask();
            elements.index = +this.maxSize - this.questionToDo.length;
            elements.id = this.currentQuestionId;
            elements.response = response;
            elements.delay = responseTime;
            reponseElement = this.centerElement.getActiveElement().flexiresponse;
            if (reponseElement instanceof Y.Plugin.FlexiResponse &&
                    reponseElement.get("value") === response) {
                elements.valid = true;
                this.mcq.success(responseTime);
            } else {
                elements.valid = false;
                this.mcq.error(responseTime);
            }
            this.mcq.save(elements);
            if (this.questionToDo.length !== 0) {
                this.next();
            }
        },
        next: function() {
            var onSuccess = Y.bind(function() {
                Y.later(this.get("fixPoint"), this, this.createLoadingEvent);
                this.fixPoint.show();
            }, this);
            this.mask();
            this.set("currentLoading", {"left": true, "center": true, "right": true});
            this.currentQuestionId = this.generateNextId();
            this.centerElement.set("element", +this.currentQuestionId);
            this.leftElement.set("element", +this.currentQuestionId);
            this.rightElement.set("element", +this.currentQuestionId);
            if (this.get("popupAfter") > 0 &&
                    (this.maxSize - this.questionToDo.length) !== 1 &&
                    ((this.maxSize - this.questionToDo.length - 1) % this.get("popupAfter")) === 0) {
                this.get("boundingBox").emitDOMMessage("showPopup", {
                    bodyContent: this.get("popupContent"),
                    buttons: [{
                            label: "Ok",
                            action: function() {
                                this.hide();
                                onSuccess();
                            }
                        }]
                });
            } else {
                onSuccess();
            }

        },
        collectElements: function() {
            var elements = {},
                    swaped = this.swapzone ? this.swapzone.swaped : false,
                    left = this.leftElement.getActiveElement(),
                    center = this.centerElement.getActiveElement(),
                    right = this.rightElement.getActiveElement();
            if (swaped) {
                elements.left = right.get("content") || right.get("url");
                elements.right = left.get("content") || left.get("url");
            } else {
                elements.left = left.get("content") || left.get("url");
                elements.right = right.get("content") || right.get("url");
            }
            elements.center = center.get("content") || center.get("url");
            return elements;
        },
        createLoadingEvent
                : function() {
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
            this.fire("visibility-timer:restart");
            Y.soon(Y.bind(this.unmask, this));
            this.ongoing = true;
        },
        mask: function() {
            this.fire("showOverlay");
//            this.showOverlay();
        },
        unmask: function() {
            this.fixPoint.hide();
            this.fire("hideOverlay");
//            this.hideOverlay();
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
        toObject: Y.Wegas.AbsoluteLayout.prototype.toObject,
        /**
         * Lifecycle method
         * @function
         * @private
         * @returns {undefined}
         */
        destructor: function() {
            var i;
            this.constructor.superclass.destructor.apply(this);
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
                type: "boolean",
                _inputex: {
                    label: "Play lists randomly"
                }
            },
            popupAfter: {
                value: 0,
                type: "number",
                _inputex: {
                    label: "Show popup message afer (ms)",
                    description: "0 or less to disable"
                }
            },
            popupContent: {
                value: "",
                type: "string",
                optional: true,
                format: "html",
                _inputex: {
                    label: "Popup content"
                }
            }
        }
    });
    /*Inject specific plugins*/
    Y.Wegas.FlexitestsController.ATTRS.plugins = Y.clone(Y.Wegas.FlexitestsController.ATTRS.plugins);
    Y.Wegas.FlexitestsController.ATTRS.plugins._inputex.items.push({
        type: "Button",
        label: "Swap top zones",
        data: "SwapZone"
    });
    Y.Plugin.FlexiResponse = Y.Base.create("wegas-flexi-response", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
    }, {
        NS: "flexiresponse",
        NAME: "flexiresponse",
        EDITORNAME: "Flexitest Response",
        ATTRS: {
            "value": {
                value: "",
                type: "string",
                _inputex: {
                    label: "Response value"
                }
            }
        }
    });
    Y.Plugin.SwapZone = Y.Base.create("wegas-flexi-swapzone", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        initializer: function() {
            if (!(this.get("host") instanceof Y.Wegas.FlexitestsController)) {
                return;
            }
            this.swaped = false;
            this.afterHostMethod("next", function() {
                var current = this.get("host").maxSize - this.get("host").questionToDo.length;
                if (current === 1 && Math.random() > 0.5) {
                    this.swap();
                }
                if (current % this.get("after") === 0) {
                    this.swap();
                }
            });
        },
        swap: function() {
            this.get("host").leftElement.get("contentBox").swap(this.get("host").rightElement.get("contentBox"));
            this.swaped = !this.swaped;
        }
    }, {
        NS: "swapzone",
        NAME: "swapzone",
        EDITORNAME: "Flexitest swap zone",
        ATTRS: {
            "after": {
                value: 1,
                type: "number",
                _inputex: {
                    label: "Swap after (ms)"
                },
                setter: function(v) {
                    return +v > 0 ? +v : 1;
                }
            }
        }
    });
});

