Y.add("statemachine-entities", function(Y){

    /*******************************/
    /******** STATEMACHINE *********/
    /*******************************/

    /*
     * FSMInstance Entity
     */
    Y.Wegas.persistence.FSMInstance = function (){
        Y.Wegas.persistence.FSMInstance.superclass.constructor.apply(this, arguments);
        this.currentStateId = 1;
    }
    Y.extend(Y.Wegas.persistence.FSMInstance, Y.Wegas.persistence.VariableInstance, {
        "@class":"FSMInstance"
    });

    /*
     * FSMDescriptor Entity
     */
    Y.Wegas.persistence.FSMDescriptor = function (){
        Y.Wegas.persistence.FSMDescriptor.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.FSMDescriptor, Y.Wegas.persistence.VariableDescriptor, {
        "@class":"FSMDescriptor",
        getCurrentState: function(){
            return this.states[this.getInstance().currentStateId];
        },
        getInitialStateId: function(){
            return this.defaultVariableInstance.currentStateId;
        },
        setInitialStateId: function(initialStateId){
            this.defaultVariableInstance.currentStateId = initialStateId;
        }
    });

    /*
     * State Entity
     */
    Y.Wegas.persistence.State = function (){
        Y.Wegas.persistence.State.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.State, Y.Wegas.persistence.Entity,{
        "@class": "State"
    });

    /*
     * TransitionDescriptor Entity
     */
    Y.Wegas.persistence.Transition = function (){
        Y.Wegas.persistence.Transition.superclass.constructor.apply(this, arguments);
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
        this.currentStateId = 1;
    }
    Y.extend(Y.Wegas.persistence.TriggerInstance, Y.Wegas.persistence.FSMInstance, {
        "@class": "TriggerInstance"
    });

    /**********************************/
    /******** DIALOGUE ENTITY *********/
    /**********************************/

    /*
     * DialogueDescriptor Entity
     */
    Y.Wegas.persistence.DialogueDescriptor = function (){
        Y.Wegas.persistence.DialogueDescriptor.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.DialogueDescriptor, Y.Wegas.persistence.FSMDescriptor, {
        "@class": "DialogueDescriptor",
        getCurrentText: function () {
            var state = this.getCurrentState();
            if(state.text){
                return state.text
            }else {
                return false;
            }
        }
    });

    /*
     * DialogueTransition Entity
     */
    Y.Wegas.persistence.DialogueTransition = function (){
        Y.Wegas.persistence.DialogueTransition.superclass.constructor.apply(this, arguments);
    }
    Y.extend(Y.Wegas.persistence.DialogueTransition, Y.Wegas.persistence.Transition, {
        "@class": "DialogueTransition"
    });

    /*
     * DialogueState Entity
     */
    Y.Wegas.persistence.DialogueState = function (){
        Y.Wegas.persistence.DialogueTransition.superclass.constructor.apply(this, arguments);
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
        }
    });
});