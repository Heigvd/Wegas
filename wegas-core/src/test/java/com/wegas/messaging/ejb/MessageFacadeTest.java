/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.rest.ScriptController;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.List;
import javax.inject.Inject;
import javax.naming.NamingException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Benjamin
 */
public class MessageFacadeTest extends AbstractArquillianTest {

    protected static final Logger logger = LoggerFactory.getLogger(MessageFacadeTest.class);

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
    public void testInboxDescriptor_SendMessage() throws Exception {
        logger.info("send(player, msg)");

        // Create a inbox
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);

        //send a message
        this.exec(player, "Variable.find(gameModel, \"inbox\").sendMessage(self, \"from1\", \"subject\", \"body\");");
        this.exec(player, "Variable.find(gameModel, \"inbox\").sendMessageWithToken(self, \"from2\", \"subject\", \"body\", \"token\");");
        this.exec(player, "Variable.find(gameModel, \"inbox\").sendDatedMessage(self, \"from3\", \"date\", \"subject\", \"body\");");

        this.exec(player, "Variable.find(gameModel, \"inbox\").sendMessage(self, \"from4\", \"subject\", \"body\", [\"att\"]);");
        //NPE
        this.exec(player, "Variable.find(gameModel, \"inbox\").sendMessage(self, \"from5\", \"date\", \"subject\", \"body\", \"token\", [\"att1\"]);");
        this.exec(player, "Variable.find(gameModel, \"inbox\").sendDatedMessage(self, \"from6\", \"date\", \"subject\", \"body\", [\"att\"]);");

        //get inbox
        VariableDescriptor vd = variableDescriptorFacade.find(player.getGameModel(), "inbox");
        InboxInstance gettedInbox = (InboxInstance) vd.getInstance(player);
        List<Message> messages = gettedInbox.getSortedMessages();

