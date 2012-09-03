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
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.Serializable;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.annotate.JsonTypeInfo;
import org.codehaus.jackson.map.ObjectMapper;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@XmlRootElement
@XmlType(name = "")                                                             // This forces to use Class's short name as type
//@XmlAccessorType(XmlAccessType.FIELD)
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameModel", value = GameModel.class),
    @JsonSubTypes.Type(name = "Game", value = Game.class),
    @JsonSubTypes.Type(name = "Player", value = Player.class),
    @JsonSubTypes.Type(name = "Team", value = Team.class),
    @JsonSubTypes.Type(name = "VariableDescriptor", value = VariableDescriptor.class),
    @JsonSubTypes.Type(name = "VariableInstance", value = VariableInstance.class)
})
public abstract class AbstractEntity implements Serializable, Cloneable {

    /**
     *
     * @return
     */
    abstract public Long getId();

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
    @Override
    public AbstractEntity clone() {
        //AnonymousEntity ae = (AnonymousEntity)super.clone();
        //AbstractEntity ae = (AbstractEntity) SerializationUtils.clone(this);
        //ae.setId(null);
        AbstractEntity ae = null;
        try {
            ae = this.getClass().newInstance();
            ae.merge(this);
        }
        catch (InstantiationException | IllegalAccessException ex) {
            Logger.getLogger(AbstractEntity.class.getName()).log(Level.SEVERE, "Error during clone", ex);
        }
        return ae;
    }

    /**
     *
     * @return @throws IOException
     */
    public String toJson() throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        mapper.writeValue(baos, this);
        return baos.toString();
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
