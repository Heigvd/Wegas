/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.crimesim.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.NamedEntity;
import java.util.logging.Logger;

import javax.persistence.Column;
import javax.persistence.Entity;

import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MCQVariableInstanceReply")
public class MCQReplyVariableInstanceEntity extends NamedEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQVariableInstanceReplyEntity");
    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mcqvarinstrep_seq")
    private Long id;
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
    @Column(length = 4096)
    private String impact;
    /**
     *
     */
    @Column(length = 4096)
    private String answer;
    /**
     *
     */
    private Long startTime;
    /**
     *
     */
    private Long duration;
    /**
     *
     */
    @JsonBackReference("question-replyi")
    @ManyToOne(optional = false)
    @JoinColumn(name = "variableinstance_id", nullable = false)
    private MCQVariableInstanceEntity mCQVariableInstance;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        MCQReplyVariableInstanceEntity r = (MCQReplyVariableInstanceEntity) a;
        this.setDescription(r.getDescription());
        this.setAnswer(r.getAnswer());
        this.setImpact(r.getImpact());
    }

    @Override
    public boolean equals(Object o) {
        MCQReplyVariableInstanceEntity vd = (MCQReplyVariableInstanceEntity) o;
        return vd.getId() == null || this.getId() == null || this.getId().equals(vd.getId());
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
    public String getImpact() {
        return impact;
    }

    /**
     * @param impact the impact to set
     */
    public void setImpact(String impact) {
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

    @Override
    public Long getId() {
        return this.id;
    }

    @Override
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the mcqVariableDescriptor
     */
    @XmlTransient
    public MCQVariableInstanceEntity getMCQVariableInstance() {
        return mCQVariableInstance;
    }

    /**
     * @param mCQVariableInstance
     */
    public void setMCQVariableInstance(MCQVariableInstanceEntity mCQVariableInstance) {
        this.mCQVariableInstance = mCQVariableInstance;
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
     * @return the startTime
     */
    public Long getStartTime() {
        return startTime;
    }

    /**
     * @param startTime the startTime to set
     */
    public void setStartTime(Long startTime) {
        this.startTime = startTime;
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
}