        Assertions.assertEquals("from6", messages.get(0).getFrom().translateOrEmpty(player));
        Assertions.assertEquals("from5", messages.get(1).getFrom().translateOrEmpty(player));
        Assertions.assertEquals("from4", messages.get(2).getFrom().translateOrEmpty(player));
        Assertions.assertEquals("from3", messages.get(3).getFrom().translateOrEmpty(player));
        Assertions.assertEquals("from2", messages.get(4).getFrom().translateOrEmpty(player));
        Assertions.assertEquals("from1", messages.get(5).getFrom().translateOrEmpty(player));
    }

    /**
     * Test that each player receives one and only one from a trigger at startup
     *
     * @throws NamingException
     */
    @Test
    public void testInboxSendTrigger() throws NamingException {
        this.createSecondTeam();
        logger.info("send inbox trigger");

        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(
            new Script("print(\"sending\");var inbox = Variable.find(" + inbox.getId() + "); inbox.sendMessage(self, \"test\", \"test\", \"test\");"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        // Reset
        gameModelFacade.reset(scenario.getId());

        InboxInstance ii = ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player));
        // Test
        Assertions.assertEquals(1, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        Assertions.assertEquals(1, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        Assertions.assertTrue("test".equals(ii.getMessages().get(0).getBody().translateOrEmpty(player)));

        // Clean up
        variableDescriptorFacade.remove(inbox.getId());
        variableDescriptorFacade.remove(trigger.getId());
    }

    @Test
    public void testInboxSendMultipleCapped() throws NamingException {
        logger.info("send inbox trigger");
        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setCapped(true);
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setPostTriggerEvent(
            new Script("Variable.find(gameModel, 'inbox').sendMessage(self, \"test\", \"test\", \"msg1\");\n"
                + "Variable.find(gameModel, 'inbox').sendMessage(self, \"test\", \"test\", \"msg2\");\n"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        // Reset
        gameModelFacade.reset(scenario.getId());

        InboxInstance ii = ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player));
        // Test
        Assertions.assertEquals(1, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        Assertions.assertEquals("msg2", ii.getMessages().get(0).getBody().translateOrEmpty(player));
        scriptFacade.eval(player, new Script("Variable.find(gameModel, 'inbox').sendMessage(self, \"test\", \"test\", \"msg out\");"), null);
        // Clean up
        variableDescriptorFacade.remove(inbox.getId());
        variableDescriptorFacade.remove(trigger.getId());
    }

    @Test
    public void testTriggeredMessage() throws NamingException {
        logger.info("send inbox trigger");
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new PlayerScope());
        variableDescriptorFacade.create(scenario.getId(), number);
        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setCapped(false);
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);
        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("Variable.find(gameModel,'testnumber').getValue(self) > 0"));
        trigger.setOneShot(false);
        trigger.setDisableSelf(false);
        trigger.setPostTriggerEvent(
            new Script("Variable.find(gameModel, 'inbox').sendDatedMessage(self, \"test\", \"now\" ,\"test\", \"msg1\", []);\n"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        TriggerDescriptor trig = new TriggerDescriptor();
        trig.setDefaultInstance(new StateMachineInstance());
        trig.setTriggerEvent(new Script("Variable.find(gameModel,'testnumber').getValue(self) > 0"));
        trig.setOneShot(false);
        trig.setDisableSelf(false);
        trig.setPostTriggerEvent(
            new Script("Variable.find(gameModel, 'inbox').sendDatedMessage(self, \"test\", \"now\" ,\"test\", \"msg2\", []);\n"));
        variableDescriptorFacade.create(scenario.getId(), trig);

        gameModelFacade.reset(scenario.getId());

        variableInstanceFacade.find(inbox.getId(), player);
        Assertions.assertEquals(0, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        //This MAY Fail
        scriptController.run(scenario.getId(), player.getId(), null, new Script("Variable.find(gameModel,'testnumber').setValue(self,2)"));
        // This NEVER fails
//        scriptFacade.eval(player.getId(), new Script("Variable.find(scenario,'testnumber').setValue(self,2)"), null);
//        lookupBy(RequestFacade.class).commit();
        Assertions.assertEquals(2, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        Assertions.assertNotSame(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody(), ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1).getBody());
    }

    @Test
    public void testInboxSend_ScriptEval_aaa_bbb() throws NamingException {
        logger.info("send inbox trigger");
        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);

        variableDescriptorFacade.flush();

        String script = "var inbox = Variable.find(gameModel, \"inbox\");"
            + "var inbox2 = Variable.find(gameModel, \"inbox\");"
            + "var inbox3 = Variable.find(gameModel, \"inbox\");"
            + "inbox.sendMessage(self, \"test\", \"test\", \"test\");\n"
            + "inbox2.sendMessage(self, \"test\", \"test\", \"test\");\n"
            + "inbox3.sendMessage(self, \"test\", \"test\", \"test\");\n";
        scriptFacade.eval(player, new Script("javascript", script), null);

        variableDescriptorFacade.flush();
        // Test
        Assertions.assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        //assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0);

        Assertions.assertEquals(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody().translateOrEmpty(player), "test");
        Assertions.assertEquals(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1).getBody().translateOrEmpty(player), "test");
        Assertions.assertEquals(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(2).getBody().translateOrEmpty(player), "test");

        // Clean up
        variableDescriptorFacade.remove(inbox.getId());
    }

    @Test
    public void testInboxSend_ScriptEval_ababab() throws NamingException, WegasNoResultException {
        logger.info("send inbox trigger");
        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);
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
        variableDescriptorFacade.find(scenario, "inbox");
        InboxInstance ii = (InboxInstance) variableDescriptorFacade.find(scenario, "inbox").getInstance(player);

        //InboxInstance ii = ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player));
        // Test
        Assertions.assertEquals(3, ii.getMessages().size());
        //assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0);

        Assertions.assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody().translateOrEmpty(player).equals("test"));
        Assertions.assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0) != null);
        Assertions.assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1) != null);
        Assertions.assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(2) != null);

        // Clean up
        variableDescriptorFacade.remove(inbox.getId());
    }

    @Test
    public void testInboxSend_ScriptEval_ababab___() throws NamingException {
        logger.info("send inbox trigger");
        // Create a inbox descriptor
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);

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
        Assertions.assertEquals(4, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        //assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0);

        Assertions.assertEquals(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody().translateOrEmpty(player), "test");
        Assertions.assertEquals(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1).getBody().translateOrEmpty(player), "test");
        Assertions.assertEquals(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(2).getBody().translateOrEmpty(player), "test");
        Assertions.assertEquals(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(3).getBody().translateOrEmpty(player), "test");

        // Clean up
        variableDescriptorFacade.remove(inbox.getId());
    }
}
