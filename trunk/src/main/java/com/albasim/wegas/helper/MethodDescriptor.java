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
package com.albasim.wegas.helper;

import java.util.ArrayList;
import java.util.List;
import javax.xml.bind.annotation.XmlElementRef;
import javax.xml.bind.annotation.XmlRootElement;

/**
 *
 * @author maxence
 */
@XmlRootElement
public class MethodDescriptor {

   
    private String name;
    private String type;
    @XmlElementRef
    private List<ParameterDescriptor> params;

    /**
     * 
     */
    public MethodDescriptor(){
    }
    
    /**
     * 
     * @param name
     * @param type
     */
    public MethodDescriptor(String name, String type){
        this.name = name;
        this.type = type;
        this.params = new ArrayList<ParameterDescriptor>();
    }

    /**
     * 
     * @param name
     * @param type
     */
    public void addParam(String name, String type){
        this.params.add(new ParameterDescriptor(name, type));
    }


    /**
     * 
     * @param params
     */
    public void setParams(List<ParameterDescriptor> params) {
        this.params = params;
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
    
    /**
     * 
     * @return
     */
    public List<ParameterDescriptor> getParams() {
        return params;
    }
}
