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
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.game.Script;
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
public class ChoiceDescriptor extends VariableDescriptor<ChoiceInstance> {

    private static final long serialVersionUID = 1L;
    // private static final Logger logger = LoggerFactory.getLogger(ChoiceDescriptor.class);
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
    private Script impact;
    /**
     *
     */
    @Column(length = 4096)
    private String feedback;
    /**
     *
     */
    private Long duration = new Long(1);
    /**
     *
     */
    private Long cost = new Long(1);

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        ChoiceDescriptor other = (ChoiceDescriptor) a;
        this.setDescription(other.getDescription());
        this.setFeedback(other.getFeedback());
        this.setImpact(other.getImpact());
        this.setDuration(other.getDuration());
        this.setCost(other.getCost());
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
    public Script getImpact() {
        return impact;
    }

    /**
     * @param impact the impact to set
     */
    public void setImpact(Script impact) {
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
    public String getFeedback() {
        return feedback;
    }

    /**
     * @param feedback
     */
    public void setFeedback(String feedback) {
        this.feedback = feedback;
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


    /**
     * @return the cost
     */
    public Long getCost() {
        return cost;
    }

    /**
     * @param cost the cost to set
     */
    public void setCost(Long cost) {
        this.cost = cost;
    }
    // *** Sugar *** //
    /**
     *
     * @param p
     */
    public void activate(Player p) {
       this.getInstance(p).activate();
    }
    /**
     *
     * @param p
     */
    public void desactivate(Player p) {
       this.getInstance(p).desactivate();
    }

}
