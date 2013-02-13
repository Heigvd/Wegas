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
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class TaskDescriptor extends VariableDescriptor<TaskInstance> {


    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private String description;
    /**
     *
     */
    @Column (name = "numero")
    private Integer no;
    
    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        TaskDescriptor other = (TaskDescriptor) a;
        this.setDescription(other.getDescription());
        this.setNo(other.getNo());
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
     * @return the no
     */
    public int getNo() {
        return no;
    }

    /**
     * @param description the no to set
     */
    public void setNo(int no) {
        this.no = no;
    }

}
