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
//    @ManyToOne
//    @JoinColumn(name = "response_id")
    @Transient
    private Response currentResponse;
    /**
     *
     */
//    @Column(name = "response_id", nullable = false, insertable = false, updatable = false)

    @Transient
    private Long currentResponseId;

    /**
     *
     * @return
     */
    public Long getCurrentResponseId() {
        return this.currentResponseId;
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
        this.setCurrentResponse(other.getCurrentResponse());
    }

    public void setCurrentResponseByIndex(int index) {
        this.setCurrentResponse(( (ChoiceDescriptor) this.getDescriptor() ).getResponses().get(index));
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
     * @return the currentResponse
     */
    @XmlTransient
    public Response getCurrentResponse() {
        return currentResponse;
    }

    /**
     * @param currentResponse the currentResponse to set
     */
    public void setCurrentResponse(Response currentResponse) {
        this.currentResponse = currentResponse;
    }
}
