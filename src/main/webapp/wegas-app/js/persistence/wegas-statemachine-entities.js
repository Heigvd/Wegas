Y.add("wegas-statemachine-entities", function(Y){

    /*******************************/
    /******** STATEMACHINE *********/
    /*******************************/

    /*
     * FSMInstance Entity
     */
    Y.Wegas.persistence.FSMInstance = Y.Base.create("FSMInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "FSMInstance"
            },
            currentStateId: {
                value:1,
                type: "number",
                _inputex: {
                    label: "Current state id"
                }
            },
            transitionHistory:{
                value: [],
                writeOnce: "initOnly",
                type: "uneditable",
                _inputex:{
                    label:"Transition History"
                //                    ,
                //                    elementType:{
                //                        type:"number",
                //                        readonly:true
                //                    }
                }
            }
        }
    });

    /*
     * FSMDescriptor Entity
     */
    Y.Wegas.persistence.FSMDescriptor = Y.Base.create("FSMDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {

        // *** Lifecycle methods *** //
        /**
         * Find a transition by it's id
         * @param The queried transition's id
         * @return {Transition|null} the transition if it exists
         */
        getTransitionById: function(id){
            var states = this.get("states"),
            trs;
            for (var i in states){
                trs = states[i].get("transitions")
                for(var t in trs){
                    if(trs[t].get("id") == id){
                        return trs[t];
                    }
                }
            }
            return null;
        },
        /**
         *  Succession of State - transition representing the path
         *  for current user.
         *  @return {Array} An array containing alternatively state/transition.
         */
        getFullHistory: function(){
            var transitionHistory = this.getInstance().get("transitionHistory"),
            fullHistory = [],
            tmpTransition = null;
            //TODO :Currently assuming it begins with initialState. May be wrong?
            fullHistory.push(this.getState(this.getInitialStateId()));
            for(var i = 0; i < transitionHistory.length; i+=1){
                tmpTransition = this.getTransitionById(transitionHistory[i]);
                fullHistory.push(tmpTransition);
                fullHistory.push(this.getState(tmpTransition.get("nextStateId")));
            }
            return fullHistory;

        },
        // *** Private methods *** //
        getCurrentState: function(){
            return this.get("states")[this.getInstance().get("currentStateId")];
        },
        getInitialStateId: function(){
            return this.get("defaultInstance").get("currentStateId");
        },
        setInitialStateId: function(initialStateId) {
            this.get("defaultInstance").set("currentStateId", initialStateId);
        },
        getState: function (identifier){
            return this.get("states")[identifier];
        }
    }, {
        ATTRS: {
            "@class": {
                value: "FSMDescriptor"
            },
            defaultInstance:{
                valueFn: function(){
                    return new Y.Wegas.persistence.FSMInstance();
                },
                validator: function(o){
                    return o instanceof Y.Wegas.persistence.FSMInstance;
                },
                properties: {
                    '@class': {
                        type: "string",
                        _inputex: {
                            _type:'hidden',
                            value:'FSMInstance'
                        }
                    },
                    id: {
                        type: "number",
                        optional: true,                                         // The id is optional for entites that have not been persisted
                        _inputex: {
                            _type: "hidden"
                        }
                    },
                    currentStateId: {
                        type: "number",
                        optional: true,
                        _inputex: {
                            label: 'Initial state id',
                            value: 1
                        }
                    }
                }
            },
            states: {
                value:{},
                writeOnce:"initOnly",
                _inputex: {
                    _type: "hidden"
                }/*,
                _inputex: {
                    _type:'hashlist',
                    label: 'States',
                    elementType: {
                        type:'group',
                        fields: [{
                            name: '@class',
                            value:'DialogueState',
                            type: 'hidden'
                        },{
                            name: 'id',
                            type: 'string',
                            label: "Id",
                            disabled: true
                        }, {
                            name: 'label',
                            label: 'Label'
                        }, {
                            name: 'text',
                            label: 'Text',
                            type: 'text',
                            rows: 8
                        }, {
                            name: 'onEnterEvent',
                            type:'group',
                            fields: [{
                                name: '@class',
                                value:'Script',
                                type: 'hidden'
                            }, {
                                name: 'language',
                                value:'JavaScript',
                                type: 'hidden'
                            }, {
                                name: 'content',
                                'type': 'text',
                                label:'On enter',
                                rows: 3
                            }]
                        }, {
                            name: 'transitions',
                            label: 'Transitions',
                            type: 'list',
                            elementType: {
                                type:'group',
                                fields: [{
                                    name: '@class',
                                    value:'DialogueTransition',
                                    type: 'hidden'
                                }, {
                                    name: 'triggerCondition',
                                    type:'group',
                                    fields: [{
                                        name: '@class',
                                        value:'Script',
                                        type: 'hidden'
                                    }, {
                                        name: 'language',
                                        value:'JavaScript',
                                        type: 'hidden'
                                    }, {
                                        name: 'content',
                                        'type': 'hidden',
                                        label:'Condition',
                                        rows: 3
                                    }]
                                }, {
                                    name: 'actionText',
                                    label: 'Action/User input'
                                }, {
                                    name: 'nextStateId',
                                    label: 'Next state id'
                                }, {
                                    name: 'preStateImpact',
                                    type:'group',
                                    fields: [{
                                        name: '@class',
                                        value:'Script',
                                        type: 'hidden'
                                    }, {
                                        name: 'language',
                                        value:'JavaScript',
                                        type: 'hidden'
                                    }, {
                                        name: 'content',
                                        'type': 'text',
                                        label:'On transition',
                                        rows: 8
                                    }]
                                }]
                            }
                        }]
                    }
                }*/
            }
        },
        EDITMENU: [{
            type: "EditEntityButton",
            plugins: [{
                fn: "EditFSMAction"
            }]
        }, {
            type: "Button",
            label: "Duplicate",
            plugins: [{
                fn: "DuplicateEntityAction"
            }]
        }, {
            type: "DeleteEntityButton"
        }]
    });

    /*
    * State Entity
    */
    Y.Wegas.persistence.State = Y.Base.create("State", Y.Wegas.persistence.Entity, [], {

        // *** Lifecycle methods *** //
        initializer: function () {
        }

    // *** Private methods *** //
    }, {
        ATTRS: {
            "@class": {
                value: "State"
            },
            label: {
                value:null
            },
            onEnterEvent: {
                value:null
            },
            transitions: {
                value: []
            },
            editorPosition:{
                valueFn:function(){
                    return new Y.Wegas.persistence.Coordinate({
                        x:30,
                        y:30
                    });
                }
            }
        }
    });

    /*
    * TransitionDescriptor Entity
    */
    Y.Wegas.persistence.Transition = Y.Base.create("Transition", Y.Wegas.persistence.Entity, [], {}, {
        ATTRS: {
            "@class": {
                value: "Transition"
            },
            triggerCondition: {
                value:null
            },
            preStateImpact: {
                value:null
            },
            nextStateId: {
                value:null
            }
        }
    });


    /**************************/
    /******** TRIGGER *********/
    /**************************/

    /*
    * TriggerDescriptor Entity
    */
    Y.Wegas.persistence.TriggerDescriptor = Y.Base.create("TriggerDescriptor", Y.Wegas.persistence.FSMDescriptor, [], {}, {
        ATTRS: {
            "@class": {
                value: "TriggerDescriptor"
            },
            defaultInstance:{
                valueFn: function(){
                    return new Y.Wegas.persistence.TriggerInstance();
                },
                properties: {
                    '@class': {
                        type: "string",
                        _inputex: {
                            _type:'hidden',
                            value:'TriggerInstance'
                        }
                    },
                    currentStateId: {
                        type: "number",
                        optional: true,
                        _inputex: {
                            label: 'Initial state id',
                            _type:'hidden'
                        }
                    }
                }
            },
            triggerEvent: {
                _inputex: {
                    _type: 'script',
                    label: 'Condition',
                    expects: "condition"
                }
            },
            postTriggerEvent: {
                _inputex: {
                    _type: 'script',
                    label: 'Impact'
                }
            },
            oneShot: {
                type: 'boolean',
                value: true,
                _inputex: {
                    label: 'Only once'
                }
            }
        },
        EDITMENU: [{
            type: "EditEntityButton"

        },{
            type: "DeleteEntityButton"
        }]
    });

    /*
    * TriggerInstance Entity
    */
    Y.Wegas.persistence.TriggerInstance = Y.Base.create("TriggerInstance", Y.Wegas.persistence.FSMInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "TriggerInstance"
            },
            currentStateId: {
                type: "string",
                optional: true,
                _inputex: {
                    label: "Trigger state",
                    disabled:true
                }
            }
        }
    });

    /**********************************/
    /******** DIALOGUE ENTITY *********/
    /**********************************/

    /**
    * DialogueDescriptor Entity
    */

    Y.Wegas.persistence.DialogueDescriptor = Y.Base.create("DialogueDescriptor", Y.Wegas.persistence.FSMDescriptor, [], {

        /**
        * Triggers a Dialogue Transition programmatically
        * @param {DialogueTransition} transition - the transition object to trigger.
        * @param {Object} callbacks - {success:Function|String, failure:Function|String} - the callback functions to execute.
        */
        doTransition: function(transition, callbacks){
            var request;
            if(transition instanceof Y.Wegas.persistence.DialogueTransition){
                if(!this.get("id") || !transition.get("id")){
                    console.warn("Transition and Dialogue not persisted");
                    return false;
                }
                if(transition.get("triggerCondition") == null || transition.get("triggerCondition").isEmpty()){
                    request = "/StateMachine/" + this.get("id")
                    + "/Player/" + Y.Wegas.app.get("currentPlayer")
                    + "/Do/" + transition.get("id");
                    try{
                        Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                            request: request,
                            cfg: {
                                method: "GET",
                                headers:{
                                    'Content-Type': 'application/json; charset=iso-8859-1',
                                    'Managed-Mode':'true'
                                }
                            },
                            on: callbacks
                        });
                    }catch(e){
                        //TODO : that
                        console.error("REST plugin failed");
                    }
                    return true;
                }else{
                    console.warn("Transition Condition : false");
                    return false;
                }
            }else{
                return false;
            }
        }
    }, {
        ATTRS: {
            "@class": {
                value: "DialogueDescriptor"
            }
        }
    });
    /**
    * DialogueTransition Entity
    */
    Y.Wegas.persistence.DialogueTransition = Y.Base.create("DialogueTransition", Y.Wegas.persistence.Transition, [], {

        /**
        * Builds the REST request to trigger this specifique transition
        * @param {Integer} The dialogue's id
        * @return {String} an url to GET.
        */
        getTriggerURL: function(id){
            return Y.Wegas.app.get("base") + "rest/GameMode/" +
            Y.Wegas.app.get("currentGame")
            + "/VariableDescriptor/StateMachine/" + id
            + "/Player/" + Y.Wegas.app.get("currentPlayer")
            + "/Do/" + this.get("id");
        }
    }, {
        ATTRS: {
            "@class": {
                value: "DialogueTransition"
            },
            actionText: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });

    /**
    * DialogueState Entity
    */
    Y.Wegas.persistence.DialogueState = Y.Base.create("DialogueState", Y.Wegas.persistence.State, [], {
        initializer: function(){
            this.publish("actionsAvailable");
        },
        /*
         * Listen to "DialogueState:actionsAvailable" to get the result
         * event.actionsAvailable contains available transitions
         */
        getAvailableActions: function(){
            var i, transitions = this.get("transitions"),
            ctrlObj = {};
            ctrlObj.availableActions = [];
            ctrlObj.toEval = 0;
            ctrlObj.evaluatedCount = 0;
            for (i in transitions){
                if(transitions[i] instanceof Y.Wegas.persistence.DialogueTransition){
                    if(!transitions[i].get("triggerCondition")){
                        ctrlObj.availableActions.push(transitions[i]);
                    }else{
                        transitions[i].get("triggerCondition").once("Script:evaluated", function(e, o, obj){
                            var ctrlObj = obj[0], transition = obj[1];
                            ctrlObj.evaluatedCount +=1;
                            if(o === true){
                                ctrlObj.availableActions.push(transition);
                            }
                            if(ctrlObj.toEval === ctrlObj.evaluatedCount){
                                this.fire("actionsAvailable", {
                                    actionsAvailable:ctrlObj.availableActions
                                });
                            }
                        }, this, [ctrlObj, transitions[i]]);
                        ctrlObj.toEval +=1;
                        transitions[i].get("triggerCondition").localEval();

                    }
                }
            }
            if(ctrlObj.toEval === ctrlObj.evaluatedCount){
                this.fire("actionsAvailable", {
                    actionsAvailable:ctrlObj.availableActions
                });
            }
        },

        /**
        * Get an array of texts from the state's text, split by a token
        * @param {String} The token to split by
        */
        getTexts: function ( token ) {
            return this.get("text").split(token);
        },

        /**
        * Set the text with an array and a token
        *
        * @param {Array} Strings to join
        * @param {String} Token to join the array
        */
        setText: function (a, token){
            this.set("text", a.join(token));
        }
    }, {
        ATTRS: {
            "@class": {
                value: "DialogueState"
            },
            text: {
                value:null,
                validator: function (s){
                    return s === null || Y.Lang.isString(s);
                }
            }
        }
    });
    /**
     * Coordinate embeddable mapper
     **/
    Y.Wegas.persistence.Coordinate = Y.Base.create("Coordinate", Y.Wegas.persistence.Entity, [],{}, {
        ATTRS:{
            "@class":{
                value: "Coordinate"
            },
            x:{
                value:null
            },
            y:{
                value:null
            }
        }
    });

    /**
         * @hack
         */
    Y.Wegas.persistence.VariableDescriptor.EDITFORM.availableFields.push(
        Y.mix({
            name: 'TriggerDescriptor',
            label: 'a trigger'
        }, new Y.Wegas.persistence.TriggerDescriptor().getFormCfg()),
        Y.mix({
            name: 'DialogueDescriptor',
            label: 'a dialogue'
        }, new Y.Wegas.persistence.DialogueDescriptor().getFormCfg()));

});
