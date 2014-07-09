/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.dialogue.UserInput;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.annotate.JsonTypeInfo;
import org.codehaus.jackson.map.annotate.JsonView;

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
public class Transition extends AbstractEntity {

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     *
     */
    @JsonView(Views.EditorExtendedI.class)
    private Integer index = 0;

    /**
     *
     */
    @Embedded
    private Script triggerCondition;

    /**
     *
     */
    @Embedded
    @AttributeOverrides({
        @AttributeOverride(name = "content", column
                = @Column(name = "onTransition_content")),
        @AttributeOverride(name = "lang", column
                = @Column(name = "onTransition_language"))
    })
    @JsonView(Views.EditorExtendedI.class)
    private Script preStateImpact;

    /**
     *
     */
    private Long nextStateId;

    @Override
    public Long getId() {
        return id;
    }

    /**
     *
     * @return
     */
    public Long getNextStateId() {
        return nextStateId;
    }

    /**
     *
     * @param nextStateId
     */
    public void setNextStateId(Long nextStateId) {
        this.nextStateId = nextStateId;
    }

    /**
     *
     * @return
     */
    public Script getTriggerCondition() {
        return triggerCondition;
    }

    /**
     *
     * @param triggerCondition
     */
    public void setTriggerCondition(Script triggerCondition) {
        this.triggerCondition = triggerCondition;
    }

    /**
     *
     * @return
     */
    public Script getPreStateImpact() {
        return preStateImpact;
    }

    /**
     *
     * @param preStateImpact
     */
    public void setPreStateImpact(Script preStateImpact) {
        this.preStateImpact = preStateImpact;
    }

    @Override
    public String toString() {
        return "Transition{" + "triggerCondition=" + triggerCondition + ", nextStateId=" + nextStateId + '}';
    }

    @Override
    public void merge(AbstractEntity other) {
        Transition newTranstion = (Transition) other;
        this.nextStateId = newTranstion.nextStateId;
        this.preStateImpact = newTranstion.preStateImpact;
        this.triggerCondition = newTranstion.triggerCondition;
        this.index = newTranstion.index;
    }

    /**
     * @return the index
     */
    public Integer getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(Integer index) {
        this.index = index;
    }
}
