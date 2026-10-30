/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
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
import jakarta.inject.Inject;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertNotSame;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertTrue;
import org.junit.Test;
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

        assertEquals("from6", messages.get(0).getFrom().translateOrEmpty(player));
        assertEquals("from5", messages.get(1).getFrom().translateOrEmpty(player));
        assertEquals("from4", messages.get(2).getFrom().translateOrEmpty(player));
        assertEquals("from3", messages.get(3).getFrom().translateOrEmpty(player));
        assertEquals("from2", messages.get(4).getFrom().translateOrEmpty(player));
        assertEquals("from1", messages.get(5).getFrom().translateOrEmpty(player));
    }

    /**
     * Missing (undefined/null) fields and mixed string/i18n arguments must neither produce
     * "undefined"/"[object Object]" texts nor fail.
     */
    @Test
    public void testSendMessage_MissingAndMixedArguments() throws Exception {
        InboxDescriptor inbox = new InboxDescriptor();
        inbox.setName("inbox");
        inbox.setDefaultInstance(new InboxInstance());
        variableDescriptorFacade.create(scenario.getId(), inbox);

        String tc = "var tc = function(s) {"
            + "  var t = {};"
            + "  t[gameModel.getRawLanguages().get(0).getCode()] = {translation: s, status: ''};"
            + "  return {'@class': 'TranslatableContent', translations: t};"
            + "};"
            + "var inbox = Variable.find(gameModel, 'inbox');"
            + "var ii = inbox.getInstance(self);";

        // instance, i18n (as PMGHelper.sendMessage does with empty from and body)
        this.exec(player, tc + "ii.sendMessage(undefined, tc('subject1'), undefined, tc('date1'), 't1', []);");
        // instance, everything missing
        this.exec(player, tc + "ii.sendMessage(undefined, undefined, undefined, undefined, 't2', undefined);");
        this.exec(player, tc + "ii.sendMessage(null, null, null, null, 't3', null);");
        // instance, mixed string and i18n
        this.exec(player, tc + "ii.sendMessage('from4', tc('subject4'), tc('body4'), undefined, 't4', []);");
        // instance, 4 args: date or attachments
        this.exec(player, tc + "ii.sendMessage('from5', 'subject5', 'body5', 'date5');");
        this.exec(player, tc + "ii.sendMessage('from6', 'subject6', 'body6', ['att6']);");
        // instance, token missing
        this.exec(player, tc + "ii.sendWithToken('from7', 'subject7', undefined, undefined);");
        // descriptor, i18n with missing fields and JS attachments
        this.exec(player, tc + "inbox.sendMessage(self, undefined, tc('date8'), tc('subject8'), undefined, 't8',"
            + " [{'@class': 'Attachment', file: tc('att8')}]);");
        // descriptor, legacy string methods with missing fields
        this.exec(player, tc + "inbox.sendMessage(self, undefined, 'subject9', undefined);");
        this.exec(player, tc + "inbox.sendDatedMessage(self, 'from10', undefined, 'subject10', 'body10');");
        this.exec(player, tc + "inbox.sendMessageWithToken(self, undefined, 'subject11', 'body11', 't11');");
        this.exec(player, tc + "inbox.sendMessage(self, 'from12', tc('subject12'), undefined, undefined);");

        InboxInstance ii = (InboxInstance) variableInstanceFacade.find(inbox.getId(), player);
        assertEquals(12, ii.getMessages().size());

        for (Message m : ii.getMessages()) {
            for (String text : new String[]{
                m.getFrom().translateOrEmpty(player),
                m.getSubject().translateOrEmpty(player),
                m.getBody().translateOrEmpty(player),
                m.getDate().translateOrEmpty(player)}) {
                assertFalse(text, text.contains("undefined"));
                assertFalse(text, text.contains("[object"));
            }
            assertTrue(m.getToken() == null || !m.getToken().contains("undefined"));
        }

        Message m1 = ii.getMessageByToken("t1");
        assertEquals("", m1.getFrom().translateOrEmpty(player));
        assertEquals("subject1", m1.getSubject().translateOrEmpty(player));
        assertEquals("", m1.getBody().translateOrEmpty(player));
        assertEquals("date1", m1.getDate().translateOrEmpty(player));

        Message m2 = ii.getMessageByToken("t2");
        assertEquals("", m2.getSubject().translateOrEmpty(player));
        assertEquals(0, m2.getAttachments().size());
        assertEquals("", ii.getMessageByToken("t3").getBody().translateOrEmpty(player));

        Message m4 = ii.getMessageByToken("t4");
        assertEquals("from4", m4.getFrom().translateOrEmpty(player));
        assertEquals("subject4", m4.getSubject().translateOrEmpty(player));
        assertEquals("body4", m4.getBody().translateOrEmpty(player));

        Message m5 = ii.getMessageBySubject("subject5");
        assertEquals("date5", m5.getDate().translateOrEmpty(player));
        assertEquals(0, m5.getAttachments().size());

        Message m6 = ii.getMessageBySubject("subject6");
        assertEquals("", m6.getDate().translateOrEmpty(player));
        assertEquals(1, m6.getAttachments().size());
        assertEquals("att6", m6.getAttachments().get(0).getFile().translateOrEmpty(player));

        Message m7 = ii.getMessageBySubject("subject7");
        assertNull(m7.getToken());
        assertEquals("", m7.getBody().translateOrEmpty(player));

        Message m8 = ii.getMessageByToken("t8");
        assertEquals("", m8.getFrom().translateOrEmpty(player));
        assertEquals("date8", m8.getDate().translateOrEmpty(player));
        assertEquals("subject8", m8.getSubject().translateOrEmpty(player));
        assertEquals("att8", m8.getAttachments().get(0).getFile().translateOrEmpty(player));

        assertEquals("", ii.getMessageBySubject("subject9").getFrom().translateOrEmpty(player));
        assertEquals("", ii.getMessageBySubject("subject10").getDate().translateOrEmpty(player));
        assertEquals("", ii.getMessageByToken("t11").getFrom().translateOrEmpty(player));

        Message m12 = ii.getMessageBySubject("subject12");
        assertEquals("from12", m12.getFrom().translateOrEmpty(player));
        assertEquals(0, m12.getAttachments().size());
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
        assertEquals(1, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        assertEquals(1, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        assertTrue("test".equals(ii.getMessages().get(0).getBody().translateOrEmpty(player)));

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
        assertEquals(1, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        assertEquals("msg2", ii.getMessages().get(0).getBody().translateOrEmpty(player));
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
        assertEquals(0, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        //This MAY Fail
        scriptController.run(scenario.getId(), player.getId(), null, new Script("Variable.find(gameModel,'testnumber').setValue(self,2)"));
        // This NEVER fails
//        scriptFacade.eval(player.getId(), new Script("Variable.find(scenario,'testnumber').setValue(self,2)"), null);
//        lookupBy(RequestFacade.class).commit();
        assertEquals(2, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        assertNotSame(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody(), ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1).getBody());
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
        assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        //assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0);

        assertEquals("test", ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody().translateOrEmpty(player));
        assertEquals("test", ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1).getBody().translateOrEmpty(player));
        assertEquals("test", ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(2).getBody().translateOrEmpty(player));

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
        assertEquals(3, ii.getMessages().size());
        //assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0);

        assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody().translateOrEmpty(player).equals("test"));
        assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0) != null);
        assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1) != null);
        assertTrue(((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(2) != null);

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
        assertEquals(4, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().size());
        //assertEquals(3, ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player21)).getMessages().size());
        ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0);

        assertEquals("test", ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(0).getBody().translateOrEmpty(player));
        assertEquals("test", ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(1).getBody().translateOrEmpty(player));
        assertEquals("test", ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(2).getBody().translateOrEmpty(player));
        assertEquals("test", ((InboxInstance) variableInstanceFacade.find(inbox.getId(), player)).getMessages().get(3).getBody().translateOrEmpty(player));

        // Clean up
        variableDescriptorFacade.remove(inbox.getId());
    }
}
