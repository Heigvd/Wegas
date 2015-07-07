/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.List;
import javax.persistence.Basic;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;

/**
 * 
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class BurndownDescriptor extends VariableDescriptor<BurndownInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private String description;

    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        BurndownDescriptor other = (BurndownDescriptor) a;
        this.setDescription(other.getDescription());
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

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getDescription(), criterias)
                || super.containsAll(criterias);
    }
}
