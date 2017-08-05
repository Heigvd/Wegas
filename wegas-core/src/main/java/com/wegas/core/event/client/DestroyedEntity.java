/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.persistence.AbstractEntity;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class DestroyedEntity extends AbstractEntity {

    private static final long serialVersionUID = 2205964457475784646L;

    private final Long id;

    @JsonProperty(value = "@class")
    private final String effectiveClass;

    public DestroyedEntity(Long id, String klass) {
        this.id = id;
        this.effectiveClass = klass;
    }

    @Override
    public Long getId() {
        return id;
    }

    public String getEffectiveClass() {
        return effectiveClass;
    }

    @Override
    public void __merge(AbstractEntity other) {
    }
}
