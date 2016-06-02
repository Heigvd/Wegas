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
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.util.Calendar;
import junit.framework.Assert;
import org.junit.Test;

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

    @Test
    public void removeIdles() throws Exception {
        final GameController gameController = lookupBy(GameController.class);
        final UserFacade userFacade = lookupBy(UserFacade.class);
        final AccountFacade accountFacade = lookupBy(AccountFacade.class);

        gameModel.getProperties().setFreeForAll(true);
        gameModelFacade.update(gameModel.getId(), gameModel);

        User user = userFacade.getCurrentUser();                                // Set created time to 3 month ago
        Calendar calendar = Calendar.getInstance();

        calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 13);
        AbstractAccount account = user.getMainAccount();

        account.setCreatedTime(calendar.getTime());
        accountFacade.merge(account);

        gameController.joinIndividually(game.getId());

        userFacade.removeIdleGuests();

    }
}
