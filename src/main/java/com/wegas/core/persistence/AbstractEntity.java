/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.io.Serializable;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.ext.MessageBodyWriter;
import javax.ws.rs.ext.Providers;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import org.apache.commons.lang.SerializationUtils;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@XmlRootElement
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameModel", value = GameModelEntity.class),
    @JsonSubTypes.Type(name = "Game", value = GameEntity.class),
    @JsonSubTypes.Type(name = "Player", value = PlayerEntity.class),
    @JsonSubTypes.Type(name = "Team", value = TeamEntity.class),
    @JsonSubTypes.Type(name = "VariableDescriptor", value = VariableDescriptorEntity.class),
    @JsonSubTypes.Type(name = "VariableInstance", value = VariableInstanceEntity.class),})
public abstract class AbstractEntity implements Serializable, Cloneable {

    /**
     *
     * @return
     */
    public abstract Long getId();

    /**
     * @param id
     */
    public abstract void setId(Long id);

    /**
     *
     * @param a
     */
    public abstract void merge(AbstractEntity a);

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

    @Override
    public boolean equals(Object object) {

        if (object == null) {
            return false;
        }
        // First, the two object shall be instances of the same class
        if (this.getClass() != object.getClass()) {
            return false;
        }

        // Then, object shall be an AbstractEntity
        if (object instanceof AbstractEntity) {
            AbstractEntity other = (AbstractEntity) object;
            return this.getId() != null && this.getId().equals(other.getId());
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
    @Override
    public AbstractEntity clone() {
        //AnonymousEntity ae = (AnonymousEntity)super.clone();
        AbstractEntity ae = (AbstractEntity) SerializationUtils.clone(this);
        ae.setId(null);
        return ae;
    }
}
