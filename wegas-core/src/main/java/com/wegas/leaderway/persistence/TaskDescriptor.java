/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 *
 *
 * @todo add predecessors
 * @todo add requirements list<name, Object<grade, qty>
 *  { "webdesigner": { limit: 100, levels: [{lvl: "junior", qty: 2}] }
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 *
 *
 */
@Entity
public class TaskDescriptor extends VariableDescriptor<TaskInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private String description;
    /**
     *
     */
    private Integer index;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        TaskDescriptor other = (TaskDescriptor) a;
        this.setDescription(other.getDescription());
        this.setIndex(other.getIndex());
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
     * @return the index
     */
    public int getIndex() {
        return index;
    }

    /**
     * @param description the index to set
     */
    public void setIndex(int no) {
        this.index = no;
    }
}
