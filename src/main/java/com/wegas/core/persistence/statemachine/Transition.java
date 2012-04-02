/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.statemachine;

import com.wegas.core.script.ScriptEntity;
import java.io.Serializable;
import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.Embeddable;
import javax.persistence.Embedded;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Embeddable
@Access(AccessType.FIELD)
public class Transition implements Serializable {

    @Embedded
    private ScriptEntity triggerCondition;
    private Integer nextState;

    public Transition() {
    }

    public Integer getNextState() {
        return nextState;
    }

    public void setNextState(Integer nextState) {
        this.nextState = nextState;
    }

    public ScriptEntity getTriggerCondition() {
        return triggerCondition;
    }

    public void setTriggerCondition(ScriptEntity triggerCondition) {
        this.triggerCondition = triggerCondition;
    }
}
