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
import com.albasim.wegas.helper.MethodDescriptor;
import com.albasim.wegas.persistence.GmEnumItem;
import com.albasim.wegas.persistence.GmType;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.instance.GmStringInstance;
import java.util.List;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name = "StringT", propOrder = {"id", "name", "pattern"})
public class GmStringType extends GmType {

    private static final Logger logger = Logger.getLogger("StringType");


    transient private Pattern p;


    private String pattern;


    @XmlElement(name = "default")
    private String defaultValue;


    @XmlTransient
    public Pattern getRegex() {
        return p;
    }


    public String getPattern() {
        return pattern;
    }


    @XmlTransient
    public String getDefaultValue() {
        return defaultValue;
    }


    @XmlTransient
    public void setDefaultValue(String defaultValue) {
        if (p != null) {
            if (!isValid(defaultValue)) {
                throw new InvalidContent("Default value does not match the pattern");
            }
        }
        this.defaultValue = defaultValue;
    }


    /**
     * Each time the string pattern is set, rebuild the java Pattern object
     * @param pattern 
     * @todo check if default match the pattern !
     */
    public void setPattern(String pattern) {
        if (pattern != null && !pattern.isEmpty()) {
            this.pattern = pattern;
            this.p = Pattern.compile(pattern);
        } else {
            this.pattern = null;
        }
    }


    public boolean isValid(String s) {
        if (p != null) {
            Matcher matcher = p.matcher(s);
            return matcher.matches();
        }
        return true;
    }


    @Override
    public List<MethodDescriptor> getPrototypes() {
        List<MethodDescriptor> md = super.getPrototypes();

        MethodDescriptor get = new MethodDescriptor("getValue", "string");
        md.add(get);

        MethodDescriptor set = new MethodDescriptor("setValue", null);
        set.addParam("value", "string"); // TODO HOWTO ????
        md.add(set);

        return md;
    }


    @Override
    public GmStringInstance createInstance(String name, VariableInstanceEntity vi,
                                           GmEnumItem item) {
        GmStringInstance si = new GmStringInstance();

        si.setInstanceOf(this);
        si.setName(name);

        si.setVariable(vi);
        si.setEnumItem(item);

        si.setV(null);

        return si;
    }


}
