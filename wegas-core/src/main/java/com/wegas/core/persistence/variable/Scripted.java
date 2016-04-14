/*
 * Wegas
 * http://wegas.albasim.ch
  
 * Copyright (c) 2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Script;
import java.util.List;

/**
 * Contains script(s), tells scripts are contained in this object.
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public interface Scripted {

    /**
     *
     * @return List all contained scripts
     */
    @JsonIgnore
    List<Script> getScripts();

}
