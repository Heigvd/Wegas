/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;

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

    @JsonIgnore
    default public String getJSONClassName() {
        JsonTypeName annotation = this.getClass().getAnnotation(JsonTypeName.class);

        if (annotation != null) {
            return annotation.value();
        } else {
            return this.getClass().getSimpleName();
        }
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
}
