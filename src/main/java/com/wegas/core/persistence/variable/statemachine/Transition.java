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

import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.dialogue.UserInput;
import com.wegas.leadergame.persistence.DialogueTransition;
import java.io.Serializable;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Access(AccessType.FIELD)
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "UserInput", value = UserInput.class),
    @JsonSubTypes.Type(name = "DialogueTransition", value = DialogueTransition.class)
})
public class Transition implements Serializable {

    @Id
    @GeneratedValue
    private Long id;
    @Embedded
    private Script triggerCondition;
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "content",
        column =
        @Column(name = "onTransition_content")),
        @AttributeOverride(name = "lang",
        column =
        @Column(name = "onTransition_language"))
    })
    private Script preStateImpact;
    private Long nextStateId;

    public Transition() {
    }

    public Long getId() {
        return id;
    }

    public Long getNextStateId() {
        return nextStateId;
    }

    public void setNextStateId(Long nextStateId) {
        this.nextStateId = nextStateId;
    }

    public Script getTriggerCondition() {
        return triggerCondition;
    }

    public void setTriggerCondition(Script triggerCondition) {
        this.triggerCondition = triggerCondition;
    }

    public Script getPreStateImpact() {
        return preStateImpact;
    }

    public void setPreStateImpact(Script preStateImpact) {
        this.preStateImpact = preStateImpact;
    }

    @Override
    public String toString() {
        return "Transition{" + "triggerCondition=" + triggerCondition + ", nextStateId=" + nextStateId + '}';
    }
}
