/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

public abstract class NamedEntity extends AnonymousEntity {

    /**
     * 
     * @return
     */
    public abstract String getName();
    /**
     * 
     * @param name
     */
    public abstract void setName(String name);

    /**
     * 
     * @return
     */
    @Override
    public String toString() {
        return this.getClass().getName().toString() + " [" + getName() + ", " + getId() + " ]";
    }

}
