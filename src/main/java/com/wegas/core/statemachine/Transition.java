/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.statemachine;

import java.io.Serializable;
import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.Embeddable;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Embeddable
@Access(AccessType.FIELD)
public class Transition implements Serializable {

    private String triggerCondition;
    private Integer nextState;

    public Transition() {
    }

    public Integer getNextState() {
        return nextState;
    }

    public void setNextState(Integer nextState) {
        this.nextState = nextState;
    }

    public String getTriggerCondition() {
        return triggerCondition;
    }

    public void setTriggerCondition(String triggerCondition) {
        this.triggerCondition = triggerCondition;
    }
}
