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
    jp = window.jsPlumb,
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
        actions: {

        },

        initializer: function() {
            var entity;
            /*
             * jsPlumb Config
             */
            jp.Defaults.Container = this.get(CONTENT_BOX);
            jp.Defaults.Anchor = "Continuous";
            jp.Defaults.Endpoint = ["Dot", {
                radius : 6
            }];
            jp.Defaults.Connector = [ "Flowchart", {
                stub:[40, 40],
                gap:10
            } ];
            //jp.Defaults.Connector = "StateMachine";
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
        //            this.actions = {
        //                "adn": {
        //                    "ok": {
        //                        "default": true,
        //                        "text": "ADN génial.",
        //                        "dialogImpact": ["SP::fibre::bad", "SP::ed:bad"]
        //                    },
        //                    "bad": {
        //                        "text": "L'ADN n'est plus exploitable."
        //                    }
        //                },
        //                "ed": {
        //                    "ok": {
        //                        "text": "Empreintes digitales récupérées",
        //                        "dialogImpact": ["SP::fibre::bad", "SP::adn:bad"]
        //                    },
        //                    "bad": {
        //                        "text": "Les empreintes digitales ne sont plus exploitables."
        //                    }
        //                },
        //                "fibre": {
        //                    "ok": {
        //                        "text": "L'analyse sur les fibres est de bonne qualité.",
        //                        "dialogImpact": ["SP::ed:bad"]
        //                    },
        //                    "bad": {
        //                        "text": "Les fibres sont déterioriées."
        //                    }
        //                }
        //            }
        },
        renderUI: function() {
            console.log(this.get("entity"));
        },

        bindUI: function() {
            //            this.get(CONTENT_BOX).delegate("mousedown", function(e){
            //                e.preventDefault();
            //                console.log(e);
            //            }, ".statemachine-state", this);
            this.get(CONTENT_BOX).on("dblclick", function(e){
                e.stopImmediatePropagation();
                if(e.target == this.get(CONTENT_BOX)){
                    this.addState(e.clientX - this.get(CONTENT_BOX).getXY()[0] - 30, e.clientY - this.get(CONTENT_BOX).getXY()[1] - 30);
                }
            }, this);
            jp.bind("beforeDetach", function(e){
                var transitions;
                transitions = e.getParameters().transition.get("parent").get("entity").transitions;

                console.log("Before",transitions);
                for(var i in transitions){
                    if(transitions[i] === e.getParameters().transition.get("entity") ){
                        transitions.splice(i,1);
                        console.log("After",transitions);
                        e.getParameters().transition.get("parent").set("entity", e.getParameters().transition.get("parent").get("entity"));
                    }
                }


                e.getParameters().transition.destroy();

                return true;

            });
            //Clean panel
            jp.bind("jsPlumbConnectionDetached", function(e){
                jp.deleteEndpoint(e.sourceEndpoint);
                jp.deleteEndpoint(e.targetEndpoint);
            });
            this.on("wegas-state:entityChange", function(e){
                console.log("New entity :",e.target.get("sid"), e.newVal);
                this.get("entity").states[e.target.get("sid")] = e.newVal;
            });
        },

        rebuild: function(sm){
            var state, initial = false;
            this.stateId = 1;
            //A reference seems to still exist.
            for(state in this._items){
                this._items[state].destroy();
                delete this._items[state];
            }


            this.nodes = {};

            this.get("parent").get("toolbarNode").one(".title").setContent(sm["@class"] + " -- " + sm.name); //TODO : could certainly be better

            for(state in sm.states){
                if(sm.getInitialStateId() == state){
                    initial = true;
                }else{
                    initial = false;
                }
                this.nodes[state] = (new Y.Wegas.State({
                    entity:sm.states[state],
                    sid:state,
                    initial:initial
                }));
                try{
                    this.add(new Y.Wegas.State({
                        entity:sm.states[state],
                        sid:state,
                        initial:initial
                    }));
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
            var stateEntity = this.add(new Y.Wegas.State({
                sid:this.stateId,
                //entity:stateEntity,
                x:x,
                y:y
            })).item(0).get("entity");
            this.get("entity").states[""+this.stateId] = stateEntity;           //Be sure it'e not an array
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
        cssClass: {
            state: 'statemachine-state',
            initial: 'initial-state'
        },
        CONTENT_TEMPLATE: null,

        initializer: function () {
        },

        renderUI: function () {
            this.get(BOUNDING_BOX).addClass(this.cssClass.state);
            if(this.get("entity").onEnterEvent){
                this.add(new Y.Wegas.Script({
                    entity:this.get("entity").onEnterEvent
                }));
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
                    return new Y.Wegas.persistence.State();
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
        cssClass: {
            language: 'language',
            script: 'script'
        },
        content:null,
        language:null,
        CONTENT_TEMPLATE:null,
        initializer: function () {
            this.content = new Y.Node.create("<textarea readonly='true'/>");
            this.language = new Y.Node.create("<div/>");
        },
        renderUI: function () {

            this.content.addClass(this.getClassName(this.cssClass.script));
            this.language.addClass(this.getClassName(this.cssClass.language));
            this.get(CONTENT_BOX).append(this.content);
            this.get(CONTENT_BOX).append(this.language);
            this.set("entity", this.get("entity"));
        },
        syncUI: function(){
            this.set("language", this.get("language"));
            this.set("script", this.get("script"));
        }
    }, {
        ATTRS:{
            entity:{
                valueFn: function(){
                    var e = new Y.Wegas.persistence.Entity();
                    e["@class"] = "Script";
                    e.language = "JavaScript";
                    e.content = null;
                    return e;
                },
                setter: function(o){
                    this.language.setContent(o.language);
                    this.content.setContent(o["content"]);
                    return o;
                }
            },
            language:{
                value:"JavaScript",
                setter:function (v){
                    this.language.setContent(v);
                },
                getter: function(){
                    return this.language.getContent();
                }
            },
            content:{
                value:null,
                setter:function (v){
                    this.content.setContent(v);
                },
                getter: function(){
                    return this.content.getContent();
                }
            }
        }
    });

    Transition = Y.Base.create('wegas-transition', Y.Widget, [Y.WidgetChild], {
        connector: null,
        source:null,
        target:null,
        initializer: function () {

        },
        bindUI: function (){
        },
        connect: function(){
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
            }catch(e){
                console.error("Connection failed", e);
            }
            this.setLabel();
        },
        setLabel: function () {
            if(this.get("entity") instanceof Y.Wegas.persistence.DialogueTransition){
                this.connector.setLabel({
                    label:this.get("entity").actionText,
                    cssClass:"transition-label"
                });
            } else {
                this.connector.setLabel({
                    label:this.get("entity").triggerCondition.content,
                    cssClass: "transition-label"
                });
            }

        },
        destructor: function (){
            this.connector.setParameter("transition", null);
            jp.detach(this.connector, {
                forceDetach:true
            });
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
                    e.triggerCondition = new Y.Wegas.persistence.Entity
                    e.triggerCondition.content = "";
                    e.triggerCondition.language = "JavaScript";
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
