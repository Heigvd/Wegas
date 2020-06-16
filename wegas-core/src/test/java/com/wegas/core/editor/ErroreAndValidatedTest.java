/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.editor;

import com.wegas.core.persistence.annotations.WegasConditions.Condition;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor.NumberDescBoundsConstraint;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceDescriptor.IsNotQuestionCbxOrMaxEqOne;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor.CheckMinMaxBounds;
import com.wegas.mcq.persistence.QuestionDescriptor.CheckPositiveness;
import com.wegas.mcq.persistence.QuestionDescriptor.IsCbx;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Result;
import com.wegas.mcq.persistence.Result.IsQuestionCbx;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.reviewing.persistence.evaluation.GradeDescriptor;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class ErroreAndValidatedTest {

    @Test
    public void testQuestion() {
        CheckMinMaxBounds checkMinMaxBounds = new CheckMinMaxBounds();
        CheckPositiveness checkMinPositiveness = new CheckPositiveness();

        Condition isCbx = new IsCbx();
        Condition notCbx = new IsNotQuestionCbxOrMaxEqOne();
        Condition isQuestionCbx = new IsQuestionCbx();
        Condition isLabelVisible = new Result.HasMultipleResult();

        // Create default question
        QuestionDescriptor question = new QuestionDescriptor();
        question.setDefaultInstance(new QuestionInstance());

        ChoiceDescriptor srChoice = new SingleResultChoiceDescriptor();
        Result srResult = new Result();
        srChoice.addResult(srResult);

        ChoiceDescriptor choice = new ChoiceDescriptor();
        Result r1 = new Result();
        Result r2 = new Result();
        choice.addResult(r1);
        choice.addResult(r2);

        question.addItem(choice);
        question.addItem(srChoice);

        /*
         * Visible

         */
        Assert.assertFalse(isLabelVisible.eval(srResult.getLabel(), srResult));
        Assert.assertTrue(isLabelVisible.eval(r1.getLabel(), r1));

        Assert.assertFalse(isCbx.eval(question.getMinReplies(), question));
        Assert.assertFalse(isCbx.eval(question.getTabular(), question));
        Assert.assertTrue(notCbx.eval(choice.getMaxReplies(), choice));
        Assert.assertTrue(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assert.assertFalse(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assert.assertFalse(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setMaxReplies(1);

        Assert.assertFalse(isCbx.eval(question.getMinReplies(), question));
        Assert.assertFalse(isCbx.eval(question.getTabular(), question));
        Assert.assertFalse(notCbx.eval(choice.getMaxReplies(), choice));
        Assert.assertFalse(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assert.assertFalse(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assert.assertFalse(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setMaxReplies(4);

        Assert.assertFalse(isCbx.eval(question.getMinReplies(), question));
        Assert.assertFalse(isCbx.eval(question.getTabular(), question));
        Assert.assertTrue(notCbx.eval(choice.getMaxReplies(), choice));
        Assert.assertTrue(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assert.assertFalse(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assert.assertFalse(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setCbx(Boolean.TRUE);
        question.setMaxReplies(1);
        Assert.assertTrue(isCbx.eval(question.getMinReplies(), question));
        Assert.assertTrue(isCbx.eval(question.getTabular(), question));
        Assert.assertFalse(notCbx.eval(choice.getMaxReplies(), choice));
        Assert.assertFalse(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assert.assertTrue(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assert.assertTrue(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setMaxReplies(null);
        Assert.assertTrue(isCbx.eval(question.getMinReplies(), question));
        Assert.assertTrue(isCbx.eval(question.getTabular(), question));
        Assert.assertFalse(notCbx.eval(choice.getMaxReplies(), choice));
        Assert.assertFalse(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assert.assertTrue(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assert.assertTrue(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));


        /*
         * Errored
         */
        question.setMinReplies(null);
        question.setMaxReplies(null);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertFalse("Min bound is not positive!",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound is not positive!",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // Create default question with a valid minReplies
        question.setMinReplies(1);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertFalse("Min bound is not positive!",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound is not positive!",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // test with negtive min
        question.setMinReplies(0);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertTrue("Min bound is not positive!",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound is not positive!",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // test with negtive min
        question.setMinReplies(-10);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertTrue("Min bound is not positive fail",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound > 0 fail",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // test with no min but max = 0
        question.setMinReplies(null);
        question.setMaxReplies(0);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertFalse("Min bound is not positive fail",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertTrue("Max bound > 0 fail",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // test with no min but max = 1
        question.setMaxReplies(1);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertFalse("Min bound is not positive fail",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound > 0 fail",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // test with no min but max = 10
        question.setMaxReplies(10);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertFalse("Min bound is not positive fail",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound > 0 fail",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // test with min & max
        question.setMinReplies(1);
        question.setMaxReplies(3);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertFalse("Min bound is not positive fail",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound > 0 fail",
                checkMinPositiveness.eval(question.getMaxReplies(), question));

        // test with erroneous min & max
        question.setMinReplies(10);
        question.setMaxReplies(3);
        Assert.assertTrue("MinMax on min should not fail",
                checkMinMaxBounds.eval(question.getMinReplies(), question));
        Assert.assertTrue("MinMax on max should not fail",
                checkMinMaxBounds.eval(question.getMaxReplies(), question));
        Assert.assertFalse("Min bound is not positive fail",
                checkMinPositiveness.eval(question.getMinReplies(), question));
        Assert.assertFalse("Max bound > 0 fail",
                checkMinPositiveness.eval(question.getMaxReplies(), question));
    }

    @Test
    public void testNumber() {
        Condition checkMinMaxBounds = new NumberDescBoundsConstraint();
        Condition lessThanMin = new NumberInstance.ValueLessThanMin();
        Condition greaterThanMax = new NumberInstance.ValueGreaterThanMax();

        // Create default number
        NumberDescriptor number = new NumberDescriptor();
        number.setScope(new TeamScope());
        number.setDefaultInstance(new NumberInstance());
        number.getDefaultInstance().setValue(0);

        NumberInstance instance = new NumberInstance(0.0);
        instance.setTeamScope((TeamScope) number.getScope());

        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertFalse("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertFalse("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));

        number.setMinValue(-10.0);
        number.setMaxValue(10.0);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertFalse("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertFalse("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));

        number.setMinValue(-10.0);
        number.setMaxValue(-20.0);
        Assert.assertTrue("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertTrue("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertFalse("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertTrue("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertTrue("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));

        number.setMinValue(1.0);
        number.setMaxValue(10.0);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertTrue("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertTrue("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertFalse("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));

        number.setMinValue(-10.0);
        number.setDefaultInstance(new NumberInstance(-20.0));
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertTrue("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertFalse("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));

        instance = new NumberInstance(-20.0);
        instance.setTeamScope((TeamScope) number.getScope());
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertTrue("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertTrue("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertFalse("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));

        number.setDefaultInstance(new NumberInstance(20.0));
        instance = new NumberInstance(0.0);
        instance.setTeamScope((TeamScope) number.getScope());
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertFalse("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertTrue("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertFalse("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));

        instance = new NumberInstance(20.0);
        instance.setTeamScope((TeamScope) number.getScope());
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(number.getMinValue(), number));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(number.getMaxValue(), number));
        Assert.assertFalse("MinMax on default value fail",
                lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertTrue("MinMax on default value fail",
                greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()));
        Assert.assertFalse("MinMax on player instance fail",
                lessThanMin.eval(instance.getValue(), instance));
        Assert.assertTrue("MinMax on player instance fail",
                greaterThanMax.eval(instance.getValue(), instance));
    }

    @Test
    public void testGrade() {
        Condition checkMinMaxBounds = new NumberDescBoundsConstraint();

        // Create default number
        GradeDescriptor grade = new GradeDescriptor();

        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(grade.getMinValue(), grade));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(grade.getMaxValue(), grade));

        grade.setMinValue(-10l);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(grade.getMinValue(), grade));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(grade.getMaxValue(), grade));

        grade.setMinValue(null);
        grade.setMaxValue(10l);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(grade.getMinValue(), grade));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(grade.getMaxValue(), grade));

        grade.setMinValue(-10l);
        grade.setMaxValue(10l);
        Assert.assertFalse("MinMax on min should not fail",
                checkMinMaxBounds.eval(grade.getMinValue(), grade));
        Assert.assertFalse("MinMax on max should not fail",
                checkMinMaxBounds.eval(grade.getMaxValue(), grade));

        grade.setMinValue(-10l);
        grade.setMaxValue(-20l);
        Assert.assertTrue("MinMax on min should not fail",
                checkMinMaxBounds.eval(grade.getMinValue(), grade));
        Assert.assertTrue("MinMax on max should not fail",
                checkMinMaxBounds.eval(grade.getMaxValue(), grade));
    }
}
