Y.add("statemachine-entities", function(Y){

    /*******************************/
    /******** STATEMACHINE *********/
    /*******************************/

    /*
     * FSMInstance Entity
     */
    Y.Wegas.persistence.FSMInstance = function (){
        Y.Wegas.persistence.FSMInstance.superclass.constructor.apply(this, arguments);
        Y.mix(this, {
            currentStateId:null
        });
    }
    Y.extend(Y.Wegas.persistence.FSMInstance, Y.Wegas.persistence.VariableInstance, {
        "@class":"FSMInstance"
    });

    /*
     * FSMDescriptor Entity
     */
    Y.Wegas.persistence.FSMDescriptor = function (){
        Y.Wegas.persistence.FSMDescriptor.superclass.constructor.apply(this, arguments);
        Y.mix(this, {
            states:{}
        });
    }
    Y.extend(Y.Wegas.persistence.FSMDescriptor, Y.Wegas.persistence.VariableDescriptor, {
        "@class":"FSMDescriptor",
        getCurrentState: function(){
            return this.states[this.getInstance().currentStateId];
        },
        getInitialStateId: function(){
            return this.getInstance().currentStateId;
        },
        setInitialStateId: function(initialStateId){
            this.getInstance().currentStateId = initialStateId;
        }
    });

    /*
     * State Entity
     */
    Y.Wegas.persistence.State = function (){
        Y.Wegas.persistence.State.superclass.constructor.apply(this, arguments);
        Y.mix(this, {
            onEnterEvent:null,
            label:null,
            transitions:[]
        });
    }
    Y.extend(Y.Wegas.persistence.State, Y.Wegas.persistence.Entity,{
        "@class": "State"
    });

    /*
     * TransitionDescriptor Entity
     */
    Y.Wegas.persistence.Transition = function (){
        Y.Wegas.persistence.Transition.superclass.constructor.apply(this, arguments);
        Y.mix(this,{
            triggerCondition:null,
            preStateImpact:null,
            nextStateId:null
        });
    }
    Y.extend(Y.Wegas.persistence.Transition, Y.Wegas.persistence.Entity, {
        "@class": "Transition"
    });


    /**************************/
    /******** TRIGGER *********/
    /**************************/

    /*
     * TriggerDescriptor Entity
     */
    Y.Wegas.persistence.TriggerDescriptor = function (){
        Y.Wegas.persistence.TriggerDescriptor.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.TriggerDescriptor, Y.Wegas.persistence.FSMDescriptor, {
        "@class": "TriggerDescriptor"
    });

    /*
     * TriggerInstance Entity
     */
    Y.Wegas.persistence.TriggerInstance = function (){
        Y.Wegas.persistence.TriggerInstance.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.TriggerInstance, Y.Wegas.persistence.FSMInstance, {
        "@class": "TriggerInstance"
    });

    /**********************************/
    /******** DIALOGUE ENTITY *********/
    /**********************************/

    /**
     * DialogueDescriptor Entity
     */
    Y.Wegas.persistence.DialogueDescriptor = function (){
        Y.Wegas.persistence.DialogueDescriptor.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.DialogueDescriptor, Y.Wegas.persistence.FSMDescriptor, {
        "@class": "DialogueDescriptor"
    });

    /**
     * DialogueTransition Entity
     */
    Y.Wegas.persistence.DialogueTransition = function (){
        Y.Wegas.persistence.DialogueTransition.superclass.constructor.apply(this, arguments);
        Y.mix(this, {
            actionText:null
        });
    }
    Y.extend(Y.Wegas.persistence.DialogueTransition, Y.Wegas.persistence.Transition, {
        "@class": "DialogueTransition"
    });

    /**
     * DialogueState Entity
     */
    Y.Wegas.persistence.DialogueState = function (){
        Y.Wegas.persistence.DialogueState.superclass.constructor.apply(this, arguments);
        Y.mix(this, {
            text:null
        });
    }
    Y.extend(Y.Wegas.persistence.DialogueState, Y.Wegas.persistence.State, {
        "@class": "DialogueState",
        getAvailableActions: function(){
            var availableActions = [],
            i;
            for (i in this.transitions){
                if(this.transitions[i] instanceof Y.Wegas.persistence.DialogueTransition){
                    availableActions.push(this.transitions[i]);
                }
            }
            return availableActions;
        },

        /**
         * Get an array of texts from the state's text, split by a token
         * @param {String} The token to split by
         */
        getTexts: function ( token ) {
            return this.text.split(token);
        },

        /**
         * Set the text with an array and a token
         *
         * @param {Array} Strings to join
         * @param {String} Token to join the array
         */
        setText: function (a, token){
            this.text = a.join(token);
        }
    });
});