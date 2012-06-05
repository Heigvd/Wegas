/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.Serializable;
import javax.xml.bind.annotation.XmlRootElement;
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
    @JsonSubTypes.Type(name = "GameModel", value = GameModel.class),
    @JsonSubTypes.Type(name = "Game", value = Game.class),
    @JsonSubTypes.Type(name = "Player", value = Player.class),
    @JsonSubTypes.Type(name = "Team", value = Team.class),
    @JsonSubTypes.Type(name = "VariableDescriptor", value = VariableDescriptor.class),
    @JsonSubTypes.Type(name = "VariableInstance", value = VariableInstance.class),})
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
     * @param other
     */
    public abstract void merge(AbstractEntity other);

    /**
     *
     * @return
     */
    @Override
    public int hashCode() {
        int hash = 0;
        hash += ( getId() != null ? getId().hashCode() : 0 );
        hash += getClass().hashCode();
        return hash;
    }

    @Override
    public boolean equals(Object object) {

        if (object == null) {
            return false;
        }

        if (this.getClass() != object.getClass()) {                             // First, the two object shall be instances of the same class
            return false;
        }

        if (object instanceof AbstractEntity) {                                 // Then, object shall be an AbstractEntity
            AbstractEntity other = (AbstractEntity) object;
            return this.getId() != null && this.getId().equals(other.getId());
        }
        return false;
    }

    /**
     *
     * @return
     */
    //@XmlTransient
   // public String getKey() {
    //    return this.getClass().getSimpleName() + getId();
   // }

    /**
     *
     * @param ps
     * @return
     * @throws IOException
     */
  //  @XmlTransient
  //  public String toJson(Providers ps) throws IOException {
//        // Marshall new version
//        OutputStream os = new ByteArrayOutputStream();
//        MessageBodyWriter mbw = ps.getMessageBodyWriter(this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.APPLICATION_JSON_TYPE);
//        mbw.writeTo(this, this.getClass(), this.getClass(), this.getClass().getDeclaredAnnotations(), MediaType.WILDCARD_TYPE, null, os);
//        return os.toString();
//    }

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

    /**
     *
     * @return
     */
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + " )";
    }
}
