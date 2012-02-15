/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.scope;

import com.wegas.ejb.AnonymousEntityManager;
import com.wegas.persistence.game.AnonymousEntity;
import com.wegas.persistence.variableinstance.VariableInstanceEntity;
import java.util.Map;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.persistence.Table;
import javax.xml.bind.annotation.XmlType;

/**
 * @todo Needs to be implemented
 * 
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table()
@XmlType(name = "GameScope", propOrder = {"@class", "id", "name"})
public class GameScopeEntity extends ScopeEntity {

    private static final Logger logger = Logger.getLogger(GameScopeEntity.class.getName());

    @Override
    public void setVariableInstance(Long userId, VariableInstanceEntity v) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public VariableInstanceEntity getVariableInstance(Long playerId) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public Map<Long, VariableInstanceEntity> getVariableInstances() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void reset(AnonymousEntityManager aem) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    @Override
    public void merge(AnonymousEntity a) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

}
