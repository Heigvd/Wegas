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
import com.albasim.wegas.persistance.instance.GmTextInstance;
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
    public GmTextInstance createInstance(String name, GmVariableInstance vi, GmEnumItem item) {
        GmTextInstance ti = new GmTextInstance();

        ti.setName(name);
        ti.setInstanceOf(this);

        ti.setVariable(vi);
        ti.setEnumItem(item);
        
        ti.setV("");
        
        return ti;
    }
}
