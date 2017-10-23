/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.test.arquillian.AbstractArquillianTest;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.rest.GameController;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.util.Calendar;
import javax.ejb.EJB;
import org.junit.Test;

/**
 *
 * @author maxence (maxence.laurent at gmail.com)
 */
public class RemoveGuestTest extends AbstractArquillianTest {

    @EJB
    private GameController gameController;

    @Test(expected = WegasNotFoundException.class)
    public void removeIdles() throws Exception {

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

        userFacade.getCurrentUser();
    }
}
