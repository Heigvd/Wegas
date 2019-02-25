/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.Helper;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.merge.patch.WegasEntityPatch;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.security.util.WegasPermission;
import java.io.IOException;
import java.io.Serializable;
import java.lang.reflect.InvocationTargetException;
import java.util.Collection;
import javax.persistence.MappedSuperclass;
import javax.persistence.PrePersist;
import javax.persistence.Transient;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameModel", value = GameModel.class),
    @JsonSubTypes.Type(name = "Game", value = Game.class),
    @JsonSubTypes.Type(name = "Player", value = Player.class),
    @JsonSubTypes.Type(name = "Team", value = Team.class),
    @JsonSubTypes.Type(name = "VariableDescriptor", value = VariableDescriptor.class),
    @JsonSubTypes.Type(name = "VariableInstance", value = VariableInstance.class)
})
/**
 * Default EclipseLink coodinationType (SEND_OBJECT_CHANGE) leads to buggy coordination for some object (eg ChoiceDescriptor and result).
 * INVALIDATE_CHANGED_OBJECTS must be set to fix this problem.
 * 2018-04-05: revert to default since it seems the buggy behaviour no longer occurs
 * <p>
 * INVALIDATE OBJECT FIX DirectCollectionMapping NPE -> fixed since eclipselink 2.7.1
 */
@MappedSuperclass
//@Cache(coordinationType = CacheCoordinationType.INVALIDATE_CHANGED_OBJECTS)
public abstract class AbstractEntity implements Serializable, Mergeable, WithPermission {

    private static final long serialVersionUID = -2538440276749623728L;

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(AbstractEntity.class);

    /**
     * Get entity id
     *
     * @return entity id
     */
    abstract public Long getId();

    @WegasEntityProperty(initOnly = true)
    //@JsonView(Views.InternalI.class)
    private String refId;

    /**
     * Get entity cross-gamemodel identifier
     *
     * @return
     */
    @Override
    public String getRefId() {
        return refId;
    }

    @PrePersist
    public void assertRefId() {
        if (Helper.isNullOrEmpty(refId)) {
            if (this.getId() == null) {
                logger.error("ID SHOULD NOT BE NULL");
            } else {
                this.setRefId(this.getClass().getSimpleName() + ":" + this.getId() + ":" + Helper.genToken(6));
            }
        }
    }

    @Override
    public void setRefId(String refId) {
        if (Helper.isNullOrEmpty(this.refId)) {
            this.refId = refId;
        }
    }

    public void forceRefId(String refId) {
        logger.trace("ForceRefId {} => {}", this, refId);
        this.refId = refId;
    }

    /**
     * Default Merge. "shallow" and follow visibilities.
     * <ul>
     * <li>Only include default properties (includeByDefault = true)</li>
     * <li>Ignore visibilities restrictions (eg. copy PRIVATE)</li>
     * </ul>
     *
     * @param other
     */
    public final void merge(AbstractEntity other) {
        WegasEntityPatch wegasEntityPatch = new WegasEntityPatch(this, other, false);// no deep
        logger.debug("Merge", wegasEntityPatch);
        if (this instanceof GameModel) {
            wegasEntityPatch.apply((GameModel) this, this); //no force
        } else {
            wegasEntityPatch.apply(null, this); // no force
        }
    }

    /**
     * Merge without forcing recursion but forcing visibilities.
     * <ul>
     * <li>Only include default properties (includeByDefault = true)</li>
     * <li>Force visibilities restrictions (eg. cross-merge PRIVATE)</li>
     * </ul>
     *
     * @param other
     */
    public final void mergeForce(AbstractEntity other) {
        WegasEntityPatch wegasEntityPatch = new WegasEntityPatch(this, other, false); //no deep
        logger.debug("MergeForce", wegasEntityPatch);
        if (this instanceof GameModel) {
            wegasEntityPatch.applyForce((GameModel) this, this); // force
        } else {
            wegasEntityPatch.applyForce(null, this); // force
        }
    }

    /**
     * Merge including all properties and following visibilities restriction
     * <ul>
     * <li>Include all properties (even includeByDefault = false)</li>
     * <li>Follow visibilities restrictions (eg. do not cross-merge PRIVATE)</li>
     * </ul>
     *
     * @param other
     */
    public final void deepMerge(AbstractEntity other) {
        WegasEntityPatch wegasEntityPatch = new WegasEntityPatch(this, other, true); // deep
        logger.debug("DeepMerge {}", wegasEntityPatch);

        if (this instanceof GameModel) {
            wegasEntityPatch.apply((GameModel) this, this);  //no force
        } else {
            wegasEntityPatch.apply(null, this); // no force
        }
    }

