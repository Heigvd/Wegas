/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.INTERNAL;
import static ch.albasim.wegas.annotations.CommonView.LAYOUT.shortInline;
import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.view.StringView;

/**
 *
 * @author maxence
 */
public interface Mergeable extends IMergeable {

    /**
     * Get entity cross-gamemodel identifier
     *
     * @return
     */
    String getRefId();

    void setRefId(String refId);

    static String getJSONClassName(Class<?> klass) {
        JsonTypeName annotation = klass.getAnnotation(JsonTypeName.class);

        if (annotation != null) {
            return annotation.value();
        } else {
            return klass.getSimpleName();
        }
    }

    @WegasExtraProperty(name = "@class",
        optional = false,
        nullable = false,
        view = @View(
            value = StringView.class,
            label = "",
            featureLevel = INTERNAL,
            index = -2000
        )
    )
    @JsonProperty("@class")
    //@JsonProperty(value = "@class", access = JsonProperty.Access.READ_ONLY)
    default String getJSONClassName() {
        return Mergeable.getJSONClassName(this.getClass());
    }

    @JsonProperty("@class")
    default void setJSONClassName(String atClass) {
        // no-op
    }

    /**
     *
     * @return
     */
    @JsonIgnore
    default GameModel getParentGameModel() {
        if (this instanceof GameModel) {
            return (GameModel) this;
        } else {
            Mergeable p = this.getMergeableParent();
            if (p != null) {
                return p.getParentGameModel();
            } else {
                throw new WegasNotFoundException("Game model not found");
            }
        }
    }

    @JsonIgnore
    default boolean belongsToProtectedGameModel() {
        Mergeable p = this.getMergeableParent();
        if (p != null) {
            return p.belongsToProtectedGameModel();
        } else {
            throw WegasErrorMessage.error("Not yet implemented (" + this.toString() + ")");
        }
    }

    @JsonIgnore
    default Visibility getInheritedVisibility() {
        Mergeable p = this.getMergeableParent();
        if (p != null) {
            if (p instanceof ModelScoped) {
                return ((ModelScoped) p).getVisibility();
            } else {
                return p.getInheritedVisibility();
            }
        } else {
            throw WegasErrorMessage.error("Not yet implemented (" + this.toString() + ")");
        }
    }

    @JsonIgnore
    default Visibility getClosestVisibility() {
        if (this instanceof ModelScoped) {
            return ((ModelScoped) this).getVisibility();
        } else {
            return this.getInheritedVisibility();
        }
    }

    /**
     * Get the direct internal parent
     *
     * @param <T> mergeable subtype
     *
     * @return the parent
     */
    @JsonIgnore
    <T extends Mergeable> T getMergeableParent();

    /**
     * The parent entity, as viewd by the client. This is almost always the same as {@link #getMergeableParent()
     * } exceèpt in some case where the internal structure differs from the one the client see it.
     * For instance, this is the case for the link between a variable instance and its descriptor:
     * the scope is hidden to the client
     *
     * @param <T> a mergeable subtype
     *
     * @return the parent to serialized to the client with {@link #getParentId() } and {@link #getParentType()
     *         }
     */
    @JsonIgnore
    default <T extends Mergeable> T getSerialisedParent() {
        return this.getMergeableParent();
    }

    /**
     * Get the parent entity.
     *
     * @return parent entity or null
     */
    @JsonIgnore
    default AbstractEntity getParentEntity() {
        Mergeable p = this.getSerialisedParent();
        if (p != null) {
            if (p instanceof AbstractEntity) {
                return (AbstractEntity) p;
            } else {
                return p.getParentEntity();
            }
        }
        return null;
    }

    /**
     * Get {@link #getParentEntity() } json class discriminator (the so-called atClass).
     *
     * @return json type discriminator or null
     */
    @JsonView(Views.IndexI.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @WegasExtraProperty(
        nullable = false,
        view = @View(
            value = StringView.class,
            label = "Parent Type",
            featureLevel = INTERNAL,
            index = -990,
            layout = shortInline
        ))
    default String getParentType() {
        AbstractEntity parent = this.getParentEntity();
        if (parent != null) {
            return parent.getJSONClassName();
        }
        return null;
    }

    /**
     * Get the id of the {@link #getParentEntity() }.
     *
     * @return id of the parent or null
     */
    @JsonView(Views.IndexI.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @WegasExtraProperty(
        nullable = false,
        view = @View(
            value = NumberView.class,
            label = "Parent ID",
            featureLevel = INTERNAL,
            index = -980,
            layout = shortInline
        ))
    default Long getParentId() {
        AbstractEntity parent = this.getParentEntity();
        if (parent != null) {
            return parent.getId();
        }
        return null;
    }

    /**
     * Find first partent which match the given filter. The "this" object is not taken into account.
     *
     * @param <T>    type of the parent
     * @param filter a class the searched parent should be assignable to
     *
     * @return the parent of type T or null
     */
    default <T extends Mergeable> T findNearestParent(Class<T> filter) {
        Mergeable parent = this.getSerialisedParent();

        if (parent != null) {
            if (filter.isAssignableFrom(parent.getClass())) {
                return (T) parent;
            } else {
                return parent.findNearestParent(filter);
            }
        }
        return null;
    }

    /**
     * Same as {@link #findNearestParent(java.lang.Class) } but incluse "this" object in the search.
     *
     * @param <T>    type of the parent
     * @param filter a class the searched parent should be assignable to
     *
     * @return the found object or null
     */
    default <T extends Mergeable> T findFirstOfType(Class<T> filter) {
        if (filter.isAssignableFrom(this.getClass())) {
            return (T) this;
        } else {
            return this.findNearestParent(filter);
        }
    }
}
