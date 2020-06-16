/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Reply;
import com.wegas.mcq.persistence.Result;
import com.wegas.test.arquillian.AbstractArquillianTest;
import javax.inject.Inject;
import javax.naming.NamingException;
import org.junit.Assert;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import org.junit.Test;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class QuestionDescriptorFacadeTest extends AbstractArquillianTest {

    @Inject
    private QuestionDescriptorFacade questionDescriptorFacade;

    private QuestionDescriptor createCbxQuestion(long gmId, String name, Integer min, Integer max) {
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        question.setName(name);
        question.setCbx(Boolean.TRUE);
        question.setMinReplies(min);
        question.setMaxReplies(max);
        variableDescriptorFacade.create(gmId, question);

        return question;
    }

    private QuestionDescriptor createQuestion(long gmId, String name, Integer max) {
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());
        question.setName(name);
        question.setMaxReplies(max);
        variableDescriptorFacade.create(gmId, question);

        return question;
    }

    private ChoiceDescriptor createChoice(QuestionDescriptor question, String name, Integer max, String defaultResultName, Result... results) {
        ChoiceDescriptor choice = new ChoiceDescriptor();
        choice.setDefaultInstance(new ChoiceInstance());
        choice.setMaxReplies(max);
        choice.setName(name);

        for (Result r : results) {
            choice.addResult(r);
        }
        choice.getDefaultInstance().setCurrentResultName(defaultResultName);

        variableDescriptorFacade.createChild(question.getId(), choice);

        return choice;
    }

    /**
     * Test of selectChoice method, of class QuestionController.
     */
    @Test
    public void testSelectAndValidateChoice() throws Exception {
        final NumberDescriptor myNumber = new NumberDescriptor();
        myNumber.setName("mynumber");
        myNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), myNumber);

        QuestionDescriptor question = createQuestion(scenario.getId(), "question", null);

        Result r = wegasFactory.createResult("result");

        r.setImpact(new Script("Variable.find(gameModel, \"mynumber\").setValue(self, 10);"));

        ChoiceDescriptor choice = createChoice(question, "choice", null, "result",r);

        questionDescriptorFacade.selectAndValidateChoice(choice.getId(), player.getId());            // Do reply
        assertEquals(10.0, ((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0.1);

        variableDescriptorFacade.duplicate(question.getId());                                        // Test duplication on question
        variableDescriptorFacade.duplicate(choice.getId());

        variableDescriptorFacade.remove(question.getId());                                           // Clean up
    }

    private void assertQuestion(Long questionId, Player p, boolean hasBeenReplied) {
        QuestionDescriptor question = (QuestionDescriptor) variableDescriptorFacade.find(questionId);
        Assert.assertEquals(hasBeenReplied, question.isReplied(p));
        Assert.assertEquals(!hasBeenReplied, question.isNotReplied(p));

    }

    private void assertChoice(Long choiceId, Player p, boolean hasBeenSelected, boolean hasBeenIgnored) {
        ChoiceDescriptor choice = (ChoiceDescriptor) variableDescriptorFacade.find(choiceId);
        Assert.assertEquals(hasBeenSelected, choice.hasBeenSelected(p));
        Assert.assertEquals(!hasBeenSelected, choice.hasNotBeenSelected(p));
        Assert.assertEquals(hasBeenIgnored, choice.hasBeenIgnored(p));

    }

    private void assertChoiceIsPreselected(Long choiceId, Player p, boolean preselected) {
        ChoiceDescriptor choice = (ChoiceDescriptor) variableDescriptorFacade.find(choiceId);
        ChoiceInstance ci = (ChoiceInstance) variableDescriptorFacade.getInstance(choice, p);

        Assert.assertEquals(!preselected, ci.getReplies().isEmpty());
        boolean ok = false;

        for (Reply r : ci.getReplies()) {
            if (!r.getIgnored()) {
                ok = true;
                break;
            }
        }
        Assert.assertEquals(preselected, ok);
    }

    public void testQuestion_choiceMaxLimit() throws Exception {
        final NumberDescriptor myNumber = new NumberDescriptor();
        myNumber.setName("x");
        myNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), myNumber);

        // total number of replies is unlimited
        QuestionDescriptor question = createQuestion(scenario.getId(), "question",
                null);

        Result r1 = wegasFactory.createResult("result");
        r1.setImpact(new Script("Variable.find(gameModel, \"x\").add(self, 1);"));
        // but each choice is only selectable once
        ChoiceDescriptor choice1 = createChoice(question, "choice1", 1, "result",r1);

        Result r2 = wegasFactory.createResult("result");
        r2.setImpact(new Script("Variable.find(gameModel, \"x\").add(self, 1);"));
        ChoiceDescriptor choice2 = createChoice(question, "choice2", 1, "result", r2);

        assertQuestion(question.getId(), player, false);
        assertChoice(choice1.getId(), player, false, false);
        assertChoice(choice2.getId(), player, false, false);

        // select&validate the first choice
        questionDescriptorFacade.selectAndValidateChoice(choice1.getId(), player.getId());
        assertEquals(1, ((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0.1);

        assertQuestion(question.getId(), player, false);
        assertChoice(choice1.getId(), player, true, false);
        assertChoice(choice2.getId(), player, false, false);

        // select&validate the second choice
        questionDescriptorFacade.selectAndValidateChoice(choice2.getId(), player.getId());
        assertEquals(2, ((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0.1);

        assertQuestion(question.getId(), player, false);
        assertChoice(choice1.getId(), player, true, false);
        assertChoice(choice2.getId(), player, true, false);

        // select&validate the first choice
        try {
            questionDescriptorFacade.selectAndValidateChoice(choice1.getId(), player.getId());
            Assert.fail("Overpassing the limit");
        } catch (WegasErrorMessage ex) {
            // expected exception
        }

        // select&validate the second choice
        try {
            questionDescriptorFacade.selectAndValidateChoice(choice2.getId(), player.getId());
            Assert.fail("Overpassing the limit");
        } catch (WegasErrorMessage ex) {
            // expected exception
        }
    }

    public void testQuestion_questionMaxLimit() throws Exception {
        final NumberDescriptor myNumber = new NumberDescriptor();
        myNumber.setName("x");
        myNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), myNumber);

        // total number of replies is limited to two
        QuestionDescriptor question = createQuestion(scenario.getId(), "question", 2);

        // but choices are unlimited

        Result r1 = wegasFactory.createResult("result");
        r1.setImpact(new Script("Variable.find(gameModel, \"x\").add(self, 1);"));
        ChoiceDescriptor choice1 = createChoice(question, "choice1", null, "result",r1);

        Result r2 = wegasFactory.createResult("result");
        r1.setImpact(new Script("Variable.find(gameModel, \"x\").add(self, 1);"));
        ChoiceDescriptor choice2 = createChoice(question, "choice2", null, "result", r2);

        assertQuestion(question.getId(), player, false);
        assertChoice(choice1.getId(), player, false, false);
        assertChoice(choice2.getId(), player, false, false);

        // select&validate the first choice
        questionDescriptorFacade.selectAndValidateChoice(choice1.getId(), player.getId());
        assertEquals(1, ((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0.1);

        assertQuestion(question.getId(), player, true);
        assertChoice(choice1.getId(), player, true, false);
        assertChoice(choice2.getId(), player, false, false);

        // select&validate the first choice again
        questionDescriptorFacade.selectAndValidateChoice(choice1.getId(), player.getId());
        assertEquals(2, ((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0.1);

        assertQuestion(question.getId(), player, true);
        assertChoice(choice1.getId(), player, true, false);
        assertChoice(choice2.getId(), player, false, true);

        // select&validate the first choice
        try {
            questionDescriptorFacade.selectAndValidateChoice(choice1.getId(), player.getId());
            Assert.fail("Overpassing the limit");
        } catch (WegasErrorMessage ex) {
            // expected exception
        }

        // select&validate the second choice
        try {
            questionDescriptorFacade.selectAndValidateChoice(choice2.getId(), player.getId());
            Assert.fail("Overpassing the limit");
        } catch (WegasErrorMessage ex) {
            // expected exception
        }
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
        variableDescriptorFacade.create(scenario.getId(), myNumber1);

        final NumberDescriptor myNumber2 = new NumberDescriptor();              // Create a 2nd number descriptor for ignoration impact
        myNumber2.setName("mynumber2");
        myNumber2.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), myNumber2);

        QuestionDescriptor question = createCbxQuestion(scenario.getId(), "cbxQuestion", null, null);

        Result r1 = wegasFactory.createResult("result1");
        r1.setImpact(new Script("Variable.find(gameModel, \"mynumber1\").setValue(self, 10);"));
        ChoiceDescriptor choice1 = createChoice(question, "testChoice1", null, "result1", r1);

        Result r2 = wegasFactory.createResult("result1");
        r2.setIgnorationImpact(new Script("Variable.find(gameModel, \"mynumber2\").setValue(self, 50);"));
        createChoice(question, "testChoice2", null, "result1", r2);

        login(user);
        questionDescriptorFacade.selectChoice(choice1.getId(), player.getId());

        QuestionInstance qi = question.getInstance(player);
        questionDescriptorFacade.validateQuestion(qi.getId(), player.getId());
        assertEquals(10.0, ((NumberInstance) variableInstanceFacade.find(myNumber1.getId(), player.getId())).getValue(), 0.1);
        assertEquals(50.0, ((NumberInstance) variableInstanceFacade.find(myNumber2.getId(), player.getId())).getValue(), 0.1);

        qi = (QuestionInstance) variableInstanceFacade.find(qi.getId());
        assertEquals(2, qi.getReplies().size());

        login(trainer);
        variableDescriptorFacade.duplicate(question.getId());

        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testRadioChoice() throws Exception {
        QuestionDescriptor question = createCbxQuestion(scenario.getId(), "question", 1, 1);

        ChoiceDescriptor choice1 = createChoice(question, "choice1", null, "result", wegasFactory.createResult("result"));
        ChoiceDescriptor choice2 = createChoice(question, "choice2", null, "result", wegasFactory.createResult("result", TranslatableContent.build("en", "label")));
        ChoiceDescriptor choice3 = createChoice(question, "choice3", null, "result", wegasFactory.createResult("result"));

        login(user);

        QuestionInstance qi = (QuestionInstance) variableDescriptorFacade.getInstance(question, player);

        assertQuestion(question.getId(), player, false);
        assertChoice(choice1.getId(), player, false, false);
        assertChoice(choice2.getId(), player, false, false);
        assertChoice(choice3.getId(), player, false, false);

        try {
            questionDescriptorFacade.validateQuestion(qi.getId(), player.getId());
            Assert.fail("question validated altough minimum not reached");
        } catch (WegasErrorMessage ex) {
            //expecting error
        }

        questionDescriptorFacade.selectChoice(choice1.getId(), player.getId());

        assertChoiceIsPreselected(choice1.getId(), player, true);
        assertChoiceIsPreselected(choice2.getId(), player, false);
        assertChoiceIsPreselected(choice3.getId(), player, false);

        questionDescriptorFacade.selectChoice(choice2.getId(), player.getId());

        assertChoiceIsPreselected(choice1.getId(), player, false);
        assertChoiceIsPreselected(choice2.getId(), player, true);
        assertChoiceIsPreselected(choice3.getId(), player, false);

        questionDescriptorFacade.selectChoice(choice3.getId(), player.getId());

        assertChoiceIsPreselected(choice1.getId(), player, false);
        assertChoiceIsPreselected(choice2.getId(), player, false);
        assertChoiceIsPreselected(choice3.getId(), player, true);

        questionDescriptorFacade.validateQuestion(qi.getId(), player.getId());

        assertQuestion(question.getId(), player, true);
        assertChoice(choice1.getId(), player, false, true);
        assertChoice(choice2.getId(), player, false, true);
        assertChoice(choice3.getId(), player, true, false);
    }

    @Test
    public void testSelectAndValidateCBXLimit() throws Exception {
        QuestionDescriptor question = createCbxQuestion(scenario.getId(), "question", 2, 3);

        ChoiceDescriptor choice1 = createChoice(question, "choice1", null, "result", wegasFactory.createResult("result"));
        ChoiceDescriptor choice2 = createChoice(question, "choice2", null, "result", wegasFactory.createResult("result", TranslatableContent.build("en", "label")));
        ChoiceDescriptor choice3 = createChoice(question, "choice3", null, "result", wegasFactory.createResult("result"));
        ChoiceDescriptor choice4 = createChoice(question, "choice4", null, "result", wegasFactory.createResult("result"));

        login(user);

        QuestionInstance qi = (QuestionInstance) variableDescriptorFacade.getInstance(question, player);

        assertQuestion(question.getId(), player, false);
        assertChoice(choice1.getId(), player, false, false);
        assertChoice(choice2.getId(), player, false, false);
        assertChoice(choice3.getId(), player, false, false);
        assertChoice(choice4.getId(), player, false, false);

        try {
            questionDescriptorFacade.validateQuestion(qi.getId(), player.getId());
            Assert.fail("question validated altough minimum not reached");
        } catch (WegasErrorMessage ex) {
            //expecting error
        }

        questionDescriptorFacade.selectChoice(choice1.getId(), player.getId());
        questionDescriptorFacade.selectChoice(choice2.getId(), player.getId());
        questionDescriptorFacade.selectChoice(choice3.getId(), player.getId());

        assertQuestion(question.getId(), player, false);
        assertChoice(choice1.getId(), player, false, false);
        assertChoice(choice2.getId(), player, false, false); // not selected until the whole question is validated
        assertChoice(choice3.getId(), player, false, false);
        assertChoice(choice4.getId(), player, false, false);

        try {
            questionDescriptorFacade.selectChoice(choice4.getId(), player.getId());
            Assert.fail("select choice maximum exedeed but not execption thrown");
        } catch (WegasErrorMessage ex) {
            //expecting error
        }

        questionDescriptorFacade.validateQuestion(qi.getId(), player.getId());

        assertQuestion(question.getId(), player, true);
        assertChoice(choice1.getId(), player, true, false);
        assertChoice(choice2.getId(), player, true, false);
        assertChoice(choice3.getId(), player, true, false);
        assertChoice(choice4.getId(), player, false, true);
    }

    @Test
    public void testSelectAndCancel() throws NamingException {
        final NumberDescriptor myNumber = new NumberDescriptor();              // Create a number descriptor
        myNumber.setName("mynumber");
        myNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), myNumber);

        QuestionDescriptor question = createQuestion(scenario.getId(), "question", null);

        Result r =wegasFactory.createResult("result");
        r.setImpact(new Script("Variable.find(gameModel, \"mynumber\").setValue(self, 10);"));
        ChoiceDescriptor choice = createChoice(question, "testChoice", null, "result", r);

        this.wipeEmCache();

        final Reply reply = questionDescriptorFacade.selectChoice(choice.getId(), player.getId());
        assertEquals(((NumberInstance) variableInstanceFacade.find(myNumber.getId(), player.getId())).getValue(), 0, 0.0); // Nothing happened
        assertEquals(((QuestionInstance) variableInstanceFacade.find(question.getId(), player.getId())).getReplies().size(), 1);
        final Reply reply1 = questionDescriptorFacade.cancelReply(player.getId(), reply.getId());
        assertEquals(0, reply1.getChoiceInstance().getReplies().size());
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
        Result r = wegasFactory.createResult("result");
        choice.addResult(r);

        choice.changeCurrentResult(choice.getDefaultInstance(), r);

        variableDescriptorFacade.create(scenario.getId(), question);

        gameModelFacade.reset(scenario.getId());
        scenario = gameModelFacade.find(scenario.getId());

        //variableDescriptorFacade.remove(choice.getId());
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testCurrentResult() throws Exception {
        // Create a question descriptor
        QuestionDescriptor question = this.createQuestion(scenario.getId(), "question", null);

        // Add a choice descriptor w/ 2 results
        ChoiceDescriptor choice = this.createChoice(question, "choice", null, "result",
                wegasFactory.createResult("result"),
                wegasFactory.createResult("result_2"));

        // And the default reply is the second
        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        choice.getResultByName("result");
        Result r2 = choice.getResultByName("result_2");

        // Set the default reply to the second one
        //((ChoiceInstance) choice.getDefaultInstance()).setCurrentResult(null);
        choice.changeCurrentResult(choice.getDefaultInstance(), r2);

        choice = (ChoiceDescriptor) variableDescriptorFacade.update(choice.getId(), choice);

        // Restart to propagate default instance value change
        gameModelFacade.reset(scenario.getId());

        // Retrieve entity
        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        // And check the current result is stored
        assertEquals("result_2", choice.getInstance(player).getResult().getName());

        ChoiceDescriptor duplicate = (ChoiceDescriptor) variableDescriptorFacade.duplicate(choice.getId());
        duplicate = (ChoiceDescriptor) variableDescriptorFacade.find(duplicate.getId());

        duplicate.getDefaultInstance().getResult().getName();
        // Restart to propagate default instance value change
        gameModelFacade.reset(scenario.getId());
        // Retrieve entity
        //duplicate = (ChoiceDescriptor) variableDescriptorFacade.find(duplicate.getId());
        // And check the current result is stored
        assertEquals("result_2", duplicate.getInstance(player).getResult().getName());

        // Clean up
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testRemoveResponse() throws NamingException {
        QuestionDescriptor question = this.createQuestion(scenario.getId(), "question", null);

        ChoiceDescriptor choice = this.createChoice(question, "choice", null, "result",
                wegasFactory.createResult("result"),
                wegasFactory.createResult("result_2"));

        choice.getResults().remove(0);
        variableDescriptorFacade.update(choice.getId(), choice);

        assertEquals("result_2", ((ChoiceDescriptor) variableDescriptorFacade.find(choice.getId())).getResults().get(0).getName());
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testRemoveCurrentResult() throws NamingException, WegasNoResultException {
        QuestionDescriptor question = this.createQuestion(scenario.getId(), "question", null);

        ChoiceDescriptor choice = this.createChoice(question, "choice", null, "result1",
                wegasFactory.createResult("result1"),
                wegasFactory.createResult("result2"),
                wegasFactory.createResult("result3"));

        Result r2 = choice.getResultByName("result2");

        // Set the second as default
        choice.changeCurrentResult(choice.getDefaultInstance(), r2);
        choice = (ChoiceDescriptor) variableDescriptorFacade.update(choice.getId(), choice);

        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());

        // and remove it
        choice.getResults().remove(1);
        variableDescriptorFacade.update(choice.getId(), choice);

        assertEquals("result1", ((ChoiceDescriptor) variableDescriptorFacade.find(choice.getId())).getResults().get(0).getName());
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testChangeResultAndScope() throws NamingException, WegasNoResultException {
        this.createSecondTeam();

        QuestionDescriptor question = this.createQuestion(scenario.getId(), "question", null);

        // Add a choice descriptor and 3 results
        ChoiceDescriptor choice = this.createChoice(question, "choice", null, "result_1",
                wegasFactory.createResult("result_1"),
                wegasFactory.createResult("result_2"),
                wegasFactory.createResult("result_3"));

        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        ChoiceInstance instance20 = choice.getInstance(player21);
        ChoiceInstance instance21 = choice.getInstance(player22);

        assertEquals("TeamScoped instance is no the same !", instance20, instance21);
        assertEquals("Current result does not match", "result_1", instance20.getCurrentResult().getName());

        // Set the second result as default
        // Change from teamScope to playerscope
        choice.changeCurrentResult(choice.getDefaultInstance(), choice.getResultByName("result_2"));
        choice.setScope(new PlayerScope());
        choice = (ChoiceDescriptor) variableDescriptorFacade.update(choice.getId(), choice);

        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        instance20 = choice.getInstance(player21);
        instance21 = choice.getInstance(player22);

        assertFalse("PlayerScoped instances are the same !", instance20.equals(instance21));

        assertEquals("Current result does not match", "result_2", instance20.getCurrentResult().getName());
        assertEquals("Current result does not match", "result_2", instance21.getCurrentResult().getName());

        // and remove it
        choice.getResults().remove(1);
        variableDescriptorFacade.update(choice.getId(), choice);

        assertEquals("result_1", ((ChoiceDescriptor) variableDescriptorFacade.find(choice.getId())).getResults().get(0).getName());
        variableDescriptorFacade.remove(question.getId());
    }

    @Test
    public void testMoveChoice() {
        ListDescriptor list = new ListDescriptor("list");
        list.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.create(scenario.getId(), list);

        QuestionDescriptor question = this.createQuestion(scenario.getId(), "question", null);

        // Add a choice descriptor and 3 results
        ChoiceDescriptor choice = this.createChoice(question, "choice", null, "result_1",
                wegasFactory.createResult("result_1"));

        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        Assert.assertEquals(question, (QuestionDescriptor) choice.getParent());
        Assert.assertEquals("QuestionDescriptor", choice.getParentType());
        Assert.assertEquals(2, gameModelFacade.find(scenario.getId()).getItems().size());
        Assert.assertEquals(1, ((DescriptorListI)variableDescriptorFacade.find(question.getId())).getItems().size());
        Assert.assertEquals(0, ((DescriptorListI)variableDescriptorFacade.find(list.getId())).getItems().size());

        // move choice from question to root
        variableDescriptorFacade.move(choice.getId(), 0);
        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        Assert.assertEquals(scenario, (GameModel) choice.getParent());
        Assert.assertEquals("GameModel", choice.getParentType());
        Assert.assertEquals(3, gameModelFacade.find(scenario.getId()).getItems().size());
        Assert.assertEquals(0, ((DescriptorListI)variableDescriptorFacade.find(question.getId())).getItems().size());
        Assert.assertEquals(0, ((DescriptorListI)variableDescriptorFacade.find(list.getId())).getItems().size());

        // move choice from root to list
        variableDescriptorFacade.move(choice.getId(), list.getId(), 0);

        choice = (ChoiceDescriptor) variableDescriptorFacade.find(choice.getId());
        Assert.assertEquals(list, (ListDescriptor) choice.getParent());
        Assert.assertEquals("ListDescriptor", choice.getParentType());
        Assert.assertEquals(2, gameModelFacade.find(scenario.getId()).getItems().size());
        Assert.assertEquals(0, ((DescriptorListI)variableDescriptorFacade.find(question.getId())).getItems().size());
        Assert.assertEquals(1, ((DescriptorListI)variableDescriptorFacade.find(list.getId())).getItems().size());

    }
}
