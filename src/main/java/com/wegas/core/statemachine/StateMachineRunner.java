/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.statemachine;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.variable.EntityUpdateEvent;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import com.wegas.core.persistence.variable.statemachine.TriggerInstanceEntity;
import java.io.Serializable;
import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.SessionScoped;
import javax.enterprise.event.Observes;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@SessionScoped
public class StateMachineRunner implements Serializable {

    static final Logger logger = Logger.getLogger("StateMachineRunner");
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    private HashSet<Class> ignorableInstances = new HashSet<>();
    private HashSet<StateMachineInstanceEntity> stateMachines = new HashSet<>();

    public StateMachineRunner() {
    }

    public void entityUpdateListener(@Observes EntityUpdateEvent euEvent) {
        VariableInstanceEntity entity = (VariableInstanceEntity) euEvent.getEntity();
        if (ignorableInstances.contains(entity.getClass())) {
        } else {
            logger.log(Level.INFO, "StateMachineRunner, update: {0}", euEvent.getEntity());
            if (stateMachines.isEmpty()) {                                      // load stateMachines only once
                Long gmId = entity.getDescriptor().getGameModel().getId();
                List<VariableDescriptorEntity> stateMachineDescriptors = variableDescriptorFacade.findByClassAndGameModelId(StateMachineDescriptorEntity.class, gmId);
                logger.log(Level.INFO, "StateMachineDescriptor(s) found: {0}", stateMachineDescriptors);
                for (VariableDescriptorEntity stateMachineDescriptor : stateMachineDescriptors) {
                    stateMachines.addAll((Collection<StateMachineInstanceEntity>) stateMachineDescriptor.getScope().getVariableInstances());
                }
            }
            //NEEEEEED a player id !
        }
    }

    @PostConstruct
    public void buildIgnorableInstances() {
        ignorableInstances.add(StateMachineInstanceEntity.class);
        ignorableInstances.add(TriggerInstanceEntity.class);
    }
}
