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
package com.wegas.helper;

import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author maxence
 */
@XmlRootElement
public class ParameterDescriptor {

    private String name;
    private String type;

    /**
     * 
     */
    public ParameterDescriptor() {
    }

    /**
     * 
     * @param name
     * @param type
     */
    public ParameterDescriptor(String name, String type) {
        this.name = name;
        this.type = type;
    }

    /**
     * 
     * @return
     */
    public String getName() {
        return name;
    }

    /**
     * 
     * @return
     */
    public String getType() {
        return type;
    }

    /**
     * 
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 
     * @param type
     */
    public void setType(String type) {
        this.type = type;
    }
}
