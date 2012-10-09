/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

YUI.add('wegas-statemachineviewer', function (Y) {
    "use strict";

    var StateMachineViewer, State, Transition, Script,
    jp,
    getClassName = Y.ClassNameManager.getClassName,
    CONTENT_BOX = 'contentBox',
    BOUNDING_BOX = 'boundingBox',
    DEFAULTHEADERS = {
        'Content-Type': 'application/json; charset=ISO-8859-1'
    };

    StateMachineViewer = Y.Base.create("wegas-statemachineviewer", Y.Widget, [Y.Wegas.Widget, Y.WidgetParent, Y.WidgetChild], {
        //TODO : zoom on simple scroll (ie without altKey), move panel with mouse (overflow hidden); zoom disabled
        //Zoom and Endpoint pos, sould mult by zoom
        //DRAG and Zoom, same problem
        //InitialState modification
        //Highlight irrelevent states, notinitial and no incoming transition
        //Ability to move a transition, currently destroying and recreating a new one

        CONTENT_TEMPLATE: "<div></div>",
        panel: null,
        header: null,
        jpLoaded :false,
        stateId: null,
        currentZoom: null,
        events: {},
        cacheDialogue:null,
        nodes:{},

        initializer: function() {
            this.currentZoom = 1;
            this.stateId = 1;
            this.jpLoaded = false;
            // Waiting for jsPlumb
            this.publish("jsPlumbLoaded",{
                bubbles:false,
                fireOnce:true,
                async:true,
                broadcast:true
            })
            window.jsPlumb.ready(Y.bind(function(){
                this.initJsPlumb();
            }, this));
        },
        initJsPlumb: function(){
            jp = window.jsPlumb.getInstance({
                Container : this.get(CONTENT_BOX),
                Anchor : "Continuous",
                Endpoint : ["Dot", {
                    radius : 6
                }],
                //                Connector : [ "Flowchart", {
                //                    stub:[40, 40],
                //                    gap:10
                //                } ],
                Connector : ["StateMachine", {
                    curviness:60,
                    proximityLimit:100
                }],
                ConnectionOverlays : [["Arrow", {
                    location : 1,
                    width: 15
                }]],
                PaintStyle : {
                    lineWidth : 3,
                    strokeStyle : "#11F",
                    outlineColor:"white",
                    outlineWidth:3
                }
            });
            this.events.transitionDeleted = jp.bind("jsPlumbConnectionDetached", function(e){
                //Clean panel
                try{
                    jp.deleteEndpoint(e.sourceEndpoint);
                    jp.deleteEndpoint(e.targetEndpoint);
                }catch(e){
                    console.log("warn", e);
                }
            });
            this.events.deleteTransition = jp.bind("beforeDetach", function(e){
                var transitions;
                transitions = e.getParameter("transition").source.get("entity").get("transitions");
                for(var i in transitions){
                    if(transitions[i] === e.getParameter("transition").get("entity") ){
                        transitions.splice(i,1);
                    }
                }
                e.getParameter("transition").destroy();
                return true;
            });
            this.jpLoaded = true;
            this.fire("jsPlumbLoaded");
            this.fire("rebuild");
        },
        renderUI: function() {
            this.panel = this.toolbar.get("panel");
            this.header = this.toolbar.get("header");

            this.toolbar.add( new Y.Button({
                label:"<span class=\"wegas-icon wegas-icon-save\"></span>Save",
                on:{
                    'click': function (e){
                        this.fire("save");
                    }
                }
            })).set("type", "save");
            this.panel.name = Y.Node.create("<input type='text' name='name' placeholder='Name'></input>");
            this.panel.scope = Y.Node.create("<select name='scope'><option value='GameScope'>GameScope</option><option value='TeamScope'>TeamScope</option><option value='PlayerScope'>PlayerScope</option></select>");
            this.renderPanel();
            this.get(CONTENT_BOX).setStyle("zoom", this.currentZoom);
        },

        bindUI: function() {
            this.on("rebuild", function(e){
                e.halt(true);
                this.showOverlay();
                Y.later(30, this, this.rebuild);
            })
            this.events.toolbarNodeNew = this.on("button:load", function(e){
                this.processMenu("load");
            });
            this.events.toolbarNodeNew = this.on("button:new", function(e){
                this.processMenu("new");
            });

            this.events.toolbarNodeSave = this.on("button:save", function(e){
                this.processMenu("save");
            });
            this.events.createNode = this.get(CONTENT_BOX).on("dblclick", function(e){
                e.halt(true);
                //TODO : something with Zoom
                if(e.target == this.get(CONTENT_BOX) && this.get("entity")){
                    this.addState(e.clientX - this.get(CONTENT_BOX).getX() - 30, e.clientY - this.get(CONTENT_BOX).getY() - 30, this.stateId);
                }
            }, this);

            this.events.smUpdate = this.after("entityChange", function (e){
                this.fire("rebuild");
            });
            this.events.zoom = this.get(CONTENT_BOX).delegate("mousewheel", function (e){
                if(e.altKey){
                    e.halt(true);
                    this.zoom(e);
                }
            }, ".yui3-wegas-statemachineviewer-content", this);
            this.events.stateDestroy = this.on("wegas-state:userRemove", function(e){
                delete this.get("entity").get("states")[e.target.get("sid").toString()];
                delete this.nodes[e.target.get("sid").toString()];
            });
            this.events.nameChange = this.panel.name.on("change", function(e){
                this.get("entity").set("name", e.target.getDOMNode().value);
            }, this);
            this.events.scopeChange = this.panel.scope.on("change", function(e){
                this.get("entity").set("scope", new Y.Wegas.persistence[e.target.getDOMNode().value]());
            }, this);
        },
        syncUI: function(){

        },
        destructor: function (){
            var i;
            jp.unload();
            for(i in this.events){
                try{
                    this.events[i].detach();
                } catch(e){
                    this.events[i].unbind();
                }
            }
            delete this.nodes;
            delete this.events;
        },
        loader: function(){
            var tmp;
            if(!this.panel.loader){
                this.cacheDialogue = Y.Wegas.VariableDescriptorFacade.rest.filter("@class", "DialogueDescriptor");
                tmp = "<select><option>Select</option>";
                for(var i in this.cacheDialogue){
                    tmp += "<option value='" + this.cacheDialogue[i].get("id") + "'>" + this.cacheDialogue[i].get("name") + "</option>";
                }
                tmp += "</select>";
                this.panel.loader = Y.Node.create(tmp);
                this.panel.append(this.panel.loader);
                this.panel.loader.on("change", function(e){
                    if(e.target.getDOMNode().value){
                        this.set("entity", Y.Wegas.VariableDescriptorFacade.rest.find("id", parseInt(e.target.getDOMNode().value)));
                    }
                    this.panel.loader.remove(true);
                    this.panel.loader = null;
                }, this);
            }
        },
        rebuild: function(){
            if(!this.jpLoaded){
                this.hideOverlay();
                return false;
            }
            var state, states, sm = this.get("entity");
            this.stateId = 1;
            this.nodes = {};
            states = this.removeAll();
            states.each(function(item){
                item.destroy();
            });
            this.renderPanel();
            if(this.get("entity")){
                for(state in sm.get("states")){
                    this.addState(sm.get("states")[state].get("editorPosition") ? sm.get("states")[state].get("editorPosition").get("x") || 30 : 30, sm.get("states")[state].get("editorPosition")?sm.get("states")[state].get("editorPosition").get("y") || 30 : 30, parseInt(state), sm.get("states")[state]);
                }

                this.each(function () {
                    try{
                        this.makeAllOutgoingTransitions();
                    }catch(e){
                        console.error("Transition", this, e);
                    }
                });
            }
            this.hideOverlay();
            return true;

        },
        addState: function(x, y, id, entity){
            if(!this.jpLoaded){
                return null;
            }
            var state, config;
            config = {
                sid: id,
                initial: (id == this.get("entity").getInitialStateId()),
                entity: (entity ? entity : null),
                x: x,
                y: y
            };
            if(!config.entity){
                delete config.entity;
            }
            state = new Y.Wegas.State(config);
            try{
                this.add(state);
            }catch(e){
                //Really ... should find the problem, this currently goes quite well
                console.error(e.message,e.stack);
                this.add(state);
            }
            this.nodes[id.toString()] = state;
            this.get("entity").get("states")[id.toString()] = state.get("entity");
            this.stateId = Math.max(this.stateId, parseInt(id) + 1);
            return state;
        },
        renderPanel: function(){
            if(!this.get("entity") || !this.get("entity").get("scope")){
                return false;
            }
            this.panel.append(this.panel.name);
            this.panel.append(this.panel.scope);

            this.panel.name.getDOMNode().value = this.get("entity").get("name");
            this.panel.scope.getDOMNode().value = this.get("entity").get("scope").get("@class");
            return true;
        },
        processMenu: function(type){
            var entity,
            DEFAULTCB = {
                success: Y.bind(function(e){
                    this.showMessage("success", "States successfully saved", 1500);
                    this.hideOverlay();
                }, this),
                failure: Y.bind(function(e){
                    this.showMessage("error", e.response.data.message);
                    this.hideOverlay();
                }, this)
            };
            switch(type){
                case "load":
                    this.loader();
                    break;
                case "new":
                    entity = new Y.Wegas.persistence.DialogueDescriptor();
                    entity.setInitialStateId(1);
                    this.set("entity", entity);
                    break;
                case "save":
                    entity = this.get("entity");
                    if(entity){
                        this.showOverlay();
                        entity = JSON.parse(JSON.stringify(entity));
                        if(entity.id){
                            Y.Wegas.VariableDescriptorFacade.rest.put(entity, DEFAULTCB);
                        }else{
                            Y.Wegas.VariableDescriptorFacade.rest.post(entity, DEFAULTCB);
                        }
                    }
                    break;
                default:
                    console.log("Not Implemented yet");
            }
        },
        zoom: function (event){
            return ; //zoom disabled
            if(event.wheelDelta < 0){
                this.currentZoom = (this.currentZoom < 0.35 ) ? 0.3 : this.currentZoom - 0.05;
            }else{
                this.currentZoom = (this.currentZoom > 1.95 ) ? 2 : this.currentZoom + 0.05;
            }
            this.get(CONTENT_BOX).setStyle("zoom", this.currentZoom);
        }
    }, {
        ATTRS:{
            entity:{
                value : null,
                validator: function (o){
                    return o instanceof Y.Wegas.persistence.FSMDescriptor || o == null;
                }
            }
        }
    });

    State = Y.Base.create('wegas-state', Y.Widget, [Y.WidgetChild, Y.WidgetParent], {
        textNode:null,
        transitionsTarget:[],                                                   //store incomming transitions
        events:{},
        cssClass: {
            state: 'statemachine-state',
            initial: 'initial-state'
        },
        CONTENT_TEMPLATE: null,
        //TODO : use localStorage for positions !
        initializer: function () {
            this.transitionsTarget = [];
            this.get(BOUNDING_BOX).addClass(this.cssClass.state);
            if(this.get("entity") instanceof Y.Wegas.persistence.DialogueState){
                this.textNode = new Y.Node.create("<textarea placeholder=\"Text (Response)\"></textarea>");
                this.textNode.addClass(this.getClassName("text"));
            }
            this.publish("userRemove",{
                emitFacade:true
            });
        },

        renderUI: function () {
            if(this.textNode){
                this.get(CONTENT_BOX).append(this.textNode);
                this.textNode.setContent(this.get("entity").get("text"));
            }else if(this.get("entity").get("onEnterEvent")){
                this.add(new Y.Wegas.Script({
                    entity:this.get("entity").get("onEnterEvent")
                }));
            } else {
                this.add(new Y.Wegas.Script({}));
            }
            if(this.get("x")){
                this.get(BOUNDING_BOX).getDOMNode().style.left = this.get("x") + "px";
            }
            if(this.get("y")){
                this.get(BOUNDING_BOX).getDOMNode().style.top = this.get("y") + "px";
            }
            this.get(CONTENT_BOX).append("<div class='transition-start'/>");
            this.get(CONTENT_BOX).append("<div class='state-toolbox'><div class='state-edit'></div><div class='state-delete'></div></div>");

        },
        syncUI: function(){
            this.set("sid", this.get("sid"));
            this.set("initial", this.get("initial"));
        },
        bindUI: function (){
            this.events.deleteState = this.get(CONTENT_BOX).delegate("click", function (e){
                this.deleteSelf();
            },".state-delete", this);
            jp.draggable(this.get(BOUNDING_BOX), {
                after:{
                    "end":Y.bind(this.dragEnd, this)
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
                dropOptions:{
                    hoverClass:"droppable-state"
                },
                uniqueEndpoint:false,
                deleteEndpointsOnDetach:true,
                beforeDrop: function(e){
                    var s,t;
                    s=Y.Widget.getByNode("#"+e.sourceId);
                    t=Y.Widget.getByNode("#"+e.targetId);
                    s.addTransition(t);
                    return false;
                }
            });
            jp.makeSource(this.get(BOUNDING_BOX).one('.transition-start'), {
                parent:this.get(BOUNDING_BOX)
            });
            if(this.textNode){
                this.events.textNodeChange = this.textNode.on("change", function(e){
                    var val = e.target.getDOMNode().value;
                    if(val == ""){                                              //Set an empty String to null
                        val = null;
                    }
                    this.get("entity").set("text", val)
                }, this);
            }
            this.events.editState= this.get(CONTENT_BOX).delegate("click",function(e){
                if(this.get("entity").get("onEnterEvent")){
                    Y.Plugin.EditEntityAction.showEditForm(this.get("entity").get("onEnterEvent"),  Y.bind(this.setOnEnterEvent, this));
                }else{
                    Y.Plugin.EditEntityAction.showEditForm(new Y.Wegas.persistence.Script(), Y.bind(this.setOnEnterEvent, this));
                }
            },".state-edit",this);
            this.events.transitionDelete = this.on("wegas-transition:destroy", function(e){
                var index = this.transitionsTarget.indexOf(e.target);
                if( index > -1){
                    this.transitionsTarget.splice(index, 1);
                }
            });

        },
        destructor: function(){
            var i;
            for(i in this.events){
                this.events[i].detach();
            }
        },
        dragEnd:function(e){
            if(this.get("entity").get("editorPosition")){
                this.get("entity").get("editorPosition").setAttrs({
                    x:parseInt(e.target.el.getStyle("left")),
                    y:parseInt(e.target.el.getStyle("top"))
                });
            }else{
                this.get("entity").set("editorPosition", new Y.Wegas.persistence.Coordinate({
                    x:parseInt(e.target.el.getStyle("left")),
                    y:parseInt(e.target.el.getStyle("top"))
                }));
            }
        },
        setOnEnterEvent:function (entity){
            entity = entity instanceof Y.Wegas.persistence.Script ? entity : Y.Wegas.persistence.Editable.readObject(entity);
            this.get("entity").set("onEnterEvent", entity);
        },
        addTransition: function(target){
            var tr;
            tr = new Y.Wegas.persistence.DialogueTransition();
            tr.set("nextStateId", target.get("sid"));
            this.add(new Y.Wegas.Transition({
                entity:tr
            })).item(0).connect();
            this.get("entity").get("transitions").push(tr);
        },
        deleteSelf: function (){
            while(this.transitionsTarget.length > 0){
                this.transitionsTarget[0].disconnect();
            }
            this.fire("userRemove");
            this.destroy();
        },
        makeAllOutgoingTransitions: function (){
            var i, transitions = this.get("entity").get("transitions");
            for (i in transitions){
                this.add(new Y.Wegas.Transition({
                    entity:transitions[i]
                })).item(0).connect();
            }
        }
    }, {
        ATTRS:{
            sid:{
                value:0,
                setter: function(v){
                    this.get(BOUNDING_BOX).setAttribute("sid", v);
                    return v;
                }
            },
            entity:{
                valueFn: function () {
                    return new Y.Wegas.persistence.DialogueState();
                },
                validator: function (o){
                    return o instanceof Y.Wegas.persistence.State;
                }
            },
            initial:{
                value: false,
                validator: Y.Lang.isBoolean,
                setter:function (v) {
                    if(v){
                        this.get(BOUNDING_BOX).addClass(this.cssClass.initial);
                    }else{
                        this.get(BOUNDING_BOX).removeClass(this.cssClass.initial);
                    }
                    return v;
                }
            },
            x:{
                value: null,
                validator: Y.Lang.isInteger
            },
            y:{
                value: null,
                validator: Y.Lang.isInteger
            }
        }
    });

    Script = Y.Base.create('wegas-script', Y.Widget, [Y.WidgetChild], {
        events:{},
        cssClass: {
            language: 'language',
            script: 'script'
        },
        content:null,
        language:null,
        CONTENT_TEMPLATE:null,
        initializer: function () {
            this.content = new Y.Node.create("<textarea placeholder=\"onEnterEvent (Script Impact)\"></textarea>");
            this.language = new Y.Node.create("<div></div>");
            this.content.addClass(this.getClassName(this.cssClass.script));
            this.language.addClass(this.getClassName(this.cssClass.language));
            this.publish("scriptContentUpdated", {
                emitFacade: true,
                bubbles: true
            });
        },
        renderUI: function () {
            this.get(CONTENT_BOX).append(this.content);
            this.get(CONTENT_BOX).append(this.language);
        },
        syncUI: function(){
            this.set("entity", this.get("entity"));
        },
        bindUI: function (){
            this.events.contentChange = this.content.on("change", function(e){
                e.stopImmediatePropagation();
                this.get("entity").set("content", this.content.getDOMNode().value);
                if(!this.get("entity").isValid()){
                //TODO: visual annotation
                }
                this.fire("scriptContentUpdated",{
                    content: this.get("entity").get("content"),
                    valid: this.get("entity").isValid()
                });
            }, this);

        },
        destructor: function(){
            for(var i in this.events){
                this.events[i].detach();
            }
        }

    }, {
        ATTRS:{
            entity:{
                valueFn: function(){
                    return new Y.Wegas.persistence.Script();
                },
                validator: function(o){
                    return o instanceof Y.Wegas.persistence.Script;
                },
                setter: function(o){
                    this.language.setContent(o.get("language"));
                    this.content.setContent(o.get("content"));
                    return o;
                }
            }
        }
    });

    Transition = Y.Base.create('wegas-transition', Y.Widget, [Y.WidgetParent, Y.WidgetChild], {
        events:{},
        connector: null,
        source:null,
        target:null,
        actionNode:null,
        initializer: function () {
            if(this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition){
                this.actionNode = new Y.Node.create("<textarea placeholder=\"actionText (button's label)\"/>");
                this.actionNode.addClass(this.getClassName("text"));
            }
        },
        renderUI: function(){
            this.hide();
            if(this.actionNode){
                this.get(CONTENT_BOX).append(this.actionNode);
                this.actionNode.setContent(this.get("entity").get("actionText"));
            }else if(this.get("entity").get("triggerCondition")){
                this.add(new Y.Wegas.Script({
                    entity:this.get("entity").get("triggerCondition")
                }));
            }
            this.get(CONTENT_BOX).append("<div class='transition-edit'></div>");
        },
        bindUI: function (){
            this.events.modalClick = this.get(BOUNDING_BOX).on("click", function(e){
                e.stopImmediatePropagation();
                if(e.target == this.get(BOUNDING_BOX)){
                    this.hide();
                }
            }, this);
            if(this.actionNode){
                this.events.actionTextChange = this.actionNode.on("change", function (e){
                    var val = e.target.getDOMNode().value;
                    this.connector.setLabel(val);
                    if(val == "" || val == undefined){                                              //Set an empty String to null
                        val = null;
                    }
                    this.get("entity").set("actionText", val);
                }, this);
            }
            this.events.editTransition= this.get(CONTENT_BOX).delegate("click",function(e){
                if(this.get("entity").get("triggerCondition")){
                    Y.Plugin.EditEntityAction.showEditForm(this.get("entity").get("triggerCondition"),  Y.bind(this.setTriggerCondition, this));
                }else{
                    Y.Plugin.EditEntityAction.showEditForm(new Y.Wegas.persistence.Script(), Y.bind(this.setTriggerCondition, this));
                }
            },".transition-edit",this);

            this.events.scriptUpdate = this.on("wegas-script:scriptContentUpdated", function (e){
                this.connector.setLabel(e.content);
            //TODO : need some more control, waiting to have full script transition management
            //                if(this.get("entity").triggerCondition.isEmpty()){
            //                    this.each(function(){
            //                        if(this instanceof Y.Wegas.Script){
            //                            this.destroy();
            //                        }
            //                    });
            //                    this.get("entity").triggerCondition = null;
            //                }
            }, this);
        },
        connect: function(){
            this.get(BOUNDING_BOX).appendTo(this.get("parent").get("parent").get(CONTENT_BOX));
            var nextStateId = this.get("entity").get("nextStateId");
            this.source = this.get('parent');
            this.target = this.get("parent").get("parent").nodes[nextStateId.toString()];
            try{
                this.connector = jp.connect({
                    source:this.source.get(BOUNDING_BOX),
                    target:this.target.get(BOUNDING_BOX),
                    deleteEndpointsOnDetach:true,
                    uniqueEndpoint:false,
                    parameters:{
                        transition:this
                    }
                });
                this.addTarget(this.target);
                this.target.transitionsTarget.push(this);
            //this could be if we listen to click events on complete connector(ie arrow + label)
            // this.connector.canvas.setAttribute("cursor", "pointer");
            }catch(e){
                console.error("Connection failed", e);
            }
            this.createLabel();
        },
        //
        disconnect :function(e){
            jp.detach(this.connector, {
                fireEvent:true
            });
        },
        setTriggerCondition: function (entity){
            entity = entity instanceof Y.Wegas.persistence.Script ? entity : Y.Wegas.persistence.Editable.readObject(entity);
            this.get("entity").set("triggerCondition", entity);
        },
        createLabel: function () {
            if(this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition){
                this.connector.setLabel({
                    label:this.get("entity").get("actionText"),
                    cssClass:"transition-label"
                });
            } else if (!(this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition) && this.get("entity").triggerCondition) {
                this.connector.setLabel({
                    label:this.get("entity").get("triggerCondition").get("content"),
                    cssClass: "transition-label"
                });
            }
            this.labelNode = this.connector.getLabelOverlay();
            this.events.labelClick = this.labelNode.bind("click", function (e){
                var that = e.component.getParameter("transition");
                that.editor();
            });
        //Listen to complete connector
        //            this.events.conClick = this.connector.bind("click", function (e){
        //                var that = e.getParameter("transition");
        //                that.editor();
        //            });

        },
        editor: function(){
            var x,y;
            x = parseInt(this.labelNode.getElement().style.left);
            y = parseInt(this.labelNode.getElement().style.top);
            this.get(CONTENT_BOX).setStyle("left", (x - 5) + "px");
            this.get(CONTENT_BOX).setStyle("top", (y - 5) + "px");
            this.show();
        },
        destructor: function (){
            jp.detach(this.connector, {
                forceDetach:true
            });
            for(var i in this.events){
                try{
                    this.events[i].detach();
                }catch(e){
                    this.events[i].unbind();
                }
            }
        }
    }, {
        ATTRS:{
            tid:{
                value:null,
                validator: Y.Lang.isNumber
            },
            entity:{
                valueFn: function (){
                    var e = new Y.Wegas.persistence.Transition();
                    return e;
                }
            }
        }
    });

    Y.namespace('Wegas').StateMachineViewer = StateMachineViewer;
    Y.namespace('Wegas').State = State
    Y.namespace('Wegas').Transition = Transition;
    Y.namespace('Wegas').Script = Script;
});
