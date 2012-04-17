/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.script.ScriptEntity;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.List;
import javax.persistence.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Providers;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 * Trigger: S1->(T1)->S2, S2 final (oneShot)<br/> S1->(T1)->S2->(!T1)->S1 (opposedTrigger)<br/> else S1->(T1)->S1 (loop).<br/>
 * OneShot and OpposedTrigger are exclusive. OneShot wins.
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(name = "statemachine_trigger")
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class Trigger extends FiniteStateMachine {

    private Boolean oneShot;
    private Boolean opposedTrigger;
    @Transient
    private ScriptEntity triggerEvent;
    @Transient
    private ScriptEntity postTriggerEvent;

    public Trigger() {
    }

    public Boolean isOneShot() {
        return oneShot;
    }

    /**
     * Sets the trigger to be triggered only once.
     *
     * @param oneShot boolean defining a one time trigger
     */
    public void setOneShot(Boolean oneShot) {
        this.oneShot = oneShot;
    }

    public Boolean isOpposedTrigger() {
        return opposedTrigger;
    }

    /**
     * Sets the trigger to be rearmed once the trigger is false.
     *
     * @param opposedTrigger boolean defining if the trigger shuld be rearmed
     */
    public void setOpposedTrigger(Boolean opposedTrigger) {
        this.opposedTrigger = opposedTrigger;
    }

    public ScriptEntity getPostTriggerEvent() {
        return postTriggerEvent;
    }

    /**
     * Sets the event executed once the trigger fires.
     *
     * @param postTriggerEvent a script to execute after this trigger executes
     */
    public void setPostTriggerEvent(ScriptEntity postTriggerEvent) {
        this.postTriggerEvent = postTriggerEvent;
    }

    public ScriptEntity getTriggerEvent() {
        return triggerEvent;
    }

    /**
     * Sets the script which fires the trigger.
     *
     * @param triggerEvent a script which fires the trigger
     */
    public void setTriggerEvent(ScriptEntity triggerEvent) {
        this.triggerEvent = triggerEvent;
    }

    @PrePersist
    @PreUpdate
    public void generateTrigger() {
        State initialState = new State(), finalState = new State();
        Transition transition = new Transition();
        transition.setTriggerCondition(triggerEvent);
        List<Transition> transitions = initialState.getTransitions();
        transitions.add(transition);
        initialState.setTransitions(transitions);
        this.setDefaultStateId(1);
        if (this.getCurrentStateId() == null) {
            this.setCurrentStateId(1);
        }
        HashMap<Integer, State> states = new HashMap<>();
        if (this.oneShot) {
            this.opposedTrigger = false;
            transition.setNextState(2);
            finalState.setOnEnterEvent(postTriggerEvent);
            states.put(2, finalState);
        } else if (this.opposedTrigger) {
            transition.setNextState(2);
            finalState.setOnEnterEvent(postTriggerEvent);
            Transition returnTransition = new Transition();
            returnTransition.setNextState(1);
            //TODO : Not(triggerEvent)
            returnTransition.setTriggerCondition(triggerEvent);
            returnTransition.setNextState(1);
            List<Transition> returnTransitions = finalState.getTransitions();
            returnTransitions.add(returnTransition);
            finalState.setTransitions(returnTransitions);
            states.put(2, finalState);
        } else {
            transition.setNextState(1);
            initialState.setOnEnterEvent(postTriggerEvent);
        }
        states.put(1, initialState);
        this.setStates(states);
    }

    @Override
    public String toString() {
        return "Trigger{" + "id=" + this.getId() + ", label=" + this.getLabel() + ", states=" + this.getStates() + ", currentStateId=" + this.getCurrentStateId() + ", defaultStateId=" + this.getDefaultStateId() + ", oneShot=" + oneShot + ", opposedTrigger=" + opposedTrigger + ", triggerEvent=" + triggerEvent + ", postTriggerEvent=" + postTriggerEvent + '}';
    }

    /**
     *
     * @param ps
     * @return
     * @throws IOException
     */
    @XmlTransient
    public String toJson(Providers ps) throws IOException {
        // Marshall new version
        OutputStream os = new ByteArrayOutputStream();
        MessageBodyWriter mbw = ps.getMessageBodyWriter(this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.APPLICATION_JSON_TYPE);
        mbw.writeTo(this, this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.WILDCARD_TYPE, null, os);
        return os.toString();
    }
}
