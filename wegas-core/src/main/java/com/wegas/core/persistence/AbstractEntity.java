/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
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
        hash += (getId() != null ? getId().hashCode() : 0);
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
        AbstractEntity ae = null;
        try {
            ae = this.getClass().newInstance();
            ae.merge(this);
        } catch (InstantiationException | IllegalAccessException ex) {
            Logger.getLogger(AbstractEntity.class.getName()).log(Level.SEVERE, "Error during clone", ex);
        }
        return ae;
    }

    /**
     * Duplicate an entity by using Jackson Mapper and provided view
     *
     * @return
     */
    public AbstractEntity duplicate(Class view) throws IOException {
        //AnonymousEntity ae = (AnonymousEntity)super.clone();
        //AbstractEntity ae = (AbstractEntity) SerializationUtils.clone(this);
        //ae.setId(null);
        ObjectMapper mapper = JacksonMapperProvider.getMapper();                // Retrieve a jackson mapper instance
        String serialized = mapper.writerWithView(view).
                writeValueAsString(this);                                       // Serialize the entity

        return mapper.readValue(serialized, AbstractEntity.class);              // and deserialize it
    }

    public AbstractEntity duplicate() throws IOException {
        return this.duplicate(Views.Export.class);
    }

    /**
     *
     * @return @throws IOException
     * @throws IOException
     */
    public String toJson() throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        return mapper.writeValueAsString(this);
    }

    /**
     *
     * @param view
     * @return
     * @throws IOException
     */
    public String toJson(Class view) throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        return mapper.writerWithView(view).writeValueAsString(this);
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
