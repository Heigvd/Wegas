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
public class MCQReplyInstanceEntity extends NamedEntity {

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
    private MCQInstanceEntity MCQInstance;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        MCQReplyInstanceEntity r = (MCQReplyInstanceEntity) a;
        this.setDescription(r.getDescription());
        this.setAnswer(r.getAnswer());
        this.setImpact(r.getImpact());
    }

    @Override
    public boolean equals(Object o) {
        MCQReplyInstanceEntity vd = (MCQReplyInstanceEntity) o;
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
