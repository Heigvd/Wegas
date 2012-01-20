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

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.persistence.GmEnumItem;
import com.albasim.wegas.helper.MethodDescriptor;
import com.albasim.wegas.persistence.GmType;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.cardinality.GmEnumCardinality;
import com.albasim.wegas.persistence.instance.GmEnumInstance;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name = "EnumT", propOrder = {"id", "name"})
public class GmEnumType extends GmType {

    @OneToMany(mappedBy = "enumeration")
    @XmlTransient
    private List<GmEnumCardinality> gmEnumCardinalities;


    @OneToMany(mappedBy = "gmEnumType", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    //@OrderBy(value="position")
    private List<GmEnumItem> items;

    @XmlElement(name="default")
    private String defaultValue;

    public List<GmEnumItem> getItems() {
        return items;
    }


    public void setItems(List<GmEnumItem> items) {
        this.items = items;
    }


    @XmlTransient
    public String getDefaultValue() {
        return defaultValue;
    }


    @XmlTransient
    public void setDefaultValue(String defaultValue) {
        if (defaultValue != null){
            for (GmEnumItem it : getItems()){
                if (it.getName().equals(defaultValue)){
                    this.defaultValue = defaultValue;
                    return;
                }
            }
            throw new InvalidContent("Item " + defaultValue + " does not exists");
        }
    }

    

    /*@XmlTransient
    public Integer getNewLastPos() {
    if (items != null && items.size() > 0) {
    GmEnumItem get = items.get(items.size() - 1);
    return get.getPosition() + 1;
    } else {
    return 0;
    }
    }*/
    @Override
    public List<MethodDescriptor> getPrototypes() {
        List<MethodDescriptor> md = super.getPrototypes();

        MethodDescriptor get = new MethodDescriptor("get", "boolean");
        md.add(get);

        return md;
    }


    @Override
    @XmlTransient
    public GmEnumInstance createInstance(String name, VariableInstanceEntity vi,
                                         GmEnumItem item) {
        GmEnumInstance ei = new GmEnumInstance();

        ei.setInstanceOf(this);
        ei.setName(name);

        ei.setVariable(vi);
        ei.setEnumItem(item);

        if (items != null && items.size() > 0) {
            ei.setV(items.get(0).getName());
        }

        return ei;
    }


    @XmlTransient
    public List<GmEnumCardinality> getGmEnumCardinalities() {
        return gmEnumCardinalities;
    }


    @XmlTransient
    public void setGmEnumCardinalities(
            List<GmEnumCardinality> gmEnumCardinalities) {
        this.gmEnumCardinalities = gmEnumCardinalities;
    }


    private Integer getItemPosition(GmEnumItem it) {
        return items.lastIndexOf(it);
    }


    @XmlTransient
    public GmEnumItem lookupItem(String name) {
        if (items != null) {
            for (GmEnumItem it : items) {
                if (it.getName().equals(name)){
                    return it;
                }
            }
        }
        return null;
    }


}
