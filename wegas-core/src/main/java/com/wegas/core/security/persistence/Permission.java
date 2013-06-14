/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import java.io.Serializable;
import java.util.Objects;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Embeddable
@XmlRootElement
@XmlType(name = "")                                                             // This forces to use Class's short name as type
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class Permission implements Serializable {

    @Basic
    @Column(name = "permissions")
    private String value;
    @Basic
    private String inducedPermission;

    public Permission() {
    }

    public Permission(String value) {
        this.value = value;
    }

    public Permission(String value, String inducedPermission) {
        this.value = value;
        this.inducedPermission = inducedPermission;
    }

    @Override
    public boolean equals(Object obj) {
        return (obj != null
                && obj instanceof Permission
                && this.value.equals(((Permission) obj).getValue()));
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 29 * hash + Objects.hashCode(this.value);
        hash = 29 * hash + Objects.hashCode(this.inducedPermission);
        return hash;
    }


    /**
     * @return the inducedPermission
     */
    public String getInducedPermission() {
        return inducedPermission;
    }

    /**
     * @param inducedPermission the inducedPermission to set
     */
    public void setInducedPermission(String inducedPermission) {
        this.inducedPermission = inducedPermission;
    }

    /**
     * @return the value
     */
    public String getValue() {
        return value;
    }

    /**
     * @param value the value to set
     */
    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return "Permission(" + this.value + ")";
    }
}
