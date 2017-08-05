/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import java.util.Objects;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public abstract class NamedEntity extends AbstractEntity {

    private static final long serialVersionUID = -5419544250248220709L;

    /**
     * Get the entity internal name
     *
     * @return the entity name
     */
    public abstract String getName();

    /**
     *
     * @param name
     */
    public abstract void setName(String name);

    /**
     *
     * @return class simple name, id and name
     */
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", " + getName() + ")";
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 37 * hash + Objects.hashCode(this.getName());
        hash = 37 * hash + Objects.hashCode(this.getId());
        return hash;
    }

    /**
     * @param entity entity to compare to
     * @return true if entity equals this
     */
    @Override
    public boolean equals(Object entity) {
        if (entity instanceof NamedEntity) {
            return this.getName().equals(((NamedEntity) entity).getName()) && super.equals(entity);
        } else {
            return false;
        }
    }
}
