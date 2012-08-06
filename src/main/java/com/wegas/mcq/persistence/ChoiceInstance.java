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
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

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
    @ManyToOne(cascade = CascadeType.REMOVE)
    @JoinColumn(name = "result_id")
    //@JsonBackReference
    private Result currentResult;

    /**
     *
     */
    //@Column(name = "result_id", insertable = false, updatable = false)
    //private Long currentResultId;
    /**
     *
     * @return
     */
    public Long getCurrentResultId() {
//        return this.currentResultId;
        return this.getCurrentResult().getId();
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
        this.setCurrentResult(other.getCurrentResult());
    }

    public void setCurrentResultByIndex(int index) {
        this.setCurrentResult(( (ChoiceDescriptor) this.getDescriptor() ).getResult().get(index));
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
