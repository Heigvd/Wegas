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
package com.albasim.wegas.persistence.type;

import com.albasim.wegas.helper.MethodDescriptor;
import com.albasim.wegas.persistence.GmEnumItem;
import com.albasim.wegas.persistence.GmType;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.instance.GmTextInstance;
import java.util.List;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name="TextT", propOrder= {"@class", "id", "name"})
public class GmTextType extends GmType {

    @Override
    public List<MethodDescriptor> getPrototypes(){
        List<MethodDescriptor> md = super.getPrototypes();

        MethodDescriptor get = new MethodDescriptor("getValue", "string");
        md.add(get);

        MethodDescriptor set = new MethodDescriptor("setValue", null);
        set.addParam("value", "string"); // TODO HOWTO ????
        md.add(set);
        
        return md;
    }


    @Override
    public GmTextInstance createInstance(String name, VariableInstanceEntity vi, GmEnumItem item) {
        GmTextInstance ti = new GmTextInstance();

        ti.setName(name);
        ti.setInstanceOf(this);

        ti.setVariable(vi);
        ti.setEnumItem(item);
        
        ti.setV("");
        
        return ti;
    }
}
