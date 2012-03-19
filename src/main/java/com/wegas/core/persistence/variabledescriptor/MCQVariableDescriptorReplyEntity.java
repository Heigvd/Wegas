/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.variabledescriptor;

import com.wegas.core.persistence.game.AbstractEntity;
import com.wegas.core.persistence.game.NamedEntity;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MCQVariableDescriptorReply")
public class MCQVariableDescriptorReplyEntity extends NamedEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("MCQVariableDescriptorReplyEntity");
    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "mcqvardescrep_seq")
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
    @JsonBackReference("question-reply")
    @ManyToOne(optional = false)
    @JoinColumn(name = "variabledescriptor_id", nullable = false)
    private MCQVariableDescriptorEntity mCQVariableDescriptor;
    /**
     *
     */
    private Long duration;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        MCQVariableDescriptorReplyEntity r = (MCQVariableDescriptorReplyEntity) a;
        this.setDescription(r.getDescription());
        this.setAnswer(r.getAnswer());
        this.setImpact(r.getImpact());
    }

    @Override
    public boolean equals(Object o) {
        MCQVariableDescriptorReplyEntity vd = (MCQVariableDescriptorReplyEntity) o;
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
     * @return the mCQVariableDescriptor
     */
    @XmlTransient
    public MCQVariableDescriptorEntity getMCQVariableDescriptor() {
        return mCQVariableDescriptor;
    }

    /**
     * @param mCQVariableDescriptor the mCQVariableDescriptor to set
     */
    public void setMCQVariableDescriptor(MCQVariableDescriptorEntity mCQVariableDescriptor) {
        this.mCQVariableDescriptor = mCQVariableDescriptor;
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
}
