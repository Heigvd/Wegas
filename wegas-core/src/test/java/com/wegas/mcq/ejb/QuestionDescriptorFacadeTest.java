/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.mcq.persistence.*;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 *
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
        myNumber.setScope(new TeamScope());
        vdf.create(gameModel.getId(), myNumber);

        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        question.setScope(new TeamScope());
        vdf.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setScope(new TeamScope());
        choice.setName("testChoice");
        Result r = new Result("1st result");
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
    public void testCurrentResult() throws Exception {

        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's
        final String REPLYNAME1 = "1st reply";
        final String REPLYNAME2 = "2nd reply";

        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        question.setScope(new TeamScope());
        vdf.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setScope(new TeamScope());
        Result r = new Result(REPLYNAME1);                                      // w/ 2 replies
        choice.addResult(r);
        Result r2 = new Result(REPLYNAME2);
        choice.addResult(r2);
        // ((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(r2); // And the default reply is the second
        vdf.createChild(question.getId(), choice);

        ((ChoiceInstance) choice.getDefaultInstance()).setCurrentResultId(r2.getId());// Sset the default reply to the second one
        choice = (ChoiceDescriptor) vdf.update(choice.getId(), choice);

        gameModelFacade.reset(gameModel.getId());                               // Restart to propagate default instance value change

        choice = (ChoiceDescriptor) vdf.find(choice.getId());                   // Retrieve entity
        assertEquals(REPLYNAME2, choice.getInstance(player).getResult().getName());// And check the current result is stored

        ChoiceDescriptor duplicate = (ChoiceDescriptor) vdf.duplicate(choice.getId());

        gameModelFacade.reset(gameModel.getId());                               // Restart to propagate default instance value change

        choice = (ChoiceDescriptor) vdf.find(duplicate.getId());                   // Retrieve entity
        assertEquals(REPLYNAME2, choice.getInstance(player).getResult().getName());// And check the current result is stored

        vdf.remove(question.getId());                                           // Clean up
    }

    @Test
    public void testRemoveResponse() throws NamingException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);// Lookup Ejb's
        final String REPLYNAME1 = "1st reply";
        final String REPLYNAME2 = "2nd reply";

        QuestionDescriptor question = new QuestionDescriptor();                 // Create a question descriptor
        question.setDefaultInstance(new QuestionInstance());
        question.setScope(new TeamScope());
        vdf.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();                       // Add a choice descriptor
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setScope(new TeamScope());
        Result r = new Result(REPLYNAME1);                                      // w/ 2 replies
        choice.addResult(r);
        Result r2 = new Result(REPLYNAME2);
        choice.addResult(r2);
        // ((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(r2); // And the default reply is the second
        vdf.createChild(question.getId(), choice);

        choice.getResults().remove(0);
        vdf.update(choice.getId(), choice);

        assertEquals(REPLYNAME2, ((ChoiceDescriptor) vdf.find(choice.getId())).getResults().get(0).getName());
        vdf.remove(question.getId());
    }
}
