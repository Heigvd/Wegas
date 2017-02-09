package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import junit.framework.Assert;
import org.junit.Test;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class GameControllerTest extends AbstractEJBTest {

    @Test
    public void joinIndividually() throws Exception {
        scenario.getProperties().setFreeForAll(true);
        gameModelFacade.update(scenario.getId(), scenario);

        TriggerDescriptor trigg = new TriggerDescriptor();
        final TriggerInstance triggerInstance = new TriggerInstance();
        trigg.setName("trigg");
        trigg.setDefaultInstance(triggerInstance);
        variableDescriptorFacade.create(scenario.getId(), trigg);

        gameController.joinIndividually(game.getId());

        final Game g = gameFacade.find(game.getId());
        final Player p = g.getTeams().get(g.getTeams().size() - 1).getPlayers().get(0);
        final VariableInstance variableInstance = variableInstanceFacade.find(trigg.getId(), p.getId());
        Assert.assertTrue(variableInstance instanceof TriggerInstance);

        playerController.delete(p.getId());
    }
}
