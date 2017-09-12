/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import org.junit.Test;
import org.junit.Assert;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class GameControllerTest extends AbstractEJBTest {

    @Test
    public void joinIndividually() throws Exception {
        final GameController gameController = lookupBy(GameController.class);
        final GameFacade gameFacade = lookupBy(GameFacade.class);
        final VariableDescriptorFacade variableDescriptorFacade = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade variableInstanceFacade = lookupBy(VariableInstanceFacade.class);
        final PlayerController playerController = lookupBy(PlayerController.class);

        gameModel.getProperties().setFreeForAll(true);
        gameModelFacade.update(gameModel.getId(), gameModel);

        TriggerDescriptor trigg = new TriggerDescriptor();
        final TriggerInstance triggerInstance = new TriggerInstance();
        trigg.setName("trigg");
        trigg.setDefaultInstance(triggerInstance);
        variableDescriptorFacade.create(gameModel.getId(), trigg);

        gameController.joinIndividually(game.getId());

        final Game g = gameFacade.find(game.getId());
        final Player p = g.getTeams().get(g.getTeams().size() - 1).getPlayers().get(0);
        final VariableInstance variableInstance = variableInstanceFacade.find(trigg.getId(), p.getId());
        Assert.assertTrue(variableInstance instanceof TriggerInstance);

        playerController.delete(p.getId());
    }
}
