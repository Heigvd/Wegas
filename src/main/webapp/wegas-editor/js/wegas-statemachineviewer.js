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
        'Content-Type': 'application/json; charset=utf-8'
    };

    StateMachineViewer = Y.Base.create("wegas-statemachineviewer", Y.Widget, [Y.WidgetParent], {
        CONTENT_TEMPLATE: null,
        panel: null,
        dialog: null,
        stateId: null,
        nodes:{},

        initializer: function() {
            jp = window.jsPlumb.getInstance()
            /*
             * jsPlumb Config
             */
            jp.Defaults.Container = this.get(CONTENT_BOX);
            jp.Defaults.Anchor = "Continuous";
            jp.Defaults.Endpoint = ["Dot", {
                radius : 6
            }];
            //            jp.Defaults.Connector = [ "Flowchart", {
            //                stub:[40, 40],
            //                gap:10
            //            } ];
            jp.Defaults.Connector = "StateMachine";
            jp.Defaults.ConnectionOverlays = [["Arrow", {
                location : 1,
                width: 15
            }]];
            jp.Defaults.PaintStyle = {
                lineWidth : 3,
                strokeStyle : "#11F",
                outlineColor:"white",
                outlineWidth:3
            };
            this.stateId = 1;
            this.panel = Y.Node.create("<div class=" + this.getClassName('draw') + "><div/>");
            this.dialog= Y.Node.create("<div class=" + this.getClassName('dialog') + "><div/>");

        },
        renderUI: function() {

        },

        bindUI: function() {
            this.get(CONTENT_BOX).on("dblclick", function(e){
                e.stopImmediatePropagation();
                if(e.target == this.get(CONTENT_BOX)){
                    this.addState(e.clientX - this.get(CONTENT_BOX).getXY()[0] - 30, e.clientY - this.get(CONTENT_BOX).getXY()[1] - 30);
                }
            }, this);
            jp.bind("beforeDetach", function(e){
                var transitions;
                transitions = e.getParameters().transition.get("parent").get("entity").transitions;
                for(var i in transitions){
                    if(transitions[i] === e.getParameters().transition.get("entity") ){
                        transitions.splice(i,1);
                        e.getParameters().transition.get("parent").set("entity", e.getParameters().transition.get("parent").get("entity"));
                    }
                }


                e.getParameters().transition.destroy();

                return true;

            });
            //Clean panel
            jp.bind("jsPlumbConnectionDetached", function(e){
                try{
                    jp.deleteEndpoint(e.sourceEndpoint);
                    jp.deleteEndpoint(e.targetEndpoint);
                }catch(e){
                    console.log("warn", e);
                }
            });
        //            this.on("wegas-state:entityChange", function(e){
        //                console.log("New entity :",e.target.get("sid"), e.newVal);
        //                this.get("entity").states[e.target.get("sid")] = e.newVal;
        //            });
        },
        destructor: function (){
            jp.unload();
        },
        rebuild: function(sm){
            var state, initial = false;
            this.stateId = 1;
            //A reference seems to still exist. Clean
            //            for(state in this._items){
            //                this._items[state].destroy();
            //                delete this._items[state];
            //            }
            this.each(function(){
                this.destroy();
            })


            this.nodes = {};

            this.get("parent").get("toolbarNode").one(".title").setContent(sm["@class"] + " -- " + sm.name); //TODO : could certainly be better

            for(state in sm.states){
                if(sm.getInitialStateId() == parseInt(state)){
                    initial = true;
                }else{
                    initial = false;
                }
                try{
                    this.nodes[state.toString()] = this.add(new Y.Wegas.State({
                        entity:sm.states[state],
                        sid:parseInt(state),
                        initial:initial
                    })).item(0);
                }catch(e){
                    console.warn("Adding State", state, e);
                }
                this.stateId = Math.max(this.stateId, parseInt(state) + 1);
            }

            this.each(function () {
                try{
                    this.makeAllOutgoingTransitions();
                }catch(e){
                    console.error("Transition", this, e);
                }
            });

        },
        addState: function(x, y){
            var state = this.add(new Y.Wegas.State({
                sid:this.stateId,
                initial: (this.stateId == this.get("entity").getInitialStateId()),
                x:x,
                y:y
            })).item(0);
            this.node[this.stateId.toString()] = state;
            this.get("entity").states[this.stateId.toString()] = state.get("entity");           //Be sure it'e not an array
            this.stateId += 1;
        }
    }, {
        ATTRS:{
            entity:{
                valueFn:function (){
                    return new Y.Wegas.persistence.FSMDescriptor();
                } ,
                setter: function(o){
                    if(o instanceof Y.Wegas.persistence.FSMDescriptor){
                        this.rebuild(o);
                        return o;
                    }else{
                        return null;
                    }
                }
            }
        }
    });

    State = Y.Base.create('wegas-state', Y.Widget, [Y.WidgetChild, Y.WidgetParent], {
        textNode:null,
        addScriptButton:null,
        events:{},
        cssClass: {
            state: 'statemachine-state',
            initial: 'initial-state'
        },
        CONTENT_TEMPLATE: null,
        //TODO : use localStorage for positions !
        initializer: function () {
            this.get(BOUNDING_BOX).addClass(this.cssClass.state);
            if(this.get("entity") instanceof Y.Wegas.persistence.DialogueState){
                this.textNode = new Y.Node.create("<textarea placeholder=\"Text (Response)\"/>");
                this.textNode.addClass(this.getClassName("text"));
            }
        },

        renderUI: function () {
            if(this.textNode){
                this.get(CONTENT_BOX).append(this.textNode);
                this.textNode.setContent(this.get("entity").text);
            }
            if(this.get("entity").onEnterEvent){
                this.add(new Y.Wegas.Script({
                    entity:this.get("entity").onEnterEvent
                }));
            } else {
                this.addScriptButton = this.add(new Y.Button({
                    label: "onEnterEvent"
                })).item(0);
            }
            if(this.get("x")){
                this.get(BOUNDING_BOX).getDOMNode().style.left = this.get("x") + "px";
            }
            if(this.get("y")){
                this.get(BOUNDING_BOX).getDOMNode().style.top = this.get("y") + "px";
            }
            this.get(CONTENT_BOX).append("<div class='transition-start'/>");

        },
        syncUI: function(){
            this.set("sid", this.get("sid"));
            this.set("initial", this.get("initial"));
        },
        bindUI: function (){
            jp.draggable(this.get(BOUNDING_BOX));
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
                    this.get("entity").text = val
                }, this);
            }
            if(this.addScriptButton){
                this.events.addScript = this.addScriptButton.on("click",function(e){
                    this.get("entity").onEnterEvent = new Y.Wegas.persistence.Script();
                    this.add(new Y.Wegas.Script({
                        entity:this.get("entity").onEnterEvent
                    }));
                    this.addScriptButton.destroy();
                },this);
            }

        },
        destructor: function(){
            var i;
            for(i in this.events){
                this.events[i].detach();
            }
        },
        addTransition: function(target){
            var tr;
            tr = new Y.Wegas.persistence.DialogueTransition();
            tr.nextStateId = target.get("sid");
            this.add(new Y.Wegas.Transition({
                entity:tr
            })).item(0).connect();
            this.get("entity").transitions.push(tr);
        },
        makeAllOutgoingTransitions: function (){
            var i, transitions = this.get("entity").transitions;
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
            onEnterImpacts:{
                value:null,
                validator: Y.Lang.isArray
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
            this.content = new Y.Node.create("<textarea placeholder=\"onEnterEvent (Script Impact)\"/>");
            this.language = new Y.Node.create("<div/>");
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
                this.get("entity").content = this.content.getDOMNode().value;
                if(!this.get("entity").isValid()){
                //TODO: visual annotation
                }
                this.fire("scriptContentUpdated",{
                    content: this.get("entity").content,
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
                setter: function(o){
                    this.language.setContent(o.language);
                    this.content.setContent(o["content"]);
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
                this.actionNode.setContent(this.get("entity").actionText);
            }
            if(this.get("entity").triggerCondition){
                this.add(new Y.Wegas.Script({
                    entity:this.get("entity").triggerCondition
                }));
            }
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
                    this.connector.setLabel({
                        label:val
                    });
                    if(val == ""){                                              //Set an empty String to null
                        val = null;
                    }
                    this.get("entity").actionText = val
                }, this);
            }
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
            var nextStateId = this.get("entity").nextStateId;
            this.source = this.get('parent');
            this.target = Y.Widget.getByNode(this.source.get("parent").get(CONTENT_BOX).one("[sid=" + nextStateId + "]"));
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
            //this could be if we listen to click events on complete connector
            // this.connector.canvas.setAttribute("cursor", "pointer");
            }catch(e){
                console.error("Connection failed", e);
            }
            this.createLabel();
        },
        createLabel: function () {
            if(this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition){
                this.connector.setLabel({
                    label:this.get("entity").actionText,
                    cssClass:"transition-label"
                });
            } else if (!(this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition) && this.get("entity").triggerCondition) {
                this.connector.setLabel({
                    label:this.get("entity").triggerCondition.content,
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
