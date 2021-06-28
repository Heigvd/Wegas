/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class DestroyedEntity extends AbstractEntity {

    private static final long serialVersionUID = 2205964457475784646L;

    private final Long id;

    private final String className;

    private final String effectiveClass;

    public DestroyedEntity(AbstractEntity entity) {
        this.id = entity.getId();
        this.effectiveClass = entity.getJSONClassName();
        this.className = entity.getClass().getName();
    }

    @Override
    public Long getId() {
        return id;
    }

    @JsonIgnore
    public String getClassName() {
        return className;
    }

    @JsonProperty("@class")
    @Override
    public String getJSONClassName() {
        return effectiveClass;
    }

    @JsonIgnore
    public String getEffectiveClass() {
        return effectiveClass;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return null;
    }

    @Override
    public WithPermission getMergeableParent() {
        return null;
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return false;
    }

    @Override
    public Visibility getInheritedVisibility() {
        return Visibility.INHERITED;
    }

}
