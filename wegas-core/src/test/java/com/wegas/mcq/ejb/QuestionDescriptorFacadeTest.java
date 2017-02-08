/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.TestHelper;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.mcq.persistence.*;
import org.junit.Test;

import javax.naming.NamingException;

import static org.junit.Assert.assertEquals;
import org.junit.BeforeClass;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class QuestionDescriptorFacadeTest extends AbstractEJBTest {

    private static QuestionDescriptorFacade qdf;

    @BeforeClass
    public static void setUpClass() {
        qdf = QuestionDescriptorFacade.lookup();
    }

    /**
     * Test of selectChoice method, of class QuestionController.
     */
    @Test
    public void testSelectAndValidateChoice() throws Exception {
        final NumberDescriptor myNumber = new NumberDescriptor();              // Create a number descriptor
        myNumber.setName("mynumber");
        myNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(gameModel.getId(), myNumber);

        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        variableDescriptorFacade.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setName("testChoice");
        Result r = new Result("result");
        r.setImpact(new Script("mynumber.value = 10"));
        choice.addResult(r);
        variableDescriptorFacade.createChild(question.getId(), choice);

        qdf.selectAndValidateChoice(choice.getId(), player.getId());            // Do reply
        assertEquals(10.0, ((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0.1);

        variableDescriptorFacade.duplicate(question.getId());                                        // Test duplication on question
        variableDescriptorFacade.duplicate(choice.getId());

        variableDescriptorFacade.remove(question.getId());                                           // Clean up
    }

    /**
     * Test of selectChoice method, of class QuestionController. The question is
     * of type "checkbox" with ignoration impact on one choice.
     */
    @Test
    public void testSelectAndValidateCBX() throws Exception {
        final NumberDescriptor myNumber1 = new NumberDescriptor();              // Create a number descriptor
        myNumber1.setName("mynumber1");
        myNumber1.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(gameModel.getId(), myNumber1);

        final NumberDescriptor myNumber2 = new NumberDescriptor();              // Create a 2nd number descriptor for ignoration impact
        myNumber2.setName("mynumber2");
        myNumber2.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(gameModel.getId(), myNumber2);

        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        question.setCbx(true);
        variableDescriptorFacade.create(gameModel.getId(), question);

        ChoiceDescriptor choice1 = new ChoiceDescriptor();                       // Add a choice descriptor
        choice1.setDefaultInstance(new ChoiceInstance());
        choice1.setName("testChoice1");
        Result r1 = new Result("result1");
        r1.setImpact(new Script("Variable.find(gameModel, \"mynumber1\").setValue(self, 10);"));
        choice1.addResult(r1);
        variableDescriptorFacade.createChild(question.getId(), choice1);

        ChoiceDescriptor choice2 = new ChoiceDescriptor();                       // Add a 2nd choice descriptor for ignored answer
        choice2.setDefaultInstance(new ChoiceInstance());
        choice2.setName("testChoice2");
        Result r2 = new Result("result2");
        //r2.setIgnorationImpact(new Script("mynumber2.value = 50;"));
        r2.setIgnorationImpact(new Script("Variable.find(gameModel, \"mynumber2\").setValue(self, 50);"));
        choice2.addResult(r2);
        variableDescriptorFacade.createChild(question.getId(), choice2);

        qdf.selectChoice(choice1.getId(), player.getId());                       // Select reply and validate question
        QuestionInstance qif = question.getInstance(player);
        qdf.validateQuestion(qif.getId(), player.getId());
        assertEquals(10.0, ((NumberInstance) variableInstanceFacade.find(myNumber1.getId(), player.getId())).getValue(), 0.1);
        assertEquals(50.0, ((NumberInstance) variableInstanceFacade.find(myNumber2.getId(), player.getId())).getValue(), 0.1);

        qif = (QuestionInstance) variableInstanceFacade.find(qif.getId());
        assertEquals(2, qif.getReplies().size());

        variableDescriptorFacade.duplicate(question.getId());                                        // Test duplication of question

        variableDescriptorFacade.remove(question.getId());                                           // Clean up
    }

    @Test
    public void testSelectAndCancel() throws NamingException {
        final NumberDescriptor myNumber = new NumberDescriptor();              // Create a number descriptor
        myNumber.setName("mynumber");
        myNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(gameModel.getId(), myNumber);
        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        variableDescriptorFacade.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setName("testChoice");
        Result r = new Result("result");
        r.setImpact(new Script("mynumber.value = 10"));
        choice.addResult(r);
        variableDescriptorFacade.createChild(question.getId(), choice);
        TestHelper.wipeEmCache();
        final Reply reply = qdf.selectChoice(choice.getId(), player.getId());
        assertEquals(((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0, 0.0); // Nothing happened
        assertEquals(((QuestionInstance) variableInstanceFacade.find(question.getId(), player.getId())).getReplies().size(), 1);
        final Reply reply1 = qdf.cancelReply(player.getId(), reply.getId());
        assertEquals(0, reply1.getQuestionInstance().getReplies().size());
        assertEquals(((QuestionInstance) variableInstanceFacade.find(question.getId(), player.getId())).getReplies().size(), 0);
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testResetAndDestroy() throws Exception {
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());

        ChoiceDescriptor choice = new ChoiceDescriptor();
        question.addItem(choice);
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");
        choice.addResult(r);

        choice.changeCurrentResult(choice.getDefaultInstance(), r);

        variableDescriptorFacade.create(gameModel.getId(), question);

        gameModelFacade.reset(gameModel.getId());
        gameModel = gameModelFacade.find(gameModel.getId());

        //variableDescriptorFacade.remove(choice.getId());
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testCurrentResult() throws Exception {
        // Create a question descriptor
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        variableDescriptorFacade.create(gameModel.getId(), question);

        // Add a choice descriptor w/ 2 replies
        ChoiceDescriptor choice = new ChoiceDescriptor();
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");
        choice.addResult(r);
        Result r2 = new Result("result_2");
        choice.addResult(r2);
        // And the default reply is the second
        // ((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(r2);
        variableDescriptorFacade.createChild(question.getId(), choice);
        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        r = choice.getResultByName("result");
        r2 = choice.getResultByName("result_2");

        // Set the default reply to the second one
        //((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(null);
        choice.changeCurrentResult(choice.getDefaultInstance(), r2);

        choice = (ChoiceDescriptor) variableDescriptorFacade.update(choice.getId(), choice);

        // Restart to propagate default instance value change
        gameModelFacade.reset(gameModel.getId());

        // Retrieve entity
        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        // And check the current result is stored
        assertEquals("result_2", choice.getInstance(player).getResult().getName());

        ChoiceDescriptor duplicate = (ChoiceDescriptor) variableDescriptorFacade.duplicate(choice.getId());
        duplicate = (ChoiceDescriptor) variableDescriptorFacade.find(duplicate.getId());

        duplicate.getDefaultInstance().getResult().getName();
        // Restart to propagate default instance value change
        gameModelFacade.reset(gameModel.getId());
        // Retrieve entity
        //duplicate = (ChoiceDescriptor) variableDescriptorFacade.find(duplicate.getId());
        // And check the current result is stored
        assertEquals("result_2", duplicate.getInstance(player).getResult().getName());

        // Clean up
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testRemoveResponse() throws NamingException {
        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        variableDescriptorFacade.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");                                      // w/ 2 replies
        choice.addResult(r);
        Result r2 = new Result("result");
        choice.addResult(r2);
        // ((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(r2); // And the default reply is the second
        variableDescriptorFacade.createChild(question.getId(), choice);

        choice.getResults().remove(0);
        variableDescriptorFacade.update(choice.getId(), choice);

        assertEquals("result_2", ((ChoiceDescriptor) variableDescriptorFacade.find(choice.getId())).getResults().get(0).getName());
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testRemoveResponse2() throws NamingException {
        // Create a question descriptor
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        variableDescriptorFacade.create(gameModel.getId(), question);

        // Add a choice descriptor and 3 replies
        ChoiceDescriptor choice = new ChoiceDescriptor();
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");
        choice.addResult(r);
        Result r2 = new Result("result");
        choice.addResult(r2);
        Result r3 = new Result("result");
        choice.addResult(r3);

        variableDescriptorFacade.createChild(question.getId(), choice);

        // Set the second as default
        choice.changeCurrentResult(choice.getDefaultInstance(), r2);
        choice = (ChoiceDescriptor) variableDescriptorFacade.update(choice.getId(), choice);

        // and remove it
        choice.getResults().remove(1);
        variableDescriptorFacade.update(choice.getId(), choice);

        assertEquals("result", ((ChoiceDescriptor) variableDescriptorFacade.find(choice.getId())).getResults().get(0).getName());
        variableDescriptorFacade.remove(question.getId());
    }
}
