/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.mcq.persistence.*;
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
}
