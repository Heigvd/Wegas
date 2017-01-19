/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.mcq.persistence.*;
import java.util.logging.Level;
import javax.ejb.EJBException;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;

/**
 *
 * @author Maxence Laurent <maxence.laurent> at <gmail.com>
 */
public class MultipleResultTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(MultipleResultTest.class);

    private class SelectChoiceThread extends Thread {

        private final QuestionDescriptorFacade qdf;
        private final ChoiceDescriptor choice;
        VariableInstanceFacade vif = VariableInstanceFacade.lookup();

        public SelectChoiceThread(ChoiceDescriptor choice) throws NamingException {
            qdf = lookupBy(QuestionDescriptorFacade.class);
            this.choice = choice;
        }

        @Override
        public void run() {
            try {
                qdf.selectAndValidateChoice(choice.getId(), player.getId());            // Do reply
                QuestionInstance instance = choice.getQuestion().getInstance(player);
                RequestFacade.lookup().getRequestManager().unlock("MCQ-" + instance.getId(), instance.getBroadcastTarget());
            } catch (WegasScriptException ex) {
                java.util.logging.Logger.getLogger(MultipleResultTest.class.getName()).log(Level.SEVERE, null, ex);
            }
        }
    }

    @Test
    public void testSelectAndValidateChoice() throws Exception {

        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = VariableInstanceFacade.lookup();
        //final QuestionSingleton qSingleton = lookupBy(QuestionSingleton.class);
        final QuestionDescriptorFacade qdf = QuestionDescriptorFacade.lookup();

        // Create a 1reply-question
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        question.setAllowMultipleReplies(false);
        vdf.create(gameModel.getId(), question);

        // With 2 choices
        ChoiceDescriptor choice1 = new ChoiceDescriptor();
        choice1.setDefaultInstance(new ChoiceInstance());
        choice1.setName("choice1");

        Result r1 = new Result("choice1 result");
        choice1.addResult(r1);

        vdf.createChild(question.getId(), choice1);

        // second one
        ChoiceDescriptor choice2 = new SingleResultChoiceDescriptor();
        choice2.setDefaultInstance(new ChoiceInstance());
        choice2.setName("choice2");

        Result r2 = new Result("choice2 result");
        choice1.addResult(r2);
        vdf.createChild(question.getId(), choice2);

        // Let's answer twice at the same time
        SelectChoiceThread s1 = new SelectChoiceThread(choice1);
        SelectChoiceThread s2 = new SelectChoiceThread(choice2);

        try {
            s1.start();
            s2.start();
        } catch (EJBException e) {
            // One of them will fail...
        }

        s1.join();
        s2.join();

        QuestionInstance find = (QuestionInstance) vif.find(question.getInstance().getId());

        // Make sure the number of reply is 1
        Assert.assertEquals(1, find.getReplies().size());
    }
}
