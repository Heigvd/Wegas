/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.variable.Beanjection;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@XmlType(name = "ChoiceInstance")
@Table(name = "MCQChoiceInstance",
        indexes = {
            @Index(columnList = "result_id")
        }
)
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
    private CurrentResult currentResult;

    /**
     *
     */
    @Transient
    private String currentResultName;

    @Transient
    /**
     * @deprecated
     */
    private Integer currentResultIndex = null;

    public ChoiceInstance() {
    }

    /**
     * get the result to apply if the choice is selected. Either the
     * currentResult if defined, the first otherwise
     *
     * @return the currentResult or the first one
     *
     * @throws WegasErrorMessage if not result are defined
     */
    @JsonIgnore
    public Result getResult() {
        if (this.getCurrentResult() != null) {
            return this.getCurrentResult();
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
     * @return the currentResultName
     */
    public String getCurrentResultName() {
        if (!Helper.isNullOrEmpty(currentResultName)) {
            return currentResultName;
        } else if (this.getCurrentResult() != null) {
            return getCurrentResult().getName();
        } else {
            return null;
        }
    }

    /**
     * @param currentResultName
     */
    public void setCurrentResultName(String currentResultName) {
        this.currentResultName = currentResultName;
    }

    /**
     * @deprecated
     * @return
     */
    @JsonIgnore
    public Integer getCurrentResultIndex() {
        return currentResultIndex;
    }

    /**
     * @deprecated
     */
    @JsonProperty
    public void setCurrentResultIndex(Integer index) {
        this.currentResultIndex = index;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof ChoiceInstance) {
            //super.merge(a);
            super.merge(a);
            ChoiceInstance other = (ChoiceInstance) a;
            this.setActive(other.getActive());
            this.setUnread(other.getUnread());

            // Normal
            this.setCurrentResultName(other.getCurrentResultName());

            // Backward compat
            this.setCurrentResultIndex(other.getCurrentResultIndex());

            if (!Helper.isNullOrEmpty(this.currentResultName)) {
                ChoiceDescriptor choiceDesc = (ChoiceDescriptor) this.findDescriptor();
                if (choiceDesc != null) {
                    // if choiceDesc is null, the following will eventually be
                    // done by with the help of an InstanceReviveEvent
                    Result previousResult = this.getCurrentResult();
                    if (previousResult != null) {
                        previousResult.removeChoiceInstance(this);
                    }
                    try {
                        Result newResult = choiceDesc.getResultByName(this.currentResultName);
                        this.setCurrentResult(newResult);
                        newResult.addChoiceInstance(this);
                    } catch (WegasNoResultException ex) {
                        this.setCurrentResult(null);
                    }
                }

            }
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
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
        if (this.currentResult != null) {
            return this.currentResult.getResult();
        } else {
            return null;
        }
    }

    /**
     * @param currentResult the currentResult to set
     */
    public void setCurrentResult(Result currentResult) {
        if (currentResult != null) {
            this.currentResult = currentResult.getCurrentResult();
        } else {
            this.currentResult = null;
        }
        this.setCurrentResultName(null);
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        Result cr = this.getCurrentResult();
        if (cr != null) {
            ChoiceDescriptor cd = cr.getChoiceDescriptor();
            if (cd != null) {
                VariableDescriptorFacade vdf = beans.getVariableDescriptorFacade();
                cd = (ChoiceDescriptor) vdf.find(cd.getId());
                if (cd != null) {
                    try {
                        cr = cd.getResultByName(cr.getName());
                        cr.removeChoiceInstance(this);
                    } catch (WegasNoResultException ex) {
                    }

                }
            }
        }

        super.updateCacheOnDelete(beans);
    }
}
