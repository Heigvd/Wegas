/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.List;

/**
 * Kind of instances owner
 * 
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface InstanceOwner {

    public String getChannel();

    public List<Player> getPlayers();

    /**
     * Return instances that belongs to this target
     *
     * @return
     */
    @JsonIgnore
    public List<VariableInstance> getPrivateInstances();

    /**
     * return instances that belongs to this target and its children
     *
     * @return
     */
    @JsonIgnore
    public List<VariableInstance> getAllInstances();
}
