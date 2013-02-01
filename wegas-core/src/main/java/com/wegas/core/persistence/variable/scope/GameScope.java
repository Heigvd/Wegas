/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.Map;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @todo Needs to be implemented
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "GameScope", propOrder = {"@class", "id", "name"})
public class GameScope extends AbstractScope {

    private static final Logger logger = LoggerFactory.getLogger(GameScope.class);

    @Override
    public void setVariableInstance(Long userId, VariableInstance v) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public VariableInstance getVariableInstance(Player player) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public Map<Long, VariableInstance> getVariableInstances() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void propagateDefaultInstance(boolean force) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void merge(AbstractEntity a) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}
