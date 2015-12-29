/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.*;
////import javax.xml.bind.annotation.XmlTransient;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.Broadcastable;
import java.util.List;
import java.util.Map;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@XmlType(name = "Reply")
@JsonTypeName(value = "Reply")
@Table(name = "MCQReply", indexes = {
    @Index(columnList = "variableinstance_id")
})
public class Reply extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;
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
    private Boolean unread = false;
    /**
     *
     */
    @ManyToOne(optional = false)
    private Result result;
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
        if (a instanceof Reply) {
            Reply other = (Reply) a;
            this.setUnread(other.getUnread());
            //this.setResult(other.getResult());
            this.setStartTime(other.getStartTime());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     * @PostPersist
     * @PostUpdate
     * @PostRemove
     * public void onUpdate() {
     * this.getQuestionInstance().onInstanceUpdate();
     * }
     */
    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getQuestionInstance().getEntities();
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the MCQDescriptor
     */
    //@XmlTransient
    @JsonIgnore
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

    /*
     * @return the unread
     */
    /**
     *
     * @return
     */
    public Boolean getUnread() {
        return unread;
    }

    /**
     * @param unread
     */
    public void setUnread(Boolean unread) {
        this.unread = unread;
    }

    /**
     *
     * /
     *
     **
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
     * @return the result
     */
    public Result getResult() {
        return result;
    }

    /**
     * @param result the result to set
     */
    public void setResult(Result result) {
        this.result = result;
    }
}
