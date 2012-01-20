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
import com.albasim.wegas.persistence.instance.GmIntegerInstance;
import com.albasim.wegas.persistence.validation.NumericRange;
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
@XmlType(name = "IntegerT", propOrder = {"@class", "id", "name", "min", "max", "minIncluded", "maxIncluded"})
@NumericRange // Validate min to max range
public class GmIntegerType extends GmType {

    @XmlElement(name = "min")
    private Integer minValue;


    @XmlElement(name = "max")
    private Integer maxValue;


    @XmlElement(name = "default")
    private Integer defaultValue;


    @XmlElement
    private boolean minIncluded = true;


    @XmlElement
    private boolean maxIncluded = true;


    public GmIntegerType() {
    }


    public boolean isMaxIncluded() {
        return maxIncluded;
    }


    public void setMaxIncluded(boolean maxIncluded) {
        this.maxIncluded = maxIncluded;
    }


    public boolean isMinIncluded() {
        return minIncluded;
    }


    public void setMinIncluded(boolean minIncluded) {
        this.minIncluded = minIncluded;
    }


    @XmlTransient
    public Integer getMaxValue() {
        return maxValue;
    }


    @XmlTransient
    public void setMaxValue(Integer maxValue) {
        this.maxValue = maxValue;
    }


    @XmlTransient
    public Integer getMinValue() {
        return minValue;
    }


    @XmlTransient
    public void setMinValue(Integer minValue) {
        this.minValue = minValue;
    }


    @XmlTransient
    public Integer getDefaultValue() {
        return defaultValue;
    }


    @XmlTransient
    public void setDefaultValue(Integer defaultValue) {
        this.defaultValue = defaultValue;
    }


    @Override
    public List<MethodDescriptor> getPrototypes() {
        List<MethodDescriptor> md = super.getPrototypes();

        MethodDescriptor getValue = new MethodDescriptor("get", "int");
        md.add(getValue);

        MethodDescriptor setValue = new MethodDescriptor("set", null);
        setValue.addParam("value", "int");
        md.add(setValue);

        MethodDescriptor add = new MethodDescriptor("add", null);
        add.addParam("value", "int");
        md.add(add);

        MethodDescriptor sub = new MethodDescriptor("sub", null);
        sub.addParam("value", "int");
        md.add(sub);


        MethodDescriptor mul = new MethodDescriptor("mul", null);
        mul.addParam("value", "int");
        md.add(mul);

        MethodDescriptor div = new MethodDescriptor("div", null);
        div.addParam("value", "int");
        md.add(div);

        return md;
    }


    @Override
    public GmIntegerInstance createInstance(String name,
                                            VariableInstanceEntity vi,
                                            GmEnumItem item) {
        GmIntegerInstance ii = new GmIntegerInstance();

        ii.setInstanceOf(this);
        ii.setName(name);

        ii.setVariable(vi);
        ii.setEnumItem(item);
        
        ii.setV(defaultValue);

        return ii;
    }


    public boolean checkValue(Integer v) {
        if (v != null) {
            if (minValue != null && maxValue != null) {
                int realMin = isMinIncluded() ? minValue : minValue + 1;
                int realMax = isMaxIncluded() ? maxValue : maxValue - 1;
                return realMin <= v && v <= realMax;
            } else if (minValue != null) {
                if (minIncluded) {
                    return v >= minValue;
                } else {
                    return v > minValue;
                }
            } else if (maxValue != null) {
                if (maxIncluded) {
                    return v <= maxValue;
                } else {
                    return v < maxValue;
                }
            }
        }

        // Not bound
        return true;
    }


}
