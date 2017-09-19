/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.AbstractEntity;
import java.util.List;

/**
 * Encapsulate gameModel root variable descriptor for websocket propagation
 *
 * @author Maxence
 */
public class RootDescriptors extends AbstractEntity {

    private static final long serialVersionUID = 1079421247740492627L;
    private long id = -1l;

    private List<VariableDescriptor> rootLevelDescriptors;

    public RootDescriptors() {
    }

    @Override
    @JsonIgnore
    public Long getId() {
        return id;
    }

    public void setId(long id) {
        this.id = id;
    }

    public List<VariableDescriptor> getItems() {
        return rootLevelDescriptors;
    }

    public void setItems(List<VariableDescriptor> items) {
        this.rootLevelDescriptors = items;
    }

    @Override
    public String getRequieredUpdatePermission() {
        return null;
    }

    @Override
    public void merge(AbstractEntity other) {
    }
}
