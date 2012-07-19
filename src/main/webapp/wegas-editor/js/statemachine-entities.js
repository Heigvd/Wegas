Y.add("statemachine-entities", function(Y){

    /*******************************/
    /******** STATEMACHINE *********/
    /*******************************/

    /*
     * FSMInstance Entity
     */
    Y.Wegas.persistence.FSMInstance = Y.Base.create("FSMInstance", Y.Wegas.persistence.VariableInstance, [], {}, {
        ATTRS: {
            currentStateId: {},
            "@class": {
                value: "FSMInstance"
            },
            transitionHistory:{
                value:[],
                writeOnce:"initOnly"
            }
        },
        EDITFORM:  [{
            name: 'currentStateId',
            label: "Current state id"
        }]
    });

    /*
     * FSMDescriptor Entity
     */
    Y.Wegas.persistence.FSMDescriptor = Y.Base.create("FSMDescriptor", Y.Wegas.persistence.VariableDescriptor, [], {

        // *** Lifecycle methods *** //
        /**
         * Find a transition by it's id
         * @param The queried transition's id
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
        // *** Private methods *** //
        getCurrentState: function(){
            return this.get("states")[this.getInstance().get("currentStateId")];
        },
        getInitialStateId: function(){
            return this.get("defaultVariableInstance").get("currentStateId");
        },
        setInitialStateId: function(initialStateId) {
            this.get("defaultVariableInstance").set("currentStateId", initialStateId);
        }
    }, {
        ATTRS: {
            states: {
                value: {}
            },
            "@class": {
                value: "FSMDescriptor"
            },
            defaultVariableInstance:{
                valueFn: function(){
                    return new Y.Wegas.persistence.FSMInstance();
                },
                validator: function(o){
                    return o instanceof Y.Wegas.persistence.FSMInstance;
                }
            }
        },
        EDITMENU: [{
            text: "Edit",
            value: {
                op:'smeditor'
            }
        },{
            text: "Delete",
            value: {
                op:'delete'
            }
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
            defaultVariableInstance:{
                valueFn: function(){
                    return new Y.Wegas.persistence.TriggerInstance();
                },
                validator: function (o){
                    return o instanceof Y.Wegas.persistence.TriggerInstance;
                }
            }
        },
        EDITFORM: [{
            name:'defaultVariableInstance',
            disabled:true,
            type:'group',
            fields: [{
                name: '@class',
                value:'TriggerInstance',
                type: 'hidden'
            }, {
                name: 'id',
                type: 'hidden'
            }, {
                name: 'currentStateId',
                label: 'Initial state'
            }]
        }, {
            name:'triggerEvent',
            type:'group',
            fields:[{
                name:'@class',
                value:'Script',
                type:'hidden'
            }, {
                name:'language',
                label:'Language',
                type:'select',
                choices:[{
                    value:'JavaScript'
                }]
            }, {
                name:'content',
                label:'Condition',
                type:'text'
            }]
        }, {
            name:'postTriggerEvent',
            type:'group',
            fields:[{
                name:'@class',
                value:'Script',
                type:'hidden'
            }, {
                name:'language',
                label:'Language',
                type:'select',
                choices:[{
                    value:'JavaScript'
                }]
            }, {
                name:'content',
                label:'Impact',
                type:'text'
            }]
        }, {
            name: 'oneShot',
            label:'Only once',
            type:'boolean'
        }]
    });

    /*
     * TriggerInstance Entity
     */
    Y.Wegas.persistence.TriggerInstance = Y.Base.create("TriggerInstance", Y.Wegas.persistence.FSMInstance, [], {}, {
        ATTRS: {
            "@class": {
                value: "TriggerInstance"
            }
        },
        EDITFORM: [{
            name: 'currentStateId',
            label: "Trigger state",
            disabled:true
        }]
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
                request = "/StateMachine/" + this.get("id")
                + "/Player/" + Y.Wegas.app.get("currentPlayer")
                + "/Do/" + transition.get("id");
                try{
                    Y.Wegas.VariableDescriptorFacade.rest.sendRequest({
                        request: request,
                        cfg: {
                            method: "GET",
                            headers:{
                                'Content-Type': 'application/json; charset=utf-8'
                            }
                        },
                        callback: callbacks
                    });
                }catch(e){
                    //TODO : that
                    console.error("will have to correct that, cache currently not updating", e.stack);
                }
                return true;
            }else{
                return false;
            }
        }
    }, {
        ATTRS: {
            "@class": {
                value: "DialogueDescriptor"
            }
        },
        EDITFORM: [{
            name:'defaultVariableInstance',
            type:'group',
            fields: [{
                name: '@class',
                value:'FSMInstance',
                type: 'hidden'
            }, {
                name: 'id',
                type: 'hidden'
            }, {
                name: 'currentStateId',
                label: "Initial state id"
            }]
        }, {
            name: 'states',
            label: 'States',
            type:'hashlist',
            'elementType': {
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
        }]
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
        getAvailableActions: function(){
            var availableActions = [],
            i, transitions = this.get("transitions");
            for (i in transitions){
                if(transitions[i] instanceof Y.Wegas.persistence.DialogueTransition){
                    //TODO: filter not active transitions
                    availableActions.push(transitions[i]);
                }
            }
            return availableActions;
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
});
