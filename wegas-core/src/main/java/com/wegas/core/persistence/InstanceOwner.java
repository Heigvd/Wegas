/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.util.WegasPermission;
import java.util.List;

/**
 * Defined some method related to instances owners
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface InstanceOwner {

    /**
     *
     * @return instance owner must have an id
     */
    public Long getId();

    /**
     *
     * Pusher channel to use for this owner
     *
     * @return
     */
    public String getChannel();

    /**
     * Fetch all players involved
     *
     * @return all players who have access to the owner instances
     */
    public List<Player> getPlayers();

    /**
     * Get any player involved
     *
     * @return a (LIVE) player who have access to all owner's instances
     */
    public Player getAnyLivePlayer();

    /**
     * Return instances that belongs to this target only
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

    /**
     * The permission which require read right to this instanceOwner
     *
     * @return
     */
    @JsonIgnore
    public WegasPermission getAssociatedReadPermission();

    /**
     * The permission to grant to give write right to this instanceOwner
     *
     * @return
     */
    @JsonIgnore
    public WegasPermission getAssociatedWritePermission();
}
