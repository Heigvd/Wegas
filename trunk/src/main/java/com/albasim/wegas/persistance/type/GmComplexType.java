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
import com.albasim.wegas.persistance.GmVariableDescriptor;
import com.albasim.wegas.persistance.GmVariableInstance;
import com.albasim.wegas.persistance.instance.GmComplexInstance;
import java.util.Collection;

import java.util.List;
import javax.persistence.CascadeType;

import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name = "ComplexT", propOrder = {})
public class GmComplexType extends GmType {

    //@EJB
    //transient private AlbaEntityManager aem;  // Is tt really necessary ? 
    @OneToMany(mappedBy = "parentComplexType", cascade = {CascadeType.REMOVE, CascadeType.PERSIST})
    private Collection<GmVariableDescriptor> variableDescriptors;


    @Override
    public List<MethodDescriptor> getPrototypes() {
        List<MethodDescriptor> methodDescription = super.getPrototypes();

        MethodDescriptor setActive = new MethodDescriptor("setActive", null);
        setActive.addParam("value", "boolean");
        methodDescription.add(setActive);

        MethodDescriptor get = new MethodDescriptor("get", "boolean");
        methodDescription.add(get);

        return methodDescription;
    }


    public Collection<GmVariableDescriptor> getVariableDescriptors() {
        return variableDescriptors;
    }


    public void setVariableDescriptors(Collection<GmVariableDescriptor> vDesc) {
        this.variableDescriptors = vDesc;
    }


    @Override
    public GmComplexInstance createInstance(String name,
                                            GmVariableInstance vi,
                                            GmEnumItem item) {
        GmComplexInstance ci = new GmComplexInstance();
        ci.setInstanceOf(this);
        ci.setName(name);


        ci.setVariable(vi);
        ci.setEnumItem(item);

        ci.setActive(true);

        //for (GmVariableDescriptor vd : variableDescriptors) {
        //    aem.createVariableInstances(this.getGameModel(), vd);
        //}

        return ci;
    }


    // Search within this type for the specified descriptor
    public GmVariableDescriptor lookupDescriptor(String varName) {
        for (GmVariableDescriptor vd : this.variableDescriptors) {
            if (vd.getName().equals(varName)) {
                return vd;
            }
        }
        return null;
    }
}
