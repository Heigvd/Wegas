/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

YUI.add('wegas-statemachineviewer', function(Y) {
    "use strict";

    var StateMachineViewer, State, Transition, Script,
            jp,
            CONTENT_BOX = 'contentBox',
            BOUNDING_BOX = 'boundingBox';

    StateMachineViewer = Y.Base.create("wegas-statemachineviewer", Y.Widget, [Y.Wegas.Widget, Y.WidgetParent, Y.WidgetChild], {
        //TODO : zoom on simple scroll (ie without altKey), move panel with mouse (overflow hidden); zoom disabled
        //Zoom and Endpoint pos
        //InitialState modification
        //Highlight irrelevent states, notinitial and no incoming transition
        //Ability to move a transition, currently destroying and recreating a new one

        CONTENT_TEMPLATE: "<div><div class='scrollable'><div class='sm-zoom'></div></div></div>",
        panel: null,
        header: null,
        jpLoaded: false,
        stateId: null,
        currentZoom: null,
        cacheDialogue: null,
        scrollView: null,
        sliderZoom: null,
        btnNew: null,
        btnZoomValue: null,
        options: null,
        nodes: {},
        initializer: function() {
            this.currentZoom = 1;
            this.stateId = 1;
            this.events = [];
            this.options = {};
            this.options.states = [];
            this.jpLoaded = false;
            // Waiting for jsPlumb
            this.publish("jsPlumbLoaded", {
                bubbles: false,
                fireOnce: true,
                async: true,
                broadcast: true
            });
        },
        initJsPlumb: function() {
            jp = window.jsPlumb.getInstance({
                Container: this.get(CONTENT_BOX).one(".sm-zoom"),
                Anchor: "Continuous",
                Endpoint: ["Dot", {
                        radius: 6
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
                            width: 15
                        }]],
                PaintStyle: {
                    lineWidth: 3,
                    strokeStyle: "#11F",
                    outlineColor: "white",
                    outlineWidth: 3
                }
            });
            jp.bind("connectionDetached", function(e) {
                var i,
                        transitions = e.connection.getParameter("transition").source.get("entity").get("transitions");
                for (i in transitions) {
                    if (transitions[i] === e.connection.getParameter("transition").get("entity")) {
                        transitions.splice(i, 1);
                    }
                }
                e.connection.getParameter("transition").destroy();
                e.connection.getParameter("transition").source.get("parent").save();
            });
            this.jpLoaded = true;
            this.setZoom(1, true);
            this.fire("jsPlumbLoaded");
        },
        renderUI: function() {
            this.panel = this.toolbar.get("panel");
            this.header = this.toolbar.get("header");
            this._childrenContainer = this.get(CONTENT_BOX).one(".sm-zoom");
            this.get(CONTENT_BOX).one(".sm-zoom").setStyle("transform", "scale(1)");
            
            this.toolbar.add(this.btnNew = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-add\"></span>New"
            }));
            
            this.toolbar.add(this.sliderZoom = new Y.Slider({
                min: StateMachineViewer.MIN_ZOOM * StateMachineViewer.FACTOR_ZOOM,
                max: StateMachineViewer.MAX_ZOOM * StateMachineViewer.FACTOR_ZOOM,
                value: StateMachineViewer.FACTOR_ZOOM // default zoom
            }));

            this.toolbar.add(this.btnZoomValue = new Y.Button({
                label: "100%"
            }));

            this.panel.setStyle("display", "none");
            this.panel.name = Y.Node.create("<input type='text' name='name' placeholder='Name'></input>");
            this.panel.scope = Y.Node.create("<select name='scope'><option value='GameScope'>GameScope</option><option value='TeamScope'>TeamScope</option><option value='PlayerScope'>PlayerScope</option></select>");
            this.renderPanel();

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
            var key;
            this.on("rebuild", function(e) {
                e.halt(true);
                this.showOverlay();
                this.onceAfter("jsPlumbLoaded", this.rebuild);
            });

            this.events.push(Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this));

            this.on("button:load", function(e) {
                this.processMenu("load");
            });
            this.on("button:new", function(e) {
                this.processMenu("new");
            });

            this.get(CONTENT_BOX).on('mousedown', function() {
                this.get(CONTENT_BOX).one('.scrollable').addClass('mousedown');
            }, this);
            this.get(CONTENT_BOX).on('mouseup', function() {
                this.get(CONTENT_BOX).one('.scrollable').removeClass('mousedown');
            }, this);
            
            this.after("entityChange", function(e) {
                this.fire("rebuild");
            });
            this.get(CONTENT_BOX).on("mousewheel", Y.bind(function(e) {
                e.halt(true);
                this.zoom(e);
            }, this));
            this.on("wegas-state:userRemove", function(e) {
                delete this.get("entity").get("states")[e.target.get("sid").toString()];
                delete this.nodes[e.target.get("sid").toString()];
            });
            this.panel.name.on("change", function(e) {
                this.get("entity").set("name", e.target.getDOMNode().value);
            }, this);
            this.panel.scope.on("change", function(e) {
                this.get("entity").set("scope", new Y.Wegas.persistence[e.target.getDOMNode().value]());
            }, this);
            
            if (this.get("availableStates").length > 1) {
                for (key in this.get("availableStates")) {
                    this.options.states.push({
                        type: "Button",
                        label: this.get("availableStates")[key],
                        on: {
                            click: Y.bind(this.addStateType, this, this.get("availableStates")[key])
                        }
                    });
                }
                this.btnNew.plug(Y.Plugin.WidgetMenu, {
                    children: this.options.states
                });
            }
            else if (this.get("availableStates").length === 1) {
                this.btnNew.on("click", this.addStateType, this, this.get("availableStates")[0]);
            }
            
            this.sliderZoom.on('valueChange', function(e) {
                this.setZoom(e.newVal / StateMachineViewer.FACTOR_ZOOM, true);
            }, this);
            
            this.btnZoomValue.on('click', function(e) {
                this.setZoom(1, false);
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
        loader: function() {
            var i, tmp;
            if (!this.panel.loader) {
                this.cacheDialogue = Y.Wegas.Facade.VariableDescriptor.cache.filter("@class", "DialogueDescriptor");
                tmp = "<select><option>Select</option>";
                for (i in this.cacheDialogue) {
                    tmp += "<option value='" + this.cacheDialogue[i].get("id") + "'>" + this.cacheDialogue[i].get("name") + "</option>";
                }
                tmp += "</select>";
                this.panel.loader = Y.Node.create(tmp);
                this.panel.append(this.panel.loader);
                this.panel.loader.on("change", function(e) {
                    if (e.target.getDOMNode().value) {
                        this.set("entity", Y.Wegas.Facade.VariableDescriptor.cache.find("id", parseInt(e.target.getDOMNode().value)));
                    }
                    this.panel.loader.remove(true);
                    this.panel.loader = null;
                }, this);
            }
        },
        rebuild: function() {
            if (!this.jpLoaded) {
                this.hideOverlay();
                return false;
            }
            var state, states, sm = this.get("entity");
            jp.setSuspendDrawing(true);
            this.stateId = 1;
            this.nodes = {};
            states = this.removeAll();
            states.each(function(item) {
                item.destroy();
            });
            this.renderPanel();
            if (this.get("entity")) {
                for (state in sm.get("states")) {
                    this.addState(sm.get("states")[state].get("editorPosition") ? sm.get("states")[state].get("editorPosition").get("x") || 30 : 30, sm.get("states")[state].get("editorPosition") ? sm.get("states")[state].get("editorPosition").get("y") || 30 : 30, parseInt(state), sm.get("states")[state]);
                }

                this.each(function() {
                    try {
                        this.makeAllOutgoingTransitions();
                    } catch (e) {
                        Y.error("Failed creating transition", e, "Y.Wegas.StateMachineViewer");
                    }
                });
            }
            this.highlightUnusedStates();
            jp.setSuspendDrawing(false, true);
            this.hideOverlay();
            this.syncUI();
            return true;

        },
        addStateType: function(type) {
            var x, y, entity = type === "State" ? new Y.Wegas.persistence.State() : new Y.Wegas.persistence.DialogueState();
            x = parseInt(this.get(CONTENT_BOX).one('.scrollable').get('region').width / 2 + this.scrollView.get('scrollX'));
            y = parseInt(this.get(CONTENT_BOX).one('.scrollable').get('region').height / 2 + this.scrollView.get('scrollY'));
            entity.set("editorPosition", new Y.Wegas.persistence.Coordinate({
                x: x,
                y: y
            }));
            this.setZoom(1, false); // force setting default zoom to have correct position
            this.addState(x, y, this.stateId, entity);
            this.save();
        },
        addState: function(x, y, id, entity) {
            if (!this.jpLoaded) {
                return null;
            }
            var state, config;
            config = {
                sid: id,
                initial: (+id === +this.get("entity").getInitialStateId()),
                entity: entity || null,
                x: x,
                y: y
            };
            if (!config.entity) {
                delete config.entity;
            }
            state = new Y.Wegas.State(config);
            this.add(state);
            this.nodes[id.toString()] = state;
            this.get("entity").get("states")[id.toString()] = state.get("entity");
            this.stateId = Math.max(this.stateId, parseInt(id) + 1);
            return state;
        },
        renderPanel: function() {
            if (!this.get("entity") || !this.get("entity").get("scope")) {
                return;
            }
            this.panel.append(this.panel.name);
            this.panel.append(this.panel.scope);

            this.panel.name.getDOMNode().value = this.get("entity").get("name");
            this.panel.scope.getDOMNode().value = this.get("entity").get("scope").get("@class");
        },
        processMenu: function(type) {
            var entity,
                    DEFAULTCB = {
                success: Y.bind(function(e) {
                    //this.showMessage("success", "States successfully saved", 1500);
                    this.hideOverlay();
                }, this),
                failure: Y.bind(function(e) {
                    this.showMessage("error", e.response.data.message);
                    this.hideOverlay();
                }, this)
            };
            switch (type) {
                case "load":
                    this.loader();
                    break;
                case "new":
//                    entity = new Y.Wegas.persistence.DialogueDescriptor();
                    entity = new Y.Wegas.persistence.StateMachineDescriptor();
                    entity.setInitialStateId(1); // TODO : the one specified :)
                    this.set("entity", entity);
                    break;
                default:
                    Y.log("Not Implemented yet: " + type, "warn", "Y.Wegas.StateMachineViewer");
            }
        },
        save: function() {
            var entity = this.get("entity"),
                DEFAULTCB = {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                    }, this),
                    failure: Y.bind(function(e) {
                        this.showMessage("error", e.response.data.message);
                        this.hideOverlay();
                    }, this)
                };
            if (entity) {
                this.showOverlay();
                entity = JSON.parse(JSON.stringify(entity));
                if (entity.id) {
                    Y.Wegas.Facade.VariableDescriptor.cache.put(entity, DEFAULTCB);
                } else {
                    Y.Wegas.Facade.VariableDescriptor.cache.post(entity, DEFAULTCB);
                }
            }
            this.highlightUnusedStates();
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
            var sm = this.get("entity");
            if (!sm || !this.nodes) {
                return;
            }
            this.get("boundingBox").all(".currentState").each(function() {
                this.removeClass("currentState");
            });
            if (this.nodes[sm.getInstance().get("currentStateId")]) {
                this.nodes[sm.getInstance().get("currentStateId")].get("boundingBox").addClass("currentState");
            }
        },
        highlightUnusedStates: function() {
            // Prepare vars
            var currentState, listPath = [this.nodes[this.get("entity").getInitialStateId()]], listStates = {}, i;
            
            this.get("boundingBox").all(".unusedState").each(function() {
                this.removeClass("unusedState");
            });
            // Prepare data
            for (i in this.nodes) {
                listStates[i] = this.nodes[i];
            }
            // Follow the path
            while (listPath.length > 0) {
                currentState = listPath.pop();
                // Test if state has been already visited
                if (listStates[currentState.get("sid")] != undefined) {
                    for (i in currentState.get("entity").get("transitions")) {
                        listPath.push(this.nodes[currentState.get("entity").get("transitions")[i].get("nextStateId")]);
                    }
                }
                delete listStates[currentState.get("sid")];
            }
            // Highlight
            for (i in listStates) {
                listStates[i].get("boundingBox").addClass("unusedState");
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
                    return o instanceof Y.Wegas.persistence.FSMDescriptor || o === null;
                }
            },
            availableStates: {
                value: ["State"]
            },
            availableTransitions: {
                value: ["Transition"]
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
            this.options = {};
            this.options.transitions = [];
            this.publish("userRemove", {
                emitFacade: true
            });
        },
        renderUI: function() {
            var bb = this.get(BOUNDING_BOX);
            bb.addClass(this.cssClass.state);

            /*if (this.get("entity") instanceof Y.Wegas.persistence.DialogueState) {
                this.textNode = new Y.Node.create("<textarea placeholder=\"Text (Response)\">" + this.get("entity").get("text") + "</textarea>");
                this.textNode.addClass(this.getClassName("text"));
                this.get(CONTENT_BOX).append(this.textNode);
            } else if (this.get("entity").get("onEnterEvent")) {
                this.add(new Y.Wegas.Script({
                    entity: this.get("entity").get("onEnterEvent")
                }));
            } else {
                this.add(new Y.Wegas.Script({}));
            }*/
            this.menuNode = new Y.Node.create("<div></div>");
            this.get(CONTENT_BOX).append(this.menuNode);
            
            if (this.get("sid")) {
                this.sidNode = new Y.Node.create("<div>" + this.get("sid") + "</div>");
                this.get(CONTENT_BOX).append(this.sidNode);
            }
            if (this.get("x")) {
                bb.setStyle("left", this.get("x") + "px");
            }
            if (this.get("y")) {
                bb.setStyle("top", this.get("y") + "px");
            }
            this.get(CONTENT_BOX).append("<div class='transition-start'/>");
            this.get(CONTENT_BOX).append("<div class='state-toolbox'><div class='state-initial'></div><div class='state-delete'></div></div>");

        },
        syncUI: function() {
            this.set("sid", this.get("sid"));
            this.set("initial", this.get("initial"));
        },
        bindUI: function() {
            var key;
            this.get(CONTENT_BOX).delegate("click", function(e) {
                this.deleteSelf();
            }, ".state-delete", this);
            this.get(CONTENT_BOX).delegate("click", function(e) {
                e.halt(true);
                                
                this.get("parent").get("entity").setInitialStateId(this.get("sid"));
                this.get("parent").get("boundingBox").all(".initial-state").each(function() {
                    this.removeClass("initial-state");
                });
                this.set("initial", true);
                
                this.get("parent").save();
            }, ".state-initial", this);
            jp.draggable(this.get(BOUNDING_BOX), {
                after: {
                    "end": Y.bind(this.dragEnd, this)
                }/* TODO : FIX
                 plugins:[{
                 fn:Y.Plugin.DDConstrained,
                 cfg:{
                 constrain:this.get("parent").get(CONTENT_BOX),
                 gutter: "30 10 10 10"
                 }
                 },
                 {
                 fn:Y.Plugin.DDNodeScroll,
                 cfg:{
                 node:this.get("parent").get(BOUNDING_BOX).get("parentNode")
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
                    return false;
                }
            });
            jp.makeSource(this.get(BOUNDING_BOX).one('.transition-start'), {
                parent: this.get(BOUNDING_BOX)
            });
            if (this.textNode) {
                this.textNode.on("change", function(e) {
                    var val = e.target.getDOMNode().value;
                    if (val === "") {                                              //Set an empty String to null
                        val = null;
                    }
                    this.get("entity").set("text", val);
                }, this);
            }
            this.get(CONTENT_BOX).on('click', function(e) {
                Y.Plugin.EditEntityAction.showEditForm(this.get("entity"), Y.bind(this.setEntity, this));
            }, this);
            
            this.on("wegas-transition:destroy", function(e) {
                var index = this.transitionsTarget.indexOf(e.target);
                if (index > -1) {
                    this.transitionsTarget.splice(index, 1);
                }
            });
            
            for (key in this.get("parent").get("availableTransitions")) {
                this.options.transitions.push({
                    type: "Button",
                    label: this.get("parent").get("availableTransitions")[key],
                    on: {
                        click: Y.bind(this.addTransitionType, this, this.get("parent").get("availableTransitions")[key])
                    }
                });
            }
            this.menuNode.plug(Y.Plugin.WidgetMenu, {
                children: this.options.transitions
            });
        },
        addTransitionType: function(type) {
            if (this.source != null) {
                var tr = type === "Transition" ? new Y.Wegas.persistence.Transition() : new Y.Wegas.persistence.DialogueTransition();
                tr.set("nextStateId", this.get("sid"));
                this.source.add(new Y.Wegas.Transition({
                    entity: tr
                })).item(0).connect(this.source.get("sid") === this.get("sid"));
                this.source.get("entity").get("transitions").push(tr);
                this.get("parent").save();
                this.source = null;
            }
        },
        dragEnd: function(e) {
            if (this.get("entity").get("editorPosition")) {
                this.get("entity").get("editorPosition").setAttrs({
                    x: parseInt(Y.one(e.target.el).getStyle("left")),
                    y: parseInt(Y.one(e.target.el).getStyle("top"))
                });
            } else {
                this.get("entity").set("editorPosition", new Y.Wegas.persistence.Coordinate({
                    x: parseInt(Y.one(e.target.el).getStyle("left")),
                    y: parseInt(Y.one(e.target.el).getStyle("top"))
                }));
            }
            this.get("parent").save();
        },
        setEntity: function(entity) {
            var e;
            e = Y.Wegas.Editable.reviver(entity);
            this.get("entity").set("onEnterEvent", e.get("onEnterEvent")); // Only change onEnterEvent
            Y.Plugin.EditEntityAction.hideEditFormOverlay();
        },
        addTransition: function(target) {
            var tr;
            if (this.get("parent").get("availableTransitions").length > 1) {
                target.source = this;
                target.stateId = target.get("sid");
                target.menuNode.menu.show(); // show menu to select transition type
            }
            else if (this.get("parent").get("availableTransitions").length === 1) {
                tr = this.get("parent").get("availableTransitions")[0] === "Transition" ? new Y.Wegas.persistence.Transition() : new Y.Wegas.persistence.DialogueTransition();
                tr.set("nextStateId", target.get("sid"));
                this.add(new Y.Wegas.Transition({
                    entity: tr
                })).item(0).connect(this.get("sid") === target.get("sid"));
                this.get("entity").get("transitions").push(tr);
                this.get("parent").save();
            }
            else {
                Y.log("No transition available");
            }
        },
        deleteSelf: function() {
            while (this.transitionsTarget.length > 0) {
                this.transitionsTarget[0].disconnect();
            }
            this.fire("userRemove");
            this.destroy();
            if (this.get("sid") === this.get("parent").get("entity").getInitialStateId()) {
                var id = this.getNextStateId();
                if (id != null) {
                    this.get("parent").get("entity").setInitialStateId(id);
                    this.get("parent").get("boundingBox").all(".initial-state").each(function() {
                        this.removeClass("initial-state");
                    });
                    this.get("parent").nodes[id].set("initial", true);
                }
            }
            this.get("parent").save();
        },
        makeAllOutgoingTransitions: function() {
            var i, transitions = this.get("entity").get("transitions");
            for (i in transitions) {
                this.add(new Y.Wegas.Transition({
                    entity: transitions[i]
                })).item(0).connect(transitions[i].get("nextStateId") === this.get("sid"));
            }
        },
        getNextStateId: function() {
            var id;
            for (id in this.get("parent").get("entity").get("states")) {
                return id;
            }
            return null;
        }
    }, {
        ATTRS: {
            sid: {
                value: 0,
                setter: function(v) {
                    this.get(BOUNDING_BOX).setAttribute("sid", v);
                    return v;
                }
            },
            entity: {
                valueFn: function() {
                    return new Y.Wegas.persistence.State();
//                    return new Y.Wegas.persistence.DialogueState();
                },
                validator: function(o) {
                    return o instanceof Y.Wegas.persistence.State;
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

    Script = Y.Base.create('wegas-script', Y.Widget, [Y.WidgetChild], {
        cssClass: {
            language: 'language',
            script: 'script'
        },
        content: null,
        language: null,
        CONTENT_TEMPLATE: null,
        initializer: function() {
            this.publish("scriptContentUpdated", {
                emitFacade: true,
                bubbles: true
            });
        },
        renderUI: function() {
            this.content = new Y.Node.create("<textarea placeholder=\"onEnterEvent (Script Impact)\"></textarea>");
            this.language = new Y.Node.create("<div></div>");
            this.content.addClass(this.getClassName(this.cssClass.script));
            this.language.addClass(this.getClassName(this.cssClass.language));
            this.get(CONTENT_BOX).append(this.content);
            this.get(CONTENT_BOX).append(this.language);
        },
        syncUI: function() {
            this.set("entity", this.get("entity"));
        },
        bindUI: function() {
            this.content.on("change", function(e) {
                e.stopImmediatePropagation();
                this.get("entity").set("content", this.content.getDOMNode().value);
                if (!this.get("entity").isValid()) {
                    //TODO: visual annotation
                }
                this.fire("scriptContentUpdated", {
                    content: this.get("entity").get("content"),
                    valid: this.get("entity").isValid()
                });
            }, this);

        }
    }, {
        ATTRS: {
            entity: {
                valueFn: function() {
                    return new Y.Wegas.persistence.Script();
                },
                validator: function(o) {
                    return o instanceof Y.Wegas.persistence.Script;
                },
                setter: function(o) {
                    this.language.setContent(o.get("language"));
                    this.content.setContent(o.get("content"));
                    return o;
                }
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
            if (this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition) {

                this.actionNode = new Y.Node.create("<textarea placeholder=\"actionText (button's label)\"/>");
                this.actionNode.addClass(this.getClassName("text"));
                this.get(CONTENT_BOX).append(this.actionNode);
                this.actionNode.setContent(this.get("entity").get("actionText"));
            } else if (this.get("entity").get("triggerCondition")) {
//                this.add(new Y.Wegas.Script({
//                    entity: this.get("entity").get("triggerCondition")
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
                    if (val === "" || val === undefined) {                                              //Set an empty String to null
                        val = null;
                    }
                    this.get("entity").set("actionText", val);
                }, this);
            }
        },
        connect: function(loopback) {
            this.get(BOUNDING_BOX).appendTo(this.get("parent").get("parent").get(CONTENT_BOX).one(".sm-zoom"));
            var nextStateId = this.get("entity").get("nextStateId");
            this.source = this.get('parent');
            this.target = this.get("parent").get("parent").nodes[nextStateId.toString()];

            this.connection = jp.connect({
                source: this.source.get(BOUNDING_BOX),
                target: this.target.get(BOUNDING_BOX),
                deleteEndpointsOnDetach: true,
                uniqueEndpoint: false,
                parameters: {
                    transition: this
                },
                connector: loopback ? "StateMachine" : "Flowchart"
            });
            this.addTarget(this.target);
            this.target.transitionsTarget.push(this);  
            this.createLabel();
            
            //this could be if we listen to click events on complete connector(ie arrow + label)
            this.connection.canvas.setAttribute("cursor", "pointer");
            this.connection.canvas.entity = this;
            this.connection.canvas.onmouseover = function() {
                this.entity.labelNode.canvas.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:inline-block;");
            };
            this.connection.canvas.onmouseout = function() {
                this.entity.labelNode.canvas.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:none;");
            };
        },
        disconnect: function(e) {
            jp.detach(this.connection, {
                fireEvent: true
            });
        },
        setEntity: function(entity) {
            var i, e = Y.Wegas.Editable.revive(entity);

            for (i in e) {
                if (e.hasOwnProperty(i)) {
                    this.get("entity")[i] = e[i];
                }
            }
            Y.Plugin.EditEntityAction.hideEditFormOverlay();
            this.createLabel();
        },
        createLabel: function() {
            if (this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition) {
                this.connection.setLabel({
                    label: this.get("entity").get("actionText") + "<br />" + Transition.TOOLBOX,
                    cssClass: "transition-label"
                });
            } else {
                this.connection.setLabel({
                    label: (this.get("entity").get("triggerCondition") ? this.get("entity").get("triggerCondition").get("content") + "<br />" + Transition.TOOLBOX : "&nbsp;" + Transition.TOOLBOX + "&nbsp;"),
                    cssClass: "transition-label"
                });
            }
            this.labelNode = this.connection.getLabelOverlay();            
            if (this.labelNode) {
                Y.one(this.labelNode.getElement()).delegate("click", function (e) {
                    Y.Plugin.EditEntityAction.showEditForm(this.get("entity"), Y.bind(this.setEntity, this));
                }, ".transition-edit", this);
                Y.one(this.labelNode.getElement()).delegate("click", function (e) {
                    var i, transitions = this.get("parent").get("entity").get("transitions");
                    for (i in transitions) {
                        if (transitions[i] === this.get("entity")) {
                            transitions.splice(i, 1);
                        }
                    }
                    this.get("parent").get("parent").save();
                    this.disconnect();
                    this.destroy();
                }, ".transition-delete", this);
                this.labelNode.canvas.onmouseover = function() {
                    this.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:inline-block;");
                };
                this.labelNode.canvas.onmouseout = function() {
                    this.getElementsByClassName("transition-toolbox")[0].setAttribute("style", "display:none;");
                };
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
        TOOLBOX: "<div class='transition-toolbox'><div class='transition-edit'></div><div class='transition-delete'></div></div>",
        ATTRS: {
            tid: {
                value: null,
                validator: Y.Lang.isNumber
            },
            entity: {
                valueFn: function() {
                    var e = new Y.Wegas.persistence.Transition();
                    return e;
                }
            }
        }
    });

    Y.namespace('Wegas').StateMachineViewer = StateMachineViewer;
    Y.namespace('Wegas').State = State;
    Y.namespace('Wegas').Transition = Transition;
    Y.namespace('Wegas').Script = Script;
});
