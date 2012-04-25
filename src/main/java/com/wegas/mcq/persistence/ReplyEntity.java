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
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "MCQReply")
public class ReplyEntity extends AbstractEntity {

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
    private ChoiceDescriptorEntity choiceDescriptor;
    /**
     *
     */
    @JsonBackReference("question-replyi")
    @ManyToOne(optional = false)
    @JoinColumn(name = "variableinstance_id", nullable = false)
    private QuestionInstanceEntity questionInstance;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        ReplyEntity r = (ReplyEntity) a;
        this.setChoiceDescriptor(r.getChoiceDescriptor());
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
    public QuestionInstanceEntity getQuestionInstance() {
        return questionInstance;
    }

    /**
     * @param MCQInstance
     */
    public void setQuestionInstance(QuestionInstanceEntity questionInstance) {
        this.questionInstance = questionInstance;
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
     * @return the choiceDescriptor
     */
    public ChoiceDescriptorEntity getChoiceDescriptor() {
        return choiceDescriptor;
    }

    /**
     * @param choiceDescriptor the choiceDescriptor to set
     */
    public void setChoiceDescriptor(ChoiceDescriptorEntity choiceDescriptor) {
        this.choiceDescriptor = choiceDescriptor;
    }
}
