/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.test.arquillian.AbstractArquillianTest;
import jakarta.inject.Inject;
import org.junit.Assert;
import org.junit.Test;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class GameControllerTest extends AbstractArquillianTest {

    @Inject
    private GameController gameController;

    @Inject
    private PlayerController playerController;

    @Test
    public void joinIndividually() throws Exception {
        scenario.getProperties().setFreeForAll(true);
        gameModelFacade.update(scenario.getId(), scenario);

        TriggerDescriptor trigg = new TriggerDescriptor();
        final StateMachineInstance triggerInstance = new StateMachineInstance();
        trigg.setName("trigg");
        trigg.setDefaultInstance(triggerInstance);
        variableDescriptorFacade.create(scenario.getId(), trigg);

        gameController.joinIndividually(null, game.getId());

        final Game g = gameFacade.find(game.getId());
        final Player p = g.getTeams().get(g.getTeams().size() - 1).getPlayers().get(0);
        final VariableInstance variableInstance = variableInstanceFacade.find(trigg.getId(), p.getId());
        Assert.assertTrue(variableInstance instanceof StateMachineInstance);

        playerController.delete(p.getId());
    }
}
