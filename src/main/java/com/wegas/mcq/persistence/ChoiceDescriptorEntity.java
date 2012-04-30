/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.script.ScriptEntity;
import javax.persistence.Column;
import javax.persistence.Embedded;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "ChoiceDescriptor")
public class ChoiceDescriptorEntity extends VariableDescriptorEntity<ChoiceInstanceEntity> {

    private static final long serialVersionUID = 1L;
    // private static final Logger logger = LoggerFactory.getLogger(ChoiceDescriptorEntity.class);
    /**
     *
     */
    private String name;
    /**
     *
     */
    @Column(length = 4096)
    private String description;
    /**
     *
     */
    @Embedded
    private ScriptEntity impact;
    /**
     *
     */
    @Column(length = 4096)
    private String answer;
    /**
     *
     */
    private Long duration = new Long(1);

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        ChoiceDescriptorEntity other = (ChoiceDescriptorEntity) a;
        this.setDescription(other.getDescription());
        this.setAnswer(other.getAnswer());
        this.setImpact(other.getImpact());
        this.setDuration(other.getDuration());
    }

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * @return the impact
     */
    public ScriptEntity getImpact() {
        return impact;
    }

    /**
     * @param impact the impact to set
     */
    public void setImpact(ScriptEntity impact) {
        this.impact = impact;
    }

    @Override
    public String getName() {
        return this.name;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the answer
     */
    public String getAnswer() {
        return answer;
    }

    /**
     * @param answer the answer to set
     */
    public void setAnswer(String answer) {
        this.answer = answer;
    }

    /**
     * @return the duration
     */
    public Long getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(Long duration) {
        this.duration = duration;
    }


    // *** Sugar *** //
    public void activate(PlayerEntity p) {
       this.getVariableInstance(p).setActive(true);
    }
    public void desactivate(PlayerEntity p) {
       this.getVariableInstance(p).setActive(false);
    }
}
