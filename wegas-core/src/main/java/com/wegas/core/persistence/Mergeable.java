/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
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
    boolean isProtected();

    @JsonIgnore
    Visibility getInheritedVisibility();
}
