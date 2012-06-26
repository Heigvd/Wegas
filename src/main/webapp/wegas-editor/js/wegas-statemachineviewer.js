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

    var StateMachineViewer, State, Transition, Impact,
    jp = window.jsPlumb,
    getClassName = Y.ClassNameManager.getClassName,
    CONTENT_BOX = 'contentBox',
    BOUNDING_BOX = 'boundingBox',
    DEFAULTHEADERS = {
        'Content-Type': 'application/json; charset=utf-8'
    };

    StateMachineViewer = Y.Base.create("wegas-statemachineviewer", Y.Widget, [], {
        CONTENT_TEMPLATE: null,
        panel: null,
        dialog: null,
        nodes:{},
        actions: {

        },

        initializer: function() {
            this.panel = Y.Node.create("<div class=" + this.getClassName('draw') + "><div/>");
            this.dialog= Y.Node.create("<div class=" + this.getClassName('dialog') + "><div/>");
            this.nodes[0]=(new Y.Wegas.State({
                nid:0,
                initial:true
            }));
            this.nodes[1]=(new Y.Wegas.State({
                nid:1,
                impacts:[
                    new Y.Wegas.Impact({interaction:"SP::ed::bad"})
                ]
            }));
            this.actions = {
                "adn": {
                    "ok": {
                        "default": true,
                        "text": "ADN génial.",
                        "dialogImpact": ["SP::fibre::bad", "SP::ed:bad"]
                    },
                    "bad": {
                        "text": "L'ADN n'est plus exploitable."
                    }
                },
                "ed": {
                    "ok": {
                        "text": "Empreintes digitales récupérées",
                        "dialogImpact": ["SP::fibre::bad", "SP::adn:bad"]
                    },
                    "bad": {
                        "text": "Les empreintes digitales ne sont plus exploitables."
                    }
                },
                "fibre": {
                    "ok": {
                        "text": "L'analyse sur les fibres est de bonne qualité.",
                        "dialogImpact": ["SP::ed:bad"]
                    },
                    "bad": {
                        "text": "Les fibres sont déterioriées."
                    }
                }
            }
            /*
             * jsPlumb Config
             */
            jp.Defaults.Container = this.panel;
            jp.Defaults.Anchor = "Continuous";
            jp.Defaults.Endpoint = ["Dot", {
                radius : 6
            }];
            jp.Defaults.Connector = "StateMachine";
            jp.Defaults.ConnectionOverlays = [["PlainArrow", {
                location : 1,
                width: 10
            }]];
            jp.Defaults.PaintStyle = {
                lineWidth : 3,
                strokeStyle : "#11F"
            };
        },
        renderUI: function() {
            this.get(CONTENT_BOX).append(this.panel);
            this.get(CONTENT_BOX).append(this.dialog);
            for(var i in this.nodes){
                this.nodes[i].render(this.panel);
            }
            jp.connect({
                source:this.nodes[0].get(BOUNDING_BOX),
                target:this.nodes[1].get(BOUNDING_BOX)
            });
        },
        bindUI: function() {
            jp.draggable(Y.all('.statemachine-state'));
            jp.animate(Y.one('.statemachine-state'), {});                       //Stupid things
        }
    }, {
        ATTRS:{
            name:{
                value: null
            }
        }
    });

    State = Y.Base.create('wegas-state', Y.Widget, [Y.WidgetParent], {
        cssClass: {
            state: 'statemachine-state',
            initial: 'initial-state'
        },
        CONTENT_TEMPLATE: null,

        initializer: function () {

        },

        renderUI: function () {
            this.get(BOUNDING_BOX).addClass(this.cssClass.state);
            if(this.get("initial")){
                this.get(BOUNDING_BOX).addClass(this.cssClass.initial);
            }
            for(var i in this.get("impacts")){
                this.add(this.get("impacts")[i]);
            }
          this.add(new Y.Button());
        }
    }, {
        ATTRS:{
            nid:{
                value:0
            },
            initial:{
                value: false,
                validator: Y.Lang.isBoolean
            },
            impacts:{
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

    Impact = Y.Base.create('wegas-impact', Y.Widget, [Y.WidgetChild], {
        cssClass: {
            interaction: 'interaction',
            script: 'script'
        },
        CONTENT_TEMPLATE:null,
        initializer: function () {

        },
        renderUI: function () {
            if(this.get("script")){
                this.get(BOUNDING_BOX).append(this.get("script"));
                this.get(BOUNDING_BOX).addClass(this.getClassName(this.cssClass.script));
            }else if(this.get("interaction")){
                this.get(BOUNDING_BOX).append(this.get("interaction"));
                this.get(BOUNDING_BOX).addClass(this.getClassName(this.cssClass.interaction));
            }
        }
    }, {
        ATTRS:{
            script:{
                value: null,
                validator: Y.Lang.isString
            },
            interaction:{
                value: null,
                validator: Y.Lang.isString
            }
        }
    });

    Transition = Y.Base.create('wegas-transition', Y.Widget, [Y.WidgetChild], {

        initializer: function () {

        }
    }, {
        ATTRS:{
            tid:{
                value:0
            }
        }
    });

    Y.namespace('Wegas').StateMachineViewer = StateMachineViewer;
    Y.namespace('Wegas').State = State
    Y.namespace('Wegas').Transition = Transition;
    Y.namespace('Wegas').Impact = Impact;
});
