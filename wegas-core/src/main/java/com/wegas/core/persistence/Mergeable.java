/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.persistence.annotations.WegasExtraProperty;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.rest.util.Views;
import static com.wegas.editor.View.CommonView.FEATURE_LEVEL.INTERNAL;
import static com.wegas.editor.View.CommonView.LAYOUT.shortInline;
import com.wegas.editor.View.ReadOnlyNumber;
import com.wegas.editor.View.ReadOnlyString;
import com.wegas.editor.View.View;

/**
 *
 * @author maxence
 */
public interface Mergeable {

    /**
     * Get entity cross-gamemodel identifier
     *
     * @return
     */
    String getRefId();

    void setRefId(String refId);

    public static String getJSONClassName(Class<? extends Mergeable> klass) {
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
                    value = ReadOnlyString.class,
                    label = "",
                    featureLevel = INTERNAL,
                    index = -2000
            )
    )
    @JsonProperty("@class")
    default public String getJSONClassName() {
        return Mergeable.getJSONClassName(this.getClass());
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
    <T extends Mergeable> T getMergeableParent();

    @JsonIgnore
    default <T extends Mergeable> T getSerialisedParent() {
        return this.getMergeableParent();
    }

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

    @JsonView(Views.IndexI.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @WegasExtraProperty(
            nullable = false,
            view = @View(
                    value = ReadOnlyString.class,
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

    @JsonView(Views.IndexI.class)
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @WegasExtraProperty(
            nullable = false,
            view = @View(
                    value = ReadOnlyNumber.class,
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
}
