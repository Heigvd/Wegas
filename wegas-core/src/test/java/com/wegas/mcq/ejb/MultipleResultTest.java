/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.Result;
import com.wegas.test.TestHelper;
import com.wegas.test.arquillian.AbstractArquillianTest;
import com.wegas.test.mcq.Answerer;
import java.util.function.Function;
import javax.inject.Inject;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent <maxence.laurent> at <gmail.com>
 */
public class MultipleResultTest extends AbstractArquillianTest {

    @Inject
    private QuestionDescriptorFacade questionDescriptorFacade;

    @Inject
    private Answerer answerer;

    private static final Logger logger = LoggerFactory.getLogger(MultipleResultTest.class);


    @Test
    public void testSelectAndValidateChoice() {
        // Create a 1reply-question
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        question.setAllowMultipleReplies(false);
        variableDescriptorFacade.create(scenario.getId(), question);

        // With 2 choices
        ChoiceDescriptor choice1 = new ChoiceDescriptor();
        choice1.setDefaultInstance(new ChoiceInstance());
        choice1.setName("choice1");

        Result r1 = wegasFactory.createResult("choice1 result");
        choice1.addResult(r1);

        variableDescriptorFacade.createChild(question.getId(), choice1);

        // second one
        ChoiceDescriptor choice2 = new SingleResultChoiceDescriptor();
        choice2.setDefaultInstance(new ChoiceInstance());
        choice2.setName("choice2");

        Result r2 = wegasFactory.createResult("choice2 result");
        choice1.addResult(r2);
        variableDescriptorFacade.createChild(question.getId(), choice2);

        final Function<ChoiceDescriptor, Runnable> answer = (ChoiceDescriptor choice) -> () -> answerer.selectAndValidateChoice(choice.getId(), player.getId());

        final Thread thread1 = TestHelper.start(answer.apply(choice1));
        final Thread thread2 = TestHelper.start(answer.apply(choice2));

        try {
            thread1.join();
            thread2.join();
        } catch (InterruptedException ex) {
            logger.error("Error {}", ex);
        }

        QuestionInstance qi = question.getInstance(player);
        qi = (QuestionInstance) variableInstanceFacade.find(qi.getId());

        // Make sure the number of reply is 1
        Assert.assertEquals(1, qi.getReplies().size());
    }
}
