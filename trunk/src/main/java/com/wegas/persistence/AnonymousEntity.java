/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.Serializable;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.Transient;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Providers;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.apache.maven.surefire.shade.org.apache.commons.lang.SerializationUtils;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public abstract class AnonymousEntity implements Serializable, Cloneable {

    private static final Logger logger = Logger.getLogger("GMVariableDescriptor");

    /**
     * 
     * @return
     */
    public abstract Long getId();

    /**
     * 
     * @param id
     */
    public abstract void setId(Long id);
    @Transient
    private List<String> errors;

    /**
     * 
     * @return
     */
    @Override
    public int hashCode() {
        int hash = 0;
        hash += (getId() != null ? getId().hashCode() : 0);
        hash += getClass().hashCode();
        return hash;
    }

    /**
     * 
     * @param object
     * @return
     */
    @Override
    public boolean equals(Object object) {
        // First, the two object shall be instances of the same class
        if (this.getClass() != object.getClass()) {
            return false;
        }

        // Then, object shall be an NamedAlbaEntity object
        if (object instanceof AnonymousEntity) {
            AnonymousEntity other = (AnonymousEntity) object;
            if ((getId() == null && other.getId() != null) || (getId() != null && !getId().equals(other.getId()))) {
                return false;
            }

            return true;
        }
        return false;
    }

    /**
     * 
     * @return
     */
    @Override
    public String toString() {
        return this.getClass().getName().toString() + " [" + getId() + " ]";
    }

    /**
     * 
     * @return
     */
    @XmlTransient
    public String getKey() {
        return this.getClass().getSimpleName() + getId();
    }

    /**
     * 
     * @param ps
     * @return
     * @throws IOException
     */
    @XmlTransient
    public String toJson(Providers ps) throws IOException {
        // Marshall new version
        OutputStream os = new ByteArrayOutputStream();
        MessageBodyWriter mbw = ps.getMessageBodyWriter(this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.APPLICATION_JSON_TYPE);
        mbw.writeTo(this, this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.WILDCARD_TYPE, null, os);
        return os.toString();
    }

    /**
     * 
     * @return
     */
    @Transient
    public List<String> getErrors() {
        return errors;
    }

    /**
     * 
     * @param errors
     */
    @Transient
    @XmlTransient
    public void setErrors(List<String> errors) {
        this.errors = errors;
    }

    /**
     * 
     * @return
     */
    @Override
    public AnonymousEntity clone()  {
        //AnonymousEntity ae = (AnonymousEntity)super.clone();
        AnonymousEntity ae = (AnonymousEntity) SerializationUtils.clone(this);
        ae.setId(null);
        return ae;
    }
    
    /**
     * 
     * @param a
     */
    public abstract void merge(AnonymousEntity a);
}
