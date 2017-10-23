/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.test.arquillian.AbstractArquillianTest;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Result;
import java.util.Arrays;
import javax.ejb.EJB;
import javax.naming.NamingException;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class VariableDescriptorControllerTest extends AbstractArquillianTest {

    @EJB
    private VariableDescriptorController variableDescriptorController;

    @Test
    public void testContains() throws NamingException {
        System.out.println("contains");
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(1));
        variableDescriptorFacade.create(gameModel.getId(), number);
        Assert.assertTrue(variableDescriptorController.idsContains(gameModel.getId(), "testnum").contains(number.getId()));

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(new Script("var imascriptcontent"));
        variableDescriptorFacade.create(gameModel.getId(), trigger);
        Assert.assertTrue(variableDescriptorController.idsContains(gameModel.getId(), "imascriptcontent").contains(trigger.getId()));
    }

    @Test
    public void testContainsAll() throws NamingException {
        System.out.println("containsAll");
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(1));
        variableDescriptorFacade.create(gameModel.getId(), number);
        Assert.assertTrue(variableDescriptorController.idsContainsAll(gameModel.getId(), "testnum").contains(number.getId()));
        Assert.assertTrue(!variableDescriptorController.idsContainsAll(gameModel.getId(), "testnumber2").contains(number.getId()));

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(new Script("var imascriptcontent"));
        variableDescriptorFacade.create(gameModel.getId(), trigger);
        Assert.assertTrue(variableDescriptorController.idsContainsAll(gameModel.getId(), "imascriptcontent").contains(trigger.getId()));

        /* TEST MCQ */
        System.out.println("MCQ");
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        question.setDescription("Find me");
        variableDescriptorFacade.create(gameModel.getId(), question);

        ChoiceDescriptor choice = new ChoiceDescriptor();
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setDescription("Find me");
        Result r = new Result("Reply 1");
        choice.addResult(r);
        Result r2 = new Result("Reply 2");
        r2.setImpact(new Script("var imascript"));
        choice.addResult(r2);
        variableDescriptorFacade.createChild(question.getId(), choice);
        Assert.assertTrue(variableDescriptorController.idsContainsAll(gameModel.getId(), "me, find").containsAll(Arrays.asList(question.getId(), choice.getId())));
        Assert.assertTrue(variableDescriptorController.idsContainsAll(gameModel.getId(), "script ima").contains(choice.getId()));
    }

}
