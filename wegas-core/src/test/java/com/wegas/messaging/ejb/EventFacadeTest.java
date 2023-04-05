/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.events.Event;
import com.wegas.core.persistence.variable.events.EventInboxDescriptor;
import com.wegas.core.persistence.variable.events.EventInboxInstance;
import com.wegas.core.rest.ScriptController;
import com.wegas.test.arquillian.AbstractArquillianTest;
import jakarta.inject.Inject;
import java.util.List;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Benjamin
 */
public class EventFacadeTest extends AbstractArquillianTest {

    protected static final Logger logger = LoggerFactory.getLogger(EventFacadeTest.class);

    @Inject
    private ScriptController scriptController;

    private void exec(Player player, String script) throws NamingException {
        final Script s = new Script();
        s.setLanguage("JavaScript");
        s.setContent(script);
        scriptFacade.eval(player.getId(), s, null);
    }

    /**
     * Test of InboxDescriptor.sendMessage(*)
     */
    @Test
    public void testEventInboxDescriptor_SendEvent() throws Exception {
        logger.info("send(player, evt)");

        EventInboxDescriptor evtInbox = new EventInboxDescriptor();
        evtInbox.setName("eventInbox");
        evtInbox.setDefaultInstance(new EventInboxInstance());
        variableDescriptorFacade.create(scenario.getId(), evtInbox);

        VariableDescriptor vd = variableDescriptorFacade.find(player.getGameModel(), "eventInbox");
        EventInboxInstance instance = (EventInboxInstance) vd.getInstance(player);

        assertEquals(0, instance.getEvents().size());

        this.exec(player, "Variable.find(gameModel, \"eventInbox\").sendEvent(self, \"payload 1\")");

        // update instance
        instance = (EventInboxInstance) vd.getInstance(player);

        var events = instance.getEvents();
        assertEquals(1, events.size());

        var firstId = events.get(0).getId();

        // 2nd event
        this.exec(player, "Variable.find(gameModel, \"eventInbox\").sendEvent(self, \"payload 2\")");
        instance = (EventInboxInstance) vd.getInstance(player);

        events = instance.getEvents();
        assertEquals(2, events.size());

        Event secondEvent = events.get(1);

        //check that 2nd event has a pointer to its predecessor
        assertEquals(secondEvent.getPreviousEvent().getId(), firstId);

        var ent = instance.getEntities();
        var entities = (List<AbstractEntity>) instance.getEntities().entrySet().toArray()[0];
        var shallowInstance = (EventInboxInstance) entities.get(0);

        assertEquals(0, shallowInstance.getEvents().size());
    }

}
