package com.wegas.messaging.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import java.util.ArrayList;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Benjamin
 */
public class MessageFacadeTest extends AbstractEJBTest {

    protected static final Logger logger = LoggerFactory.getLogger(MessageFacadeTest.class);

    /**
     * Test of listener method, of class MessageFacade.
     */
    @Test
    public void testListener() throws Exception {
        logger.info("Test listener");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        MessageEvent me = new MessageEvent();
        Message msg = new Message("from", "subject", "body");
        me.setMessage(msg);
        me.setPlayer(player);
        mf.listener(me);

        //get inbox
        VariableDescriptor vd = vdf.find(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));

        vdf.remove(inbox.getId());
    }

    /**
     * Test of send method, of class MessageFacade.
     */
    @Test
    public void testSend_Player_Message() throws Exception {
        logger.info("send(player, msg)");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        Message msg = new Message("from", "subject", "body");
        mf.send(player, msg);

        //get inbox
        VariableDescriptor vd = vdf.find(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));

        vdf.remove(inbox.getId());
    }

    /**
     * Test of send method, of class MessageFacade.
     */
    @Test
    public void testSend_4args() throws Exception {
        logger.info("send(player, 4args)");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        Message msg = mf.send(player, "from", "subject", "body");

        //get inbox
        VariableDescriptor vd = vdf.find(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));

        vdf.remove(inbox.getId());
    }

    /**
     * Test of send method, of class MessageFacade.
     */
    @Test
    public void testSend_5args() throws Exception {
        logger.info("send(player), 5args");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        //send a message
        ArrayList<String> attachements = new ArrayList<>();
        attachements.add("attachement1");
        attachements.add("attachement2");
        Message msg = mf.send(player, "subject", "body", "from", attachements);

        //get inbox
        VariableDescriptor vd = vdf.find(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        assertEquals(msg, gettedInbox.getMessages().get(0));
        assertEquals("subject", gettedInbox.getMessages().get(0).getSubject());

        vdf.remove(inbox.getId());
    }

    @Test
    public void testMultipleSendMessage() throws Exception {
        logger.info("send(player, msg)");

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final MessageFacade mf = lookupBy(MessageFacade.class);
        final RequestFacade rf = lookupBy(RequestFacade.class);

        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        // Send a message to each player
        mf.send(player, new Message("from", "subject", "body"));
        mf.send(player2, new Message("from", "subject", "body"));

        // Test
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player2)).getMessages().size());
        assertEquals(1, ((InboxInstance) rf.getUpdatedEntities().get("Team-" + team.getId()).get(0)).getMessages().size());
        assertEquals(1, ((InboxInstance) rf.getUpdatedEntities().get("Team-" + team2.getId()).get(0)).getMessages().size());
        // Clean
        vdf.remove(inbox.getId());
    }

    /**
     * Test that each player receives one and only one from a trigger at startup
     *
     * @throws NamingException
     */
    @Test
    public void testInboxSendTrigger() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(
                new Script("print(\"sending\");VariableDescriptorFacade.find(" + inbox.getId() + ").sendMessage(self, \"test\", \"test\", \"test\");"));
        vdf.create(gameModel.getId(), trigger);

        // Reset
        gameModelFacade.reset(gameModel.getId());

        // Test
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player2)).getMessages().size());

        // Clean up
        vdf.remove(inbox.getId());
        vdf.remove(trigger.getId());
    }
}
