package com.wegas.messaging.ejb;

import com.wegas.core.ejb.*;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import com.wegas.core.rest.ScriptController;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.NamingException;
import java.util.ArrayList;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
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
        assertEquals(2, mf.count()); // 2 messages in DB.
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
        logger.info("send inbox trigger");
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
                new Script("print(\"sending\");var inbox = VariableDescriptorFacade.find(" + inbox.getId() + "); inbox.sendMessage(self, \"test\", \"test\", \"test\");"));
        vdf.create(gameModel.getId(), trigger);

        // Reset
        gameModelFacade.reset(gameModel.getId());

        InboxInstance ii = ((InboxInstance) vif.find(inbox.getId(), player));
        // Test
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player2)).getMessages().size());
        assertTrue(ii.getMessages().get(0).getBody().equals("test"));

        // Clean up
        vdf.remove(inbox.getId());
        vdf.remove(trigger.getId());
    }

    @Test
    public void testInboxSendMultipleCapped() throws NamingException {
        logger.info("send inbox trigger");
        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ScriptFacade scriptFacade = lookupBy(ScriptFacade.class);

        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setCapped(true);
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setPostTriggerEvent(
                new Script("Variable.find(gameModel, 'inbox').sendMessage(self, \"test\", \"test\", \"msg1\");\n" +
                        "Variable.find(gameModel, 'inbox').sendMessage(self, \"test\", \"test\", \"msg2\");\n"));
        vdf.create(gameModel.getId(), trigger);

        // Reset
        gameModelFacade.reset(gameModel.getId());

        InboxInstance ii = ((InboxInstance) vif.find(inbox.getId(), player));
        // Test
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        assertTrue(ii.getMessages().get(0).getBody().equals("msg2"));
        scriptFacade.eval(player, new Script("Variable.find(gameModel, 'inbox').sendMessage(self, \"test\", \"test\", \"msg out\");"), null);
        // Clean up
        vdf.remove(inbox.getId());
        vdf.remove(trigger.getId());
    }

    @Test
    public void testTriggeredMessage() throws NamingException {
        logger.info("send inbox trigger");
        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ScriptFacade scriptFacade = lookupBy(ScriptFacade.class);
        final ScriptController scriptController = lookupBy(ScriptController.class);

        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new PlayerScope());
        vdf.create(gameModel.getId(), number);
        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setCapped(false);
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);
        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("Variable.find(gameModel,'testnumber').getValue(self) > 0"));
        trigger.setOneShot(false);
        trigger.setDisableSelf(false);
        trigger.setPostTriggerEvent(
                new Script("Variable.find(gameModel, 'inbox').sendDatedMessage(self, \"test\", \"now\" ,\"test\", \"msg1\", []);\n"));
        vdf.create(gameModel.getId(), trigger);

        TriggerDescriptor trig = new TriggerDescriptor();
        trig.setDefaultInstance(new TriggerInstance());
        trig.setTriggerEvent(new Script("false"));
        trig.setOneShot(false);
        trig.setDisableSelf(false);
        trig.setPostTriggerEvent(
                new Script(""));
        vdf.create(gameModel.getId(), trig);

        gameModelFacade.reset(gameModel.getId());

        InboxInstance ii = ((InboxInstance) vif.find(inbox.getId(), player));
        assertEquals(0, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        //This MAY Fail
        scriptController.run(gameModel.getId(), player.getId(), null, new Script("Variable.find(gameModel,'testnumber').setValue(self,2)"));
        // This NEVER fails
//        scriptFacade.eval(player.getId(), new Script("Variable.find(gameModel,'testnumber').setValue(self,2)"), null);
//        lookupBy(RequestFacade.class).commit();
        assertEquals(1, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        assertEquals("msg1", ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0).getBody());
    }

    @Test
    public void testInboxSend_ScriptEval_aaa_bbb() throws NamingException {
        logger.info("send inbox trigger");
        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ScriptFacade scriptFacade = lookupBy(ScriptFacade.class);

        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        vdf.flush();

        String script = "var inbox = Variable.find(gameModel, \"inbox\");"
                + "var inbox2 = Variable.find(gameModel, \"inbox\");"
                + "var inbox3 = Variable.find(gameModel, \"inbox\");"
                + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n"
                + "inbox2.sendMessage(self, \"test\", \"test\", \"test\");\n"
                + "inbox3.sendMessage(self, \"test\", \"test\", \"test\");\n";
        scriptFacade.eval(player, new Script("javascript", script), null);

        vdf.flush();
        // Test
        assertEquals(3, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        //assertEquals(3, ((InboxInstance) vif.find(inbox.getId(), player2)).getMessages().size());
        Message get = ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0);

        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0).getBody().equals("test"));
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(1).getBody().equals("test"));
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(2).getBody().equals("test"));

        // Clean up
        vdf.remove(inbox.getId());
    }

    @Test
    public void testInboxSend_ScriptEval_ababab() throws NamingException, WegasNoResultException {
        logger.info("send inbox trigger");
        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ScriptFacade scriptFacade = lookupBy(ScriptFacade.class);

        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);
        /*
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging")).setLevel(Level.TRACE);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging.cache")).setLevel(Level.TRACE);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging.sql")).setLevel(Level.TRACE);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging.default")).setLevel(Level.TRACE);
         */

        String script = "var inbox = Variable.find(gameModel, \"inbox\");"
                + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n"
                + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n"
                + "var inbox2 = Variable.find(gameModel, \"inbox\");"
                + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n";
        scriptFacade.eval(player, new Script("javascript", script), null);

        /*
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging")).setLevel(Level.WARN);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging.cache")).setLevel(Level.WARN);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging.sql")).setLevel(Level.WARN);
        ((ch.qos.logback.classic.Logger) LoggerFactory.getLogger("org.eclipse.persistence.logging.default")).setLevel(Level.WARN);
         */
        InboxDescriptor i2 = (InboxDescriptor) vdf.find(gameModel, "inbox");
        InboxInstance ii = (InboxInstance) vdf.find(gameModel, "inbox").getInstance(player);

        //InboxInstance ii = ((InboxInstance) vif.find(inbox.getId(), player));

        // Test
        assertEquals(3, ii.getMessages().size());
        //assertEquals(3, ((InboxInstance) vif.find(inbox.getId(), player2)).getMessages().size());
        Message get = ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0);

        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0).getBody().equals("test"));
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0) != null);
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(1) != null);
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(2) != null);

        // Clean up
        vdf.remove(inbox.getId());
    }

    @Test
    public void testInboxSend_ScriptEval_ababab___() throws NamingException {
        logger.info("send inbox trigger");
        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ScriptFacade scriptFacade = lookupBy(ScriptFacade.class);

        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        vdf.create(gameModel.getId(), inbox);

        Long inboxId = inbox.getId();

        String script = "var inbox = Variable.find(" + inboxId + ");"
                + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n"
                + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n"
                + "var inbox2 = Variable.find(" + inboxId + ");"
                + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n"
                + "var inbox3 = Variable.find(" + inboxId + ");"
                + "inbox2.sendMessage(self, \"test\", \"test\", \"test\");\n";
        scriptFacade.eval(player, new Script("javascript", script), null);

        // Test
        assertEquals(4, ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().size());
        //assertEquals(3, ((InboxInstance) vif.find(inbox.getId(), player2)).getMessages().size());
        Message get = ((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0);

        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(0).getBody().equals("test"));
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(1).getBody().equals("test"));
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(2).getBody().equals("test"));
        assertTrue(((InboxInstance) vif.find(inbox.getId(), player)).getMessages().get(3).getBody().equals("test"));

        // Clean up
        vdf.remove(inbox.getId());
    }
}
