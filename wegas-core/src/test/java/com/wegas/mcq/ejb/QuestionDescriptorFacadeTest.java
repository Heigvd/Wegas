/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.mcq.persistence.*;
import org.junit.Test;

import javax.naming.NamingException;

import static org.junit.Assert.assertEquals;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class QuestionDescriptorFacadeTest extends AbstractEJBTest {

    /**
     * Test of selectChoice method, of class QuestionController.
     */
    @Test
    public void testSelectAndValidateChoice() throws Exception {

        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final QuestionDescriptorFacade qdf = lookupBy(QuestionDescriptorFacade.class);

        final NumberDescriptor myNumber = new NumberDescriptor();              // Create a number descriptor
        myNumber.setName("mynumber");
        myNumber.setDefaultInstance(new NumberInstance(0));
        vdf.create(gameModel.getId(), myNumber);

        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        vdf.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setName("testChoice");
        Result r = new Result("result");
        r.setImpact(new Script("mynumber.value = 10"));
        choice.addResult(r);
        vdf.createChild(question.getId(), choice);

        qdf.selectAndValidateChoice(choice.getId(), player.getId());            // Do reply
        assertEquals(10.0, ((NumberInstance) vif.find(myNumber.getId(), player.getId())).getValue(), 0.1);

        vdf.duplicate(question.getId());                                        // Test duplication on question
        vdf.duplicate(choice.getId());

        vdf.remove(question.getId());                                           // Clean up
    }

    @Test
    public void testSelectAndCancel() throws NamingException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final QuestionDescriptorFacade qdf = lookupBy(QuestionDescriptorFacade.class);

        final NumberDescriptor myNumber = new NumberDescriptor();              // Create a number descriptor
        myNumber.setName("mynumber");
        myNumber.setDefaultInstance(new NumberInstance(0));
        vdf.create(gameModel.getId(), myNumber);
        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        vdf.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setName("testChoice");
        Result r = new Result("result");
        r.setImpact(new Script("mynumber.value = 10"));
        choice.addResult(r);
        vdf.createChild(question.getId(), choice);

        final Reply reply = qdf.selectChoice(choice.getId(), player.getId());
        assertEquals(((NumberInstance)vif.find(myNumber.getId(), player.getId())).getValue(), 0, 0.0); // Nothing happened
        assertEquals(((QuestionInstance)vif.find(question.getId(), player.getId())).getReplies().size(), 1);
        qdf.cancelReply(player.getId(), reply.getId());
        assertEquals(((QuestionInstance)vif.find(question.getId(), player.getId())).getReplies().size(), 0);
        vdf.remove(question.getId());
    }

    @Test
    public void testResetAndDestroy() throws Exception {

        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());

        ChoiceDescriptor choice = new ChoiceDescriptor();
        question.addItem(choice);
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");
        choice.addResult(r);

        choice.changeCurrentResult(choice.getDefaultInstance(), r);

        vdf.create(gameModel.getId(), question);

        gameModelFacade.reset(gameModel.getId());
        gameModel = gameModelFacade.find(gameModel.getId());

        //vdf.remove(choice.getId());
        vdf.remove(question.getId());
    }

    @Test
    public void testCurrentResult() throws Exception {

        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's

        // Create a question descriptor
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        vdf.create(gameModel.getId(), question);

        // Add a choice descriptor w/ 2 replies
        ChoiceDescriptor choice = new ChoiceDescriptor();
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");
        choice.addResult(r);
        Result r2 = new Result("result_2");
        choice.addResult(r2);
        // And the default reply is the second
        // ((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(r2); 
        vdf.createChild(question.getId(), choice);
        choice = (ChoiceDescriptor) vdf.find(choice.getId());
        r = choice.getResultByName("result");
        r2 = choice.getResultByName("result_2");

        // Set the default reply to the second one
        //((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(null);
        choice.changeCurrentResult(choice.getDefaultInstance(), r2);

        choice = (ChoiceDescriptor) vdf.update(choice.getId(), choice);

        // Restart to propagate default instance value change
        gameModelFacade.reset(gameModel.getId());

        // Retrieve entity
        choice = (ChoiceDescriptor) vdf.find(choice.getId());
        // And check the current result is stored
        assertEquals("result_2", choice.getInstance(player).getResult().getName());

        ChoiceDescriptor duplicate = (ChoiceDescriptor) vdf.duplicate(choice.getId());
        duplicate = (ChoiceDescriptor) vdf.find(duplicate.getId());

        duplicate.getDefaultInstance().getResult().getName();
        // Restart to propagate default instance value change
        gameModelFacade.reset(gameModel.getId());
        // Retrieve entity
        //duplicate = (ChoiceDescriptor) vdf.find(duplicate.getId());
        // And check the current result is stored
        assertEquals("result_2", duplicate.getInstance(player).getResult().getName());

        // Clean up
        vdf.remove(question.getId());
    }

    @Test
    public void testRemoveResponse() throws NamingException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's

        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        vdf.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");                                      // w/ 2 replies
        choice.addResult(r);
        Result r2 = new Result("result");
        choice.addResult(r2);
        // ((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(r2); // And the default reply is the second
        vdf.createChild(question.getId(), choice);

        choice.getResults().remove(0);
        vdf.update(choice.getId(), choice);

        assertEquals("result_2", ((ChoiceDescriptor) vdf.find(choice.getId())).getResults().get(0).getName());
        vdf.remove(question.getId());
    }

    @Test
    public void testRemoveResponse2() throws NamingException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's

        // Create a question descriptor
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        vdf.create(gameModel.getId(), question);

        // Add a choice descriptor and 3 replies
        ChoiceDescriptor choice = new ChoiceDescriptor();
        choice.setDefaultInstance(new ChoiceInstance());
        Result r = new Result("result");
        choice.addResult(r);
        Result r2 = new Result("result");
        choice.addResult(r2);
        Result r3 = new Result("result");
        choice.addResult(r3);

        vdf.createChild(question.getId(), choice);

        // Set the second as default
        choice.changeCurrentResult(choice.getDefaultInstance(), r2);
        choice = (ChoiceDescriptor) vdf.update(choice.getId(), choice);

        // and remove it
        choice.getResults().remove(1);
        vdf.update(choice.getId(), choice);

        assertEquals("result", ((ChoiceDescriptor) vdf.find(choice.getId())).getResults().get(0).getName());
        vdf.remove(question.getId());
    }
}
