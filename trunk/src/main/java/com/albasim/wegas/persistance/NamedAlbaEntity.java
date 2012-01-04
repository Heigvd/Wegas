/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.persistance;


/**
 *
 * @author maxence
 */
public abstract class NamedAlbaEntity extends AnonymousAlbaEntity {

    public abstract String getName();
    public abstract void setName(String name);

    @Override
    public String toString() {
        return this.getClass().getName().toString() + " [" + getName() + ", " + getId() + " ]";
    }


    @Override
    public abstract AnonymousAlbaEntity getParent();
}
