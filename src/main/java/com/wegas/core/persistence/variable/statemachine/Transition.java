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

import com.wegas.core.persistence.variable.dialogue.UserInput;
import com.wegas.core.script.ScriptEntity;
import java.io.Serializable;
import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.Embeddable;
import javax.persistence.Embedded;
import javax.xml.bind.annotation.XmlRootElement;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Embeddable
@Access(AccessType.FIELD)
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "UserInput", value = UserInput.class)
})
public class Transition implements Serializable {

    @Embedded
    private ScriptEntity triggerCondition;
    @Embedded
    ScriptEntity preStateImpact;
    private Long nextStateId;

    public Transition() {
    }

    public Long getNextStateId() {
        return nextStateId;
    }

    public void setNextStateId(Long nextStateId) {
        this.nextStateId = nextStateId;
    }

    public ScriptEntity getTriggerCondition() {
        return triggerCondition;
    }

    public void setTriggerCondition(ScriptEntity triggerCondition) {
        this.triggerCondition = triggerCondition;
    }

    public ScriptEntity getPreStateImpact() {
        return preStateImpact;
    }

    public void setPreStateImpact(ScriptEntity preStateImpact) {
        this.preStateImpact = preStateImpact;
    }

    @Override
    public String toString() {
        return "Transition{" + "triggerCondition=" + triggerCondition + ", nextStateId=" + nextStateId + '}';
    }
}
