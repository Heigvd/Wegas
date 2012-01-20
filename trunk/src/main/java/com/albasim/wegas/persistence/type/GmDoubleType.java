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
import com.albasim.wegas.persistence.instance.GmDoubleInstance;
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
@XmlType(name = "DoubleT", propOrder = {"@class", "id", "name", "min", "max", "minIncluded", "maxIncluded"})
@NumericRange // Validate min to max range
public class GmDoubleType extends GmType {

    @XmlElement(name = "min")
    private Double minValue;


    @XmlElement(name = "max")
    private Double maxValue;


    @XmlElement(name = "default")
    private Double defaultValue;


    @XmlElement
    private boolean minIncluded = true;


    @XmlElement
    private boolean maxIncluded = true;


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
    public Double getDefaultValue() {
        return defaultValue;
    }


    @XmlTransient
    public void setDefaultValue(Double defaultValue) {
        this.defaultValue = defaultValue;
    }


    @XmlTransient
    public Double getMaxValue() {
        return maxValue;
    }


    @XmlTransient
    public void setMaxValue(Double maxValue) {
        this.maxValue = maxValue;
    }


    @XmlTransient
    public Double getMinValue() {
        return minValue;
    }


    @XmlTransient
    public void setMinValue(Double minValue) {
        this.minValue = minValue;
    }


    @Override
    public List<MethodDescriptor> getPrototypes() {
        List<MethodDescriptor> md = super.getPrototypes();

        MethodDescriptor getValue = new MethodDescriptor("getValue", "double");
        md.add(getValue);

        MethodDescriptor setValue = new MethodDescriptor("setValue", null);
        setValue.addParam("value", "double");
        md.add(setValue);

        MethodDescriptor add = new MethodDescriptor("add", null);
        add.addParam("value", "double");
        md.add(add);

        MethodDescriptor sub = new MethodDescriptor("sub", null);
        sub.addParam("value", "double");
        md.add(sub);


        MethodDescriptor mul = new MethodDescriptor("mul", null);
        mul.addParam("value", "double");
        md.add(mul);

        MethodDescriptor div = new MethodDescriptor("div", null);
        div.addParam("value", "double");
        md.add(div);

        return md;
    }


    @Override
    public GmDoubleInstance createInstance(String name, VariableInstanceEntity vi,
                                           GmEnumItem item) {
        GmDoubleInstance ii = new GmDoubleInstance();

        ii.setInstanceOf(this);
        ii.setName(name);

        ii.setVariable(vi);
        ii.setEnumItem(item);

        ii.setV(defaultValue);

        return ii;
    }


    public boolean checkValue(Double v) {
        if (minValue != null && maxValue != null) {
            boolean a, b;
            if (minIncluded) {
                a = v >= minValue;
            } else {
                a = v > minValue;
            }

            if (maxIncluded) {
                b = v <= maxValue;
            } else {
                b = v < maxValue;
            }

            return a && b;
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
        return true;
    }


}
