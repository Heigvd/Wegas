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
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "ChoiceInstance")
@Table(name = "MCQChoiceInstance")
public class ChoiceInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private Boolean active = true;
    /**
     *
     */
    private Boolean unread = true;
    /**
     *
     */
    @ManyToOne(cascade= CascadeType.MERGE)
    @JoinColumn(name = "result_id", insertable = false, updatable = false)
    //@JsonBackReference
    @XmlTransient
    private Result currentResult;
    /**
     *
     */
    @Column(name = "result_id")
    @JsonView(Views.Public.class)
    private Long currentResultId;

    /**
     *
     * @return
     */
    public Long getCurrentResultId() {
        return this.currentResultId;
//        return this.getCurrentResult().getId();
    }

    /**
     *
     * @return
     */
    public void setCurrentResultId(Long currentResultId) {
        this.currentResultId = currentResultId;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        //super.merge(a);
        ChoiceInstance other = (ChoiceInstance) a;
        this.setActive(other.getActive());
        this.setUnread(other.getUnread());
        this.setCurrentResultId(other.getCurrentResultId());
        this.setCurrentResult(other.getCurrentResult());
    }

    public void setCurrentResultByIndex(int index) {
        this.setCurrentResult(( (ChoiceDescriptor) this.getDescriptor() ).getResults().get(index));
    }

    /**
     * @return the active
     */
    public Boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(Boolean active) {
        this.active = active;
    }

    /**
     * @return the unread
     */
    public Boolean getUnread() {
        return unread;
    }

    /**
     * @param unread the unread to set
     */
    public void setUnread(Boolean unread) {
        this.unread = unread;
    }

    // *** Sugar *** //
    /**
     *
     */
    public void activate() {
        this.setActive(true);
    }

    /**
     *
     */
    public void desactivate() {
        this.setActive(false);
    }

    /**
     * @return the currentResult
     */
    @XmlTransient
    public Result getCurrentResult() {
        return currentResult;
    }

    /**
     * @param currentResult the currentResult to set
     */
    public void setCurrentResult(Result currentResult) {
        this.currentResult = currentResult;
    }
}
