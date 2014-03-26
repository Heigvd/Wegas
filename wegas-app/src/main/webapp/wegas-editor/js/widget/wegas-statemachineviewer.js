/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
YUI.add('wegas-statemachineviewer', function(Y) {
    "use strict";
    var CONTENT_BOX = 'contentBox',
            BOUNDING_BOX = 'boundingBox',
            PARENT = "parent",
            SID = "sid",
            ENTITY = "entity",
            STATES = "states",
            Wegas = Y.Wegas,
            StateMachineViewer, State, Transition, jp;

    StateMachineViewer = Y.Base.create("wegas-statemachineviewer", Y.Widget, [Y.Wegas.Widget, Y.WidgetParent, Y.WidgetChild], {
        //TODO : zoom on simple scroll (ie without altKey), move panel with mouse (overflow hidden); zoom disabled
        //Zoom and Endpoint pos
        //InitialState modification
        //Highlight irrelevent states, notinitial and no incoming transition
        //Ability to move a transition, currently destroying and recreating a new one
        CONTENT_TEMPLATE: "<div><div class='scrollable'><div class='sm-zoom'></div></div></div>",
        cacheDialogue: null,
        initializer: function() {
            this.currentZoom = 1;
            this.stateId = 1;
            this.nodes = {};
            this.events = [];
            this.options = {
                states: []
            };
            this.jpLoaded = false;
            // Waiting for jsPlumb
            this.publish("jsPlumbLoaded", {
                bubbles: false,
                fireOnce: true,
                async: true,
                broadcast: true
            });
        },
        renderUI: function() {
            this._childrenContainer = this.get(CONTENT_BOX).one(".sm-zoom");
            this._childrenContainer.setStyle("transform", "scale(1)");

            this.btnNew = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-new\"></span>New",
                render: this.toolbar.get("header")
            });
            this.toolbar.get('header').append('<div style="width:10px;display:inline-block;"></div>'); // Add a separator
            this.sliderZoom = new Y.Slider({
                min: StateMachineViewer.MIN_ZOOM * StateMachineViewer.FACTOR_ZOOM,
                max: StateMachineViewer.MAX_ZOOM * StateMachineViewer.FACTOR_ZOOM,
                value: StateMachineViewer.FACTOR_ZOOM, // default zoom
                render: this.toolbar.get("header")
            });

            this.btnZoomValue = new Y.Button({
                label: "100%",
                render: this.toolbar.get("header")
            });

            this.scrollView = new Y.ScrollView({
                srcNode: '.scrollable',
                height: '100%',
                width: '100%',
                deceleration: 0,
                axis: 'xy'
            }).render();

            window.jsPlumb.ready(Y.bind(this.initJsPlumb, this));
        },
        bindUI: function() {
            var key, cb = this.get(CONTENT_BOX),
                    availableStates = this.get("availableStates");

            //this.events.push(Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this));

            cb.on('mousedown', function() {
                this.one('.scrollable').addClass('mousedown');
            });
            cb.on('mouseup', function() {
                this.one('.scrollable').removeClass('mousedown');
            });
            this.on("*:destroy", function(e) {
                /**
                 @HACK prevent tab from losing its child each time something is destroyed.
                 */
                if (e.target !== this) {
                    e.stopPropagation();
                }
            });
            this.after("entityChange", function(e) {
                this.showOverlay();
                this.onceAfter("jsPlumbLoaded", this.rebuild);
            });
            cb.on("mousewheel", Y.bind(function(e) {
                if (this.get(CONTENT_BOX).one("#" + e.target.get("id"))) {
                    e.halt(true);
                    this.zoom(e);
                }
            }, this));

            this.on("wegas-state:userRemove", function(e) {
                delete this.get(ENTITY).get(STATES)[e.target.get(SID).toString()];
                delete this.nodes[e.target.get(SID).toString()];
            });

            if (availableStates.length > 1) {
                for (key in availableStates) {
                    this.options.states.push({
                        type: "Button",
                        label: availableStates[key],
                        on: {
                            click: Y.bind(this.addStateType, this, availableStates[key])
                        }
                    });
                }
                this.btnNew.plug(Y.Plugin.WidgetMenu, {
                    children: this.options.states
                });
            } else if (availableStates.length === 1) {
                this.btnNew.on("click", Y.bind(this.addStateType, this, availableStates[0]));
            }

            this.sliderZoom.on('valueChange', function(e) {
                this.setZoom(e.newVal / StateMachineViewer.FACTOR_ZOOM, true);
            }, this);

            this.btnZoomValue.on('click', function(e) {
                this.setZoom(1, false);
                this.scrollView.set("scrollX", 0);
                this.scrollView.set("scrollY", 0);
            }, this);
        },
        syncUI: function() {
            this.highlightCurrentState();
        },
        destructor: function() {
            var i;
            for (i in this.events) {
                try {
                    this.events[i].detach();
                } catch (e) {
                    Y.log("Destruction failed, can't detach event", "error", "Y.Wegas.StateMachineViewer");
                }
            }
            jp.unbind();
            this.scrollView.destroy();
            this.sliderZoom.destroy();
            this.btnNew.destroy();
            this.btnZoomValue.destroy();
        },
        initJsPlumb: function() {
            jp = window.jsPlumb.getInstance({
                Container: this.get(CONTENT_BOX).one(".sm-zoom"),
                Anchor: "Continuous",
                Endpoint: ["Dot", {
                        radius: 2
                    }],
                Connector: ["Flowchart", {
                        stub: [40, 40],
                        gap: 10
                    }],
                //                Connector: ["StateMachine", {
                //                        curviness: 60,
                //                        proximityLimit: 100
                //                    }],
                ConnectionOverlays: [["Arrow", {
                            location: 1,
                            width: 10,
                            length: 10,
                            foldback: 1
                        }]],
                PaintStyle: {
                    lineWidth: 3,
                    strokeStyle: "#777",
                    outlineColor: "white",
                    outlineWidth: 3
                }
            });
            jp.bind("connectionDetached", function(e) {
                if (!e.connection.getParameter("transition")) { // drawing connection.
                    return;
                }
                var entity = e.connection.getParameter("transition").source.get(ENTITY),
                        transitions = entity.get("transitions"),
                        currentTransition = e.connection.getParameter("transition").get(ENTITY), index = Y.Array.indexOf(transitions, currentTransition);
                if (index > -1) {
                    transitions.splice(index, 1);
                }
                e.connection.getParameter("transition").destroy();
                e.connection.getParameter("transition").source.get(PARENT).save();
            });
            this.jpLoaded = true;
            this.setZoom(1, true);
            this.fire("jsPlumbLoaded");
        },
        rebuild: function() {
            if (!this.jpLoaded) {
                this.hideOverlay();
                return false;
            }
            var state, states, sm = this.get(ENTITY);
            jp.setSuspendDrawing(true);
            this.stateId = 1;
            this.nodes = {};
            states = this.destroyAll();
            if (this.get(ENTITY)) {
                for (state in sm.get(STATES)) {
                    this.addState(sm.get(STATES)[state].get("editorPosition") ? sm.get(STATES)[state].get("editorPosition").get("x") || 30 : 30, sm.get(STATES)[state].get("editorPosition") ? sm.get(STATES)[state].get("editorPosition").get("y") || 30 : 30, parseInt(state), sm.get(STATES)[state]);
                }
                this.each(function() {
                    // try {
                    this.makeAllOutgoingTransitions();
                    //} catch (e) {
                    //    Y.error("Failed creating transition", e, "Y.Wegas.StateMachineViewer");
                    //}
                });
            }
            this.highlightUnusedStates();
            jp.setSuspendDrawing(false, true);
            this.hideOverlay();
            this.syncUI();
            return true;
        },
        addStateType: function(type) {
            var region = this.get(CONTENT_BOX).one('.scrollable').get('region'),
                    x = parseInt(region.width / 2 + this.scrollView.get('scrollX')),
                    y = parseInt(region.height / 2 + this.scrollView.get('scrollY')),
                    state = type === "State" ? new Wegas.persistence.State() : new Wegas.persistence.DialogueState();
            state.set("editorPosition", new Wegas.persistence.Coordinate({
                x: x,
                y: y
            }));
            this.setZoom(1, false); // force setting default zoom to have correct position
            this.addState(x, y, this.stateId, state);
            this.save();
        },
        addState: function(x, y, id, entity) {
            if (!this.jpLoaded) {
                return null;
            }
            var state, config = {
                sid: id,
                initial: (+id === +this.get(ENTITY).getInitialStateId()),
                x: x,
                y: y
            };
            if (entity) {
                config.entity = entity;
            }
            state = this.add(new Wegas.State(config)).item(0);
            this.nodes[id.toString()] = state;
            this.get(ENTITY).get(STATES)[id.toString()] = entity;
            this.stateId = Math.max(this.stateId, parseInt(id) + 1);
            return state;
        },
        save: function() {
            this._saveTimer && this._saveTimer.cancel();
            /**
             * avoid multiple calls. Save last.
             */
            this._saveTimer = Y.later(100, this, function() {
                var entity = this.get(ENTITY),
                        DEFAULTCB = {
                            success: Y.bind(function(e) {
                                this._saveOngoing = false;
                                if (this._saveWaiting) {
                                    this.save();
                                }

                                this.highlightUnusedStates();
                                this.hideOverlay();

                            }, this),
                            failure: Y.bind(function(e) {
                                this._saveOngoing = false;
                                if (this._saveWaiting) {
                                    this.save();
                                }
                                this.showMessage("error", e.response.data.message);

                                this.highlightUnusedStates();
                                this.hideOverlay();
                            }, this)
                };
                if (entity) {
                    //                    this.showOverlay();
                    //                    if (this._saveOngoing) {
                    //                        this._saveWaiting = true;
                    //                        return;
                    //                    }
                    this._saveOngoing = true;
                    this._saveWaiting = false;
                    entity = Y.JSON.parse(Y.JSON.stringify(entity));
                    if (entity.id) {
                        Wegas.Facade.VariableDescriptor.cache.put(entity, {
                            on: DEFAULTCB
                        });
                    } else {
                        Wegas.Facade.VariableDescriptor.cache.post(entity, {
                            on: DEFAULTCB
                        });
                    }
                }
            });
        },
        zoom: function(event) {
            if (event.wheelDelta < 0) {
                this.setZoom(this.currentZoom - 0.05, false);
            } else {
                this.setZoom(this.currentZoom + 0.05, false);
            }
            this.setZoom(this.currentZoom, false);
        },
        setZoom: function(lvl, isFromSliderOrInit) {
            this.currentZoom = lvl < StateMachineViewer.MIN_ZOOM ?
                    StateMachineViewer.MIN_ZOOM :
                    (lvl > StateMachineViewer.MAX_ZOOM ?
                            StateMachineViewer.MAX_ZOOM :
                            lvl);
            this.get(CONTENT_BOX).one(".sm-zoom").setStyle('transform', 'scale(' + this.currentZoom + ')');
            jp.setZoom(this.currentZoom);
            this.btnZoomValue.set("label", parseInt(this.currentZoom * 100) + "%");
            if (!isFromSliderOrInit) {
                this.sliderZoom.set("value", this.currentZoom * StateMachineViewer.FACTOR_ZOOM);
            }
            this.scrollView.syncUI(); // resize scrollview, fixme: seems working only when first loading or complete refresh
        },
        highlightCurrentState: function() {
            var currentStateNode, sm = this.get(ENTITY);
            if (!sm) {
                return;
            }
            this.get(BOUNDING_BOX).all(".currentState").removeClass("currentState");
            currentStateNode = this.nodes[Wegas.Facade.VariableDescriptor.cache.findById(sm.get("id")).getInstance().get("currentStateId")];
            if (currentStateNode) {
                currentStateNode.get(BOUNDING_BOX).addClass("currentState");
            }
        },
        highlightUnusedStates: function() {
            // Prepare vars
            var currentState, i,
                    initialNode = this.nodes[this.get(ENTITY).getInitialStateId()],
                    listStates = Y.merge(this.nodes), // Prepare data
                    listPath = initialNode ? [initialNode] : [];
            this.get(BOUNDING_BOX).all(".unusedState").removeClass("unusedState");
            // Follow the path
            while (listPath.length > 0) {
                currentState = listPath.pop();
                // Test if state has been already visited
                if (listStates[currentState.get(SID)] !== undefined) {
                    for (i in currentState.get(ENTITY).get("transitions")) {
                        listPath.push(this.nodes[currentState.get(ENTITY).get("transitions")[i].get("nextStateId")]);
                    }
                }
                delete listStates[currentState.get(SID)];
            }
            // Highlight
            for (i in listStates) {
                listStates[i].get(BOUNDING_BOX).addClass("unusedState");
            }
        }
    }, {
        MIN_ZOOM: 0.3,
        MAX_ZOOM: 3,
        FACTOR_ZOOM: 1000,
        ATTRS: {
            entity: {
                value: null,
                validator: function(o) {
                    return o instanceof Wegas.persistence.FSMDescriptor || o === null;
                }
            },
            availableStates: {
                value: ["State"]
            },
            availableTransitions: {
                value: ["Transition"]
            }
        },
        FORMATSCRIPT: function(script) {
            if (script && script.get) {
                return script.get("content") || "";
            } else if (Y.Lang.isObject(script)) {
                return script.content || "";
            } else {
                return "";
            }
        }
    });

    State = Y.Base.create('wegas-state', Y.Widget, [Y.WidgetChild, Y.WidgetParent], {
        textNode: null,
        transitionsTarget: [], //store incomming transitions
        options: null,
        cssClass: {
            state: 'statemachine-state',
            initial: 'initial-state'
        },
        CONTENT_TEMPLATE: null,
        //TODO : use localStorage for positions !

        initializer: function() {
            this.transitionsTarget = [];
            this.options = {
                transitions: []
            };
            this.publish("userRemove", {
                emitFacade: true
            });
        },
        renderUI: function() {
            var bb = this.get(BOUNDING_BOX);
            bb.addClass(this.cssClass.state);
            bb.addClass(this.get(ENTITY) instanceof Wegas.persistence.DialogueState ? "sm-dialoguestate" : "sm-state");
            /*if (this.get(ENTITY) instanceof Wegas.persistence.DialogueState) {
             this.textNode = new Y.Node.create("<textarea placeholder=\"Text (Response)\">" + this.get(ENTITY).get("text") + "</textarea>");
             this.textNode.addClass(this.getClassName("text"));
             this.get(CONTENT_BOX).append(this.textNode);
             } else if (this.get(ENTITY).get("onEnterEvent")) {
             this.add(new Wegas.Script({
             entity: this.get(ENTITY).get("onEnterEvent")
             }));
             } else {
             this.add(new Wegas.Script({}));
             }*/
            this.menuNode = new Y.Node.create("<div></div>");
            bb.append(this.menuNode);
            if (this.get(SID)) {
                this.sidNode = new Y.Node.create("<div style=\"word-wrap: break-word;height:100%;\">"
                        + ((this.get(ENTITY) instanceof Wegas.persistence.DialogueState ? this.get(ENTITY).get("text") : StateMachineViewer.FORMATSCRIPT(this.get(ENTITY).get("onEnterEvent")).substring(0, 50)) || "")
                        + "</div>");
                bb.append(this.sidNode);
            }
            if (this.get("x")) {
                bb.setStyle("left", this.get("x") + "px");
            }
            if (this.get("y")) {
                bb.setStyle("top", this.get("y") + "px");
            }
            bb.append("<div class='transition-start'></div>"
                    + "<div class='state-toolbox'><div class='state-initial'></div><div class='state-delete'></div></div>");
        },
        syncUI: function() {
            this.set(SID, this.get(SID));
            this.set("initial", this.get("initial"));
        },
        bindUI: function() {
            var key;
            this.get(CONTENT_BOX).delegate("click", this.deleteSelf, ".state-delete", this); // Delete state button
            this.get(CONTENT_BOX).delegate("click", function(e) { // Set initial state button
                e.halt(true);
                this.get(PARENT).get(ENTITY).setInitialStateId(this.get(SID));
                this.get(PARENT).get(BOUNDING_BOX).all(".initial-state").each(function() {
                    this.removeClass("initial-state");
                });
                this.set("initial", true);
                this.get(PARENT).save();
            }, ".state-initial", this);
            jp.draggable(this.get(BOUNDING_BOX), {
                containment: this.get(PARENT).get(BOUNDING_BOX).one(".sm-zoom").getDOMNode(),
                after: {
                    end: Y.bind(this.dragEnd, this)
                }
                /* TODO : FIX
                 plugins:[{
                 fn:Y.Plugin.DDConstrained,
                 cfg:{
                 constrain:this.get(PARENT).get(CONTENT_BOX),
                 gutter: "30 10 10 10"
                 }
                 },
                 {
                 fn:Y.Plugin.DDNodeScroll,
                 cfg:{
                 node:this.get(PARENT).get(BOUNDING_BOX).get("parentNode")
                 }
                 }]*/
            });
            jp.makeTarget(this.get(BOUNDING_BOX), {
                dropOptions: {
                    hoverClass: "droppable-state"
                },
                uniqueEndpoint: false,
                deleteEndpointsOnDetach: true,
                beforeDrop: function(e) {
                    var s, t;
                    s = Y.Widget.getByNode("#" + e.sourceId);
                    t = Y.Widget.getByNode("#" + e.targetId);
                    s.addTransition(t);
                }
            });
            jp.makeSource(this.get(BOUNDING_BOX).one('.transition-start'), {
                parent: this.get(BOUNDING_BOX)
            });
            if (this.textNode) {
                this.textNode.on("change", function(e) {
                    var val = e.target.getDOMNode().value;
                    if (val === "") { //Set an empty String to null
                        val = null;
                    }
                    this.get(ENTITY).set("text", val);
                }, this);
            }
            this.get(CONTENT_BOX).on('click', function(e) {
                Y.Plugin.EditEntityAction.hideRightTabs();
                Y.Plugin.EditEntityAction.showEditForm(this.get(ENTITY), Y.bind(this.setEntity, this));
            }, this);
            for (key in this.get(PARENT).get("availableTransitions")) {
                this.options.transitions.push({
                    type: "Button",
                    label: this.get(PARENT).get("availableTransitions")[key],
                    on: {
                        click: Y.bind(this.addTransitionType, this, this.get(PARENT).get("availableTransitions")[key])
                    }
                });
            }
            this.menuNode.plug(Y.Plugin.WidgetMenu, {
                children: this.options.transitions
            });
        },
        addTransitionType: function(type) {
            if (this.source !== null) {
                var tr = type === "Transition" ? new Wegas.persistence.Transition() : new Wegas.persistence.DialogueTransition();
                tr.set("nextStateId", this.get(SID));
                this.source.add(new Wegas.Transition({
                    entity: tr
                })).item(0).connect(this.source.get(SID) === this.get(SID));
                this.source.get(ENTITY).get("transitions").push(tr);
                this.get(PARENT).save();
                this.source = null;
            }
        },
        dragEnd: function(e) {
            if (this.get(ENTITY).get("editorPosition")) {
                this.get(ENTITY).get("editorPosition").setAttrs({
                    x: parseInt(Y.one(e.target.el).getStyle("left")),
                    y: parseInt(Y.one(e.target.el).getStyle("top"))
                });
            } else {
                this.get(ENTITY).set("editorPosition", new Wegas.persistence.Coordinate({
                    x: parseInt(Y.one(e.target.el).getStyle("left")),
                    y: parseInt(Y.one(e.target.el).getStyle("top"))
                }));
            }
            this.get(PARENT).save();
        },
        setEntity: function(entity) {
            var e = Wegas.Editable.reviver(entity);
            this.get(ENTITY).setAttrs({
                onEnterEvent: e.get("onEnterEvent"), // Only change onEnterEvent,
                text: e.get("text")
                        //   text:  (e instanceof Wegas.persistence.DialogueState ? e.get("text") : StateMachineViewer.FORMATSCRIPT(e.get("onEnterEvent")).substring(0, 50)) || "")
            });

            this.sidNode.setHTML((e instanceof Wegas.persistence.DialogueState ? e.get("text") : StateMachineViewer.FORMATSCRIPT(e.get("onEnterEvent")).substring(0, 30)) || "");
            Y.Plugin.EditEntityAction.hideEditFormOverlay();
            this.get(PARENT).save();
        },
        addTransition: function(target) {
            var tr;
            if (this.get(PARENT).get("availableTransitions").length > 1) {
                target.source = this;
                target.stateId = target.get(SID);
                target.menuNode.menu.show(); // show menu to select transition type
            } else if (this.get(PARENT).get("availableTransitions").length === 1) {
                tr = this.get(PARENT).get("availableTransitions")[0] === "Transition" ? new Wegas.persistence.Transition() : new Wegas.persistence.DialogueTransition();
                tr.set("nextStateId", target.get(SID));
                this.add(new Wegas.Transition({
                    entity: tr
                })).item(0).connect(this.get(SID) === target.get(SID));
                this.get(ENTITY).get("transitions").push(tr);
                this.get(PARENT).save();
            } else {
                Y.log("No transition available");
            }
        },
        deleteSelf: function() {
            while (this.transitionsTarget.length > 0) {
                this.transitionsTarget[0].disconnect();
            }
            this.fire("userRemove");
            this.destroy();
            if (this.get(SID) === this.get(PARENT).get(ENTITY).getInitialStateId()) {
                var id = this.getNextStateId();
                if (id !== null) {
                    this.get(PARENT).get(ENTITY).setInitialStateId(id);
                    this.get(PARENT).get(BOUNDING_BOX).all(".initial-state").each(function() {
                        this.removeClass("initial-state");
                    });
                    this.get(PARENT).nodes[id].set("initial", true);
                }
            }
            this.get(PARENT).save();
        },
        makeAllOutgoingTransitions: function() {
            var i, transitions = this.get(ENTITY).get("transitions");
            for (i in transitions) {
                this.add(new Wegas.Transition({
                    entity: transitions[i]
                })).item(0).connect(transitions[i].get("nextStateId") === this.get(SID));
            }
        },
        getNextStateId: function() {
            var id;
            for (id in this.get(PARENT).get(ENTITY).get(STATES)) {
                return id;
            }
            return null;
        }
    }, {
        ATTRS: {
            sid: {
                value: 0,
                setter: function(v) {
                    this.get(BOUNDING_BOX).setAttribute(SID, v);
                    return v;
                }
            },
            entity: {
                valueFn: function() {
                    return new Wegas.persistence.State();
                    //return new Wegas.persistence.DialogueState();
                },
                validator: function(o) {
                    return o instanceof Wegas.persistence.State;
                }
            },
            initial: {
                value: false,
                validator: Y.Lang.isBoolean,
                setter: function(v) {
                    if (v) {
                        this.get(BOUNDING_BOX).addClass(this.cssClass.initial);
                    } else {
                        this.get(BOUNDING_BOX).removeClass(this.cssClass.initial);
                    }
                    return v;
                }
            },
            x: {
                value: null,
                validator: Y.Lang.isInteger
            },
            y: {
                value: null,
                validator: Y.Lang.isInteger
            }
        }
    });


    Transition = Y.Base.create('wegas-transition', Y.Widget, [Y.WidgetParent, Y.WidgetChild], {
        connector: null,
        source: null,
        target: null,
        actionNode: null,
        renderUI: function() {
            this.hide();
            if (this.get(ENTITY) instanceof Wegas.persistence.DialogueTransition) {
                this.actionNode = new Y.Node.create("<textarea placeholder=\"actionText (button's label)\"/>");
                this.actionNode.addClass(this.getClassName("text"));
                this.get(CONTENT_BOX).append(this.actionNode);
                this.actionNode.setContent(this.get(ENTITY).get("actionText"));
            } else if (this.get(ENTITY).get("triggerCondition")) {
                //                this.add(new Wegas.Script({
                //                    entity: this.get(ENTITY).get("triggerCondition")
                //                }));
            }
        },
        bindUI: function() {
            this.get(BOUNDING_BOX).on("click", function(e) {
                e.stopImmediatePropagation();
                if (e.target === this.get(BOUNDING_BOX)) {
                    this.hide();
                }
            }, this);
            if (this.actionNode) {
                this.actionNode.on("change", function(e) {
                    var val = e.target.getDOMNode().value;
                    this.connection.setLabel(val);
                    if (val === "" || val === undefined) { //Set an empty String to null
                        val = null;
                    }
                    this.get(ENTITY).set("actionText", val);
                }, this);
            }
        },
        connect: function(loopback) {
            var nextStateId = this.get(ENTITY).get("nextStateId"),
                    parentTransitions;
            this.get(BOUNDING_BOX).appendTo(this.get(PARENT).get(PARENT).get(CONTENT_BOX).one(".sm-zoom"));
            this.source = this.get(PARENT);
            this.target = this.get(PARENT).get(PARENT).nodes[nextStateId.toString()];
            /*
             fix bug where a state could have a transition without an existing target state.
             */
            if (!(this.target && this.source)) {
                parentTransitions = this.source.get(ENTITY).get("transitions");
                parentTransitions.splice(Y.Array.indexOf(parentTransitions, this.get(ENTITY)), 1);
                this.source.get(PARENT).save();
                return;
            }
            this.connection = jp.connect({
                source: this.source.get(BOUNDING_BOX),
                target: this.target.get(BOUNDING_BOX),
                deleteEndpointsOnDetach: true,
                uniqueEndpoint: false,
                paintStyle: {
                    lineWidth: 2,
                    //strokeStyle: this.get(ENTITY) instanceof Wegas.persistence.DialogueTransition ? "#4372C4" : "#072644",
                    outlineColor: "white",
                    strokeStyle: "darkgray",
                    outlineWidth: 4
                },
                hoverPaintStyle: {
                    strokeStyle: "#072644"
                },
                parameters: {
                    transition: this
                },
                overlays: [
                    ["Label", {
                            id: "toolbox",
                            location: 0.9,
                            label: Transition.TOOLBOX,
                            cssClass: "transition-toolbox"
                        }]
                ],
                connector: loopback ? "StateMachine" : ["Flowchart", {cornerRadius: 5 /*, stub:[40, 60], gap:10,  alwaysRespectStubs:true */}]
            });

            this.addTarget(this.target);
            this.target.transitionsTarget.push(this);
            this.createLabel();
            //this could be if we listen to click events on complete connector(ie arrow + label)
            this.connection.canvas.setAttribute("cursor", "pointer");
            this.connection.canvas.entity = this;
            //this.connection.canvas.onmouseover = function() {
            //    this.entity.labelNode.canvas.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:inline-block;");
            //};
            //this.connection.canvas.onmouseout = function() {
            //    this.entity.labelNode.canvas.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:none;");
            //};
            this.connection.canvas.onclick = function() {
                Y.Plugin.EditEntityAction.hideRightTabs();
                Y.Plugin.EditEntityAction.showEditForm(this.entity.get(ENTITY), Y.bind(this.entity.setEntity, this.entity));
            };
        },
        disconnect: function() {
            var index = Y.Array.indexOf(this.target.transitionsTarget, this);
            jp.detach(this.connection, {
                fireEvent: true
            });
            if (index > -1) {
                this.target.transitionsTarget.splice(index, 1);
            }
        },
        setEntity: function(entity) {
            var i, e = Wegas.Editable.revive(entity);
            for (i in e) {
                if (e.hasOwnProperty(i)) {
                    this.get(ENTITY)[i] = e[i];
                }
            }
            Y.Plugin.EditEntityAction.hideEditFormOverlay();
            this.createLabel();
            this.get(PARENT).get(PARENT).save();
        },
        createLabel: function() {
            if (this.get(ENTITY) instanceof Wegas.persistence.DialogueTransition) {
                this.connection.setLabel({
                    label: this.get(ENTITY).get("actionText"),
                    cssClass: "transition-label"
                });
            } else {
                this.connection.setLabel({
                    label: (this.get(ENTITY).get("triggerCondition") ? StateMachineViewer.FORMATSCRIPT(this.get(ENTITY).get("triggerCondition")).substring(0, 50) : "<em>empty</em>"),
                    cssClass: "transition-label"
                });
            }
            this.labelNode = this.connection.getLabelOverlay();
            if (this.labelNode) {
                Y.one(this.labelNode.getElement()).on("click", function(e) {
                    Y.Plugin.EditEntityAction.hideRightTabs();
                    Y.Plugin.EditEntityAction.showEditForm(this.get(ENTITY), Y.bind(this.setEntity, this));
                }, this);
                Y.one(this.connection.getOverlay("toolbox").getElement()).delegate("click", function(e) {
                    e.halt("true");
                    var i, transitions = this.get(PARENT).get(ENTITY).get("transitions");
                    for (i in transitions) {
                        if (transitions[i] === this.get(ENTITY)) {
                            transitions.splice(i, 1);
                        }
                    }
                    this.disconnect();
                }, ".transition-delete", this);
                //Y.one(this.labelNode.getElement()).delegate("click", function(e) {
                //    e.halt("true");
                //    var i, transitions = this.get(PARENT).get(ENTITY).get("transitions");
                //    for (i in transitions) {
                //        if (transitions[i] === this.get(ENTITY)) {
                //            transitions.splice(i, 1);
                //        }
                //    }
                //    this.disconnect();
                //}, ".transition-delete", this);

//                this.labelNode.canvas.onmouseover = function() {
//                    this.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:inline-block;");
//                };
//                this.labelNode.canvas.onmouseout = function() {
//                    this.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:none;");
//                };
            }
            //Listen to complete connector
            //            this.events.conClick = this.connection.bind("click", function (e){
            //                var that = e.getParameter("transition");
            //                that.editor();
            //            });
        },
        editor: function() {
            var x, y;
            x = parseInt(this.labelNode.getElement().style.left);
            y = parseInt(this.labelNode.getElement().style.top);
            this.get(CONTENT_BOX).setStyle("left", (x - 5) + "px");
            this.get(CONTENT_BOX).setStyle("top", (y - 5) + "px");
            this.show();
        },
        destructor: function() {
            jp.detach(this.connection, {
                forceDetach: true,
                fireEvent: false
            });
            for (var i in this.events) {
                try {
                    this.events[i].detach();
                } catch (e) {
                    this.events[i].unbind();
                }
            }
        }
    }, {
        TOOLBOX: "<div class='transition-edit'></div><div class='transition-delete'></div>",
        ATTRS: {
            tid: {
                value: null,
                validator: Y.Lang.isNumber
            },
            entity: {
                valueFn: function() {
                    var e = new Wegas.persistence.Transition();
                    return e;
                }
            }
        }
    });


    Wegas.StateMachineViewer = StateMachineViewer;
    Wegas.State = State;
    Wegas.Transition = Transition;
});
