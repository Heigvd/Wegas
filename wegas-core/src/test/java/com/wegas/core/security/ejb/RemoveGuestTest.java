/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.rest.GameController;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.Calendar;
import javax.ejb.EJB;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author maxence (maxence.laurent at gmail.com)
 */
public class RemoveGuestTest extends AbstractArquillianTest {

    @EJB
    private GameController gameController;

    @Test
    public void removeIdles() throws Exception {
        scenario.getProperties().setFreeForAll(true);
        gameModelFacade.update(scenario.getId(), scenario);

        WegasUser oldGuest = guestLogin();
        Calendar calendar = Calendar.getInstance();

        calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 13);
        AbstractAccount account = oldGuest.getUser().getMainAccount();

        account.setCreatedTime(calendar.getTime());
        accountFacade.merge(account);

        gameController.joinIndividually(game.getId());

        login(admin);
        userFacade.removeIdleGuests();

        Assert.assertNull("Guest not null", userFacade.find(oldGuest.getId()));
    }
}
