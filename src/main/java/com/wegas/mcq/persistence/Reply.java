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

import com.wegas.core.ejb.Helper;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.naming.NamingException;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "Reply")
public class Reply extends AbstractEntity {

    private static final long serialVersionUID = 1L;
//    private static final Logger logger = LoggerFactory.getLogger(MCQReplyInstanceEntity.class);
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    private Long startTime;
    /**
     *
     */
    @ManyToOne
    @JoinColumn(name = "choicedescriptor_id")
    private ChoiceDescriptor choiceDescriptor;
    /**
     *
     */
    @Column(name = "choicedescriptor_id", nullable = false, insertable = false, updatable = false)
    private Long choiceDescriptorId;
    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "variableinstance_id", nullable = false)
    @JsonBackReference
    private QuestionInstance questionInstance;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Reply other = (Reply) a;
        this.setChoiceDescriptor(other.getChoiceDescriptor());
        this.setStartTime(other.getStartTime());
    }

    @PostPersist
    @PostUpdate
    @PostRemove
    private void onUpdate() {
        this.getQuestionInstance().onInstanceUpdate();
   }

    @Override
    public Long getId() {
        return this.id;
    }


    /**
     * @return the MCQDescriptor
     */
    @XmlTransient
    @JsonBackReference
    public QuestionInstance getQuestionInstance() {
        return questionInstance;
    }

    /**
     * @param questionInstance
     */
    @JsonBackReference
    public void setQuestionInstance(QuestionInstance questionInstance) {
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
     * @return the choiceDescriptor
     */
    @XmlTransient
    public ChoiceDescriptor getChoiceDescriptor() {
        return choiceDescriptor;
    }

    /**
     * @param choiceDescriptor the choiceDescriptor to set
     */
    public void setChoiceDescriptor(ChoiceDescriptor choiceDescriptor) {
        this.choiceDescriptor = choiceDescriptor;
    }

    /**
     *
     * @return
     */
    public Long getChoiceDescriptorId() {
        return this.choiceDescriptorId;
    }
}
