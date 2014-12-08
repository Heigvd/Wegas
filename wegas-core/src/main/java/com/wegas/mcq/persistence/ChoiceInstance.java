/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
////import javax.xml.bind.annotation.XmlTransient;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasErrorMessage;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@XmlType(name = "ChoiceInstance")
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "result_id", insertable = false, updatable = false)
    @JsonIgnore
    //@XmlTransient
    //@JsonBackReference
    //@JsonDeserialize(using = JsonDeserializer.None.class)
    private Result currentResult;
    /**
     *
     */
    @Column(name = "result_id")
    @JsonView(Views.Public.class)
    private Long currentResultId;
    /**
     *
     */
    @Transient
    private int currentResultIndex;

    /**
     *
     * @return
     */
    @JsonIgnore
    public Result getResult() {
        if (this.currentResultId != null) {
            return this.currentResult;
        } else {
            try {
                return ((ChoiceDescriptor) this.getDescriptor()).getResults().get(0);
            } catch (ArrayIndexOutOfBoundsException ex) {
                //return null;
                throw WegasErrorMessage.error("No result found for choice \"" + this.getDescriptor().getLabel() + "\"");
            }
        }
    }

    /**
     *
     * @return
     */
    public Long getCurrentResultId() {
        return this.currentResultId;
    }

    /**
     *
     * @param currentResultId
     */
    public void setCurrentResultId(Long currentResultId) {
        this.currentResultId = currentResultId;
    }

    /**
     * @return the currentResultName
     */
    @JsonView(Views.Export.class)
    public int getCurrentResultIndex() {
        if (this.getDefaultDescriptor() != null) {
            return ((ChoiceDescriptor) this.getDefaultDescriptor()).getResults().indexOf(this.currentResult);
        } else {
            return -1;
        }
    }

    /**
     * @param currentResultIndex
     */
    public void setCurrentResultIndex(int currentResultIndex) {
        this.currentResultIndex = currentResultIndex;
    }

    /**
     *
     * @return
     */
    @JsonIgnore
    public int getSerializedResultIndex() {
        return this.currentResultIndex;
    }
//
//    public void setCurrentResultName(String currentResultName) {
//        this.currentResultName = currentResultName;
//    }

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

    /**
     *
     * @param index
     */
    public void setCurrentResultByIndex(int index) {
        this.setCurrentResult(((ChoiceDescriptor) this.getDescriptor()).getResults().get(index));
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
    //@XmlTransient
    @JsonIgnore
    public Result getCurrentResult() {
        return this.currentResult;
    }

    /**
     * @param currentResult the currentResult to set
     */
    public void setCurrentResult(Result currentResult) {
        this.currentResult = currentResult;
    }
}
