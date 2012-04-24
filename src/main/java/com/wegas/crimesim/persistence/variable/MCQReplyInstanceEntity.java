/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.crimesim.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.NamedEntity;
import com.wegas.core.script.ScriptEntity;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MCQReplyInstance")
public class MCQReplyInstanceEntity extends AbstractEntity {

    private static final long serialVersionUID = 1L;
//    private static final Logger logger = LoggerFactory.getLogger(MCQReplyInstanceEntity.class);
    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mcqvarinstrep_seq")
    private Long id;
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
    @ManyToOne
    private MCQReplyDescriptorEntity replyDescriptor;
    /**
     *
     */
    @JsonBackReference("question-replyi")
    @ManyToOne(optional = false)
    @JoinColumn(name = "variableinstance_id", nullable = false)
    private MCQInstanceEntity MCQInstance;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        MCQReplyInstanceEntity r = (MCQReplyInstanceEntity) a;
        this.setReplyDescriptor(r.getReplyDescriptor());
    }

    @Override
    public boolean equals(Object o) {
        MCQReplyInstanceEntity vd = (MCQReplyInstanceEntity) o;
        return vd.getId() == null || this.getId() == null || this.getId().equals(vd.getId());
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
     * @return the MCQDescriptor
     */
    @XmlTransient
    public MCQInstanceEntity getMCQInstance() {
        return MCQInstance;
    }

    /**
     * @param MCQInstance
     */
    public void setMCQInstance(MCQInstanceEntity MCQInstance) {
        this.MCQInstance = MCQInstance;
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

    /**
     * @return the replyDescriptor
     */
    public MCQReplyDescriptorEntity getReplyDescriptor() {
        return replyDescriptor;
    }

    /**
     * @param replyDescriptor the replyDescriptor to set
     */
    public void setReplyDescriptor(MCQReplyDescriptorEntity mCQReplyDescriptorEntity) {
        this.replyDescriptor = mCQReplyDescriptorEntity;
    }
}
