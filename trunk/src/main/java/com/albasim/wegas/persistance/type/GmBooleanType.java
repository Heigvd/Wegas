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
package com.albasim.wegas.persistance.type;

import com.albasim.wegas.helper.MethodDescriptor;
import com.albasim.wegas.persistance.GmEnumItem;
import com.albasim.wegas.persistance.GmType;
import com.albasim.wegas.persistance.GmVariableInstance;
import com.albasim.wegas.persistance.instance.GmBooleanInstance;
import java.util.List;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name="BooleanT", propOrder={"@class", "id", "name"})
public class GmBooleanType extends GmType {

    @XmlElement(name="default")
    private Boolean defaultValue;

    
    @XmlTransient
    public Boolean getDefaultValue() {
        return defaultValue;
    }


    @XmlTransient
    public void setDefaultValue(Boolean defaultValue) {
        this.defaultValue = defaultValue;
    }

    @Override
    public List<MethodDescriptor> getPrototypes() {
        List<MethodDescriptor> methodDescription = super.getPrototypes();

 
        MethodDescriptor activate = new MethodDescriptor("activate", null);
        methodDescription.add(activate);
            
        MethodDescriptor deactivate = new MethodDescriptor("deaactivate", null);
        methodDescription.add(deactivate);
       
        MethodDescriptor set = new MethodDescriptor("set", null);
        set.addParam("value", "boolean");

        methodDescription.add(set);

        MethodDescriptor get = new MethodDescriptor("get", "boolean");
        methodDescription.add(get);

        return methodDescription;
    }


    @Override
    public GmBooleanInstance createInstance(String name, GmVariableInstance vi, GmEnumItem item) {
        GmBooleanInstance bi = new GmBooleanInstance();

        bi.setInstanceOf(this);
        bi.setName(name);
        
        bi.setVariable(vi);
        bi.setEnumItem(item);
        
        bi.setV(false);
        return bi;
    }
}