    /**
     * Merge including all properties and ignoring visibilities restriction
     * <ul>
     * <li>Include all properties (even includeByDefault = false)</li>
     * <li>Force visibilities restrictions (eg. cross-merge PRIVATE)</li>
     * </ul>
     *
     * @param other
     */
    public final void deepMergeForce(AbstractEntity other) {
        WegasEntityPatch wegasEntityPatch = new WegasEntityPatch(this, other, true); // deep
        logger.debug("DeepMerge {}", wegasEntityPatch);

        if (this instanceof GameModel) {
            wegasEntityPatch.applyForce((GameModel) this, this); // force
        } else {
            wegasEntityPatch.applyForce(null, this); // force
        }
    }

    @Transient
    @JsonIgnore
    private boolean persisted = false;

    /**
     * this hashCode is base on id and class hashcode
     *
     * @return a hashCode value for this entity
     *
     */
    @Override
    public int hashCode() {
        int hash = 17;
        hash = 31 * hash + (getId() != null ? getId().hashCode() : super.hashCode());
        hash = 31 * hash + getClass().hashCode();
        return hash;
    }

    /**
     * Determine if the given entity equals this. To be equal, both objects must
     * have the id and being instances of the same class
     *
     * @param object entity to compare to
     *
     * @return true if object equals this, false otherwise
     */
    @Override
    public boolean equals(Object object) {
        if (object == this) {
            return true;
        }

        if (object == null) {
            return false;
        }

        if (this.getClass() != object.getClass()) {                             // First, the two object shall be instances of the same class
            return false;
        } else {
            AbstractEntity other = (AbstractEntity) object;
            return this.getId() != null && this.getId().equals(other.getId());
        }
    }

    /**
     * clone but skip includeByDefault=false properties
     *
     * @return
     *
     * @throws java.lang.CloneNotSupportedException
     */
    public AbstractEntity shallowClone() throws CloneNotSupportedException {
        try {
            AbstractEntity clone = this.getClass().getDeclaredConstructor().newInstance();
            clone.mergeForce(this);
            return clone;
        } catch (InstantiationException | IllegalAccessException | NoSuchMethodException | SecurityException | IllegalArgumentException | InvocationTargetException ex) {
            throw new CloneNotSupportedException(ex.getLocalizedMessage());
        }
    }

    /**
     * clone and include skip includeByDefault=false properties
     *
     * @return
     *
     * @throws java.lang.CloneNotSupportedException
     */
    public AbstractEntity duplicate() throws CloneNotSupportedException {
        try {
            AbstractEntity clone = this.getClass().getDeclaredConstructor().newInstance();
            clone.deepMergeForce(this);
            return clone;
        } catch (InstantiationException | IllegalAccessException | NoSuchMethodException | SecurityException | IllegalArgumentException | InvocationTargetException ex) {
            throw new CloneNotSupportedException(ex.getLocalizedMessage());
        }
    }

    /**
     * Serialize to JSON
     *
     * @return JSON String representing this
     *
     * @throws IOException
     */
    public String toJson() throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        return mapper.writeValueAsString(this);
    }

    /**
     * Serialize to JSON with view
     *
     * @param view the view to use to export this
     *
     * @return JSON String representing this
     *
     * @throws IOException
     */
    public String toJson(Class view) throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        return mapper.writerWithView(view).writeValueAsString(this);
    }
    /**
     * Serialize to JSON with view
     *
     * @param view the view to use to export this
     * @return JSON String representing this
     * @throws IOException
     */
    public String toJsonWithView(String view) throws IOException {
        return this.toJson(Views.stringToView(view));
    }

    /**
     * String representation of this
     *
     * @return a String which contains the class name + id
     */
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + " )";
    }

    /**
     * Default behaviour is to do nothing
     * <p>
     * Overriding this method may helps to maintain cache integrity after
     * cascaded entity deletion
     *
     * @param beans facade wrapper
     */
    public void updateCacheOnDelete(Beanjection beans) {
    }

    @JsonIgnore
    public String getJSONClassName() {
        JsonTypeName annotation = this.getClass().getAnnotation(JsonTypeName.class);

        if (annotation != null) {
            return annotation.value();
        } else {
            return this.getClass().getSimpleName();
        }
    }

    /**
     * Comma-separated list of permission, only one is required to grand the permission
     * <p>
     * <ul>
     * <li>null means no special permission required</li>
     * <li>empty string "" means completely forbidden</li>
     * </ul>
     *
     * @return
     */
    @JsonIgnore
    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        return this.getRequieredUpdatePermission();
    }

    @JsonIgnore
    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getRequieredUpdatePermission();
    }

    @JsonIgnore
    @Override
    public Collection<WegasPermission> getRequieredDeletePermission() {
        return this.getRequieredUpdatePermission();
    }

    public boolean isPersisted() {
        return persisted;
    }

    /**
     * MUST BE PACKAGE PROTECTED !!!
     *
     * @param persisted
     */
    public void setPersisted(boolean persisted) {
        this.persisted = persisted;
    }
}
