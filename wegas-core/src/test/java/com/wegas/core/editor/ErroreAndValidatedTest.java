
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
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
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

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
        Assertions.assertFalse(isLabelVisible.eval(srResult.getLabel(), srResult));
        Assertions.assertTrue(isLabelVisible.eval(r1.getLabel(), r1));

        Assertions.assertFalse(isCbx.eval(question.getMinReplies(), question));
        Assertions.assertFalse(isCbx.eval(question.getTabular(), question));
        Assertions.assertTrue(notCbx.eval(choice.getMaxReplies(), choice));
        Assertions.assertTrue(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assertions.assertFalse(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assertions.assertFalse(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setMaxReplies(1);

        Assertions.assertFalse(isCbx.eval(question.getMinReplies(), question));
        Assertions.assertFalse(isCbx.eval(question.getTabular(), question));
        Assertions.assertFalse(notCbx.eval(choice.getMaxReplies(), choice));
        Assertions.assertFalse(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assertions.assertFalse(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assertions.assertFalse(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setMaxReplies(4);

        Assertions.assertFalse(isCbx.eval(question.getMinReplies(), question));
        Assertions.assertFalse(isCbx.eval(question.getTabular(), question));
        Assertions.assertTrue(notCbx.eval(choice.getMaxReplies(), choice));
        Assertions.assertTrue(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assertions.assertFalse(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assertions.assertFalse(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setCbx(Boolean.TRUE);
        question.setMaxReplies(1);
        Assertions.assertTrue(isCbx.eval(question.getMinReplies(), question));
        Assertions.assertTrue(isCbx.eval(question.getTabular(), question));
        Assertions.assertFalse(notCbx.eval(choice.getMaxReplies(), choice));
        Assertions.assertFalse(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assertions.assertTrue(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assertions.assertTrue(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));

        question.setMaxReplies(null);
        Assertions.assertTrue(isCbx.eval(question.getMinReplies(), question));
        Assertions.assertTrue(isCbx.eval(question.getTabular(), question));
        Assertions.assertFalse(notCbx.eval(choice.getMaxReplies(), choice));
        Assertions.assertFalse(notCbx.eval(srChoice.getMaxReplies(), choice));
        Assertions.assertTrue(isQuestionCbx.eval(srResult.getIgnorationAnswer(), srResult));
        Assertions.assertTrue(isQuestionCbx.eval(srResult.getIgnorationImpact(), srResult));


        /*
         * Errored
         */
        question.setMinReplies(null);
        question.setMaxReplies(null);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive!");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound is not positive!");

        // Create default question with a valid minReplies
        question.setMinReplies(1);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive!");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound is not positive!");

        // test with negtive min
        question.setMinReplies(0);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertTrue(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive!");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound is not positive!");

        // test with negtive min
        question.setMinReplies(-10);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertTrue(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound > 0 fail");

        // test with no min but max = 0
        question.setMinReplies(null);
        question.setMaxReplies(0);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive fail");
        Assertions.assertTrue(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound > 0 fail");

        // test with no min but max = 1
        question.setMaxReplies(1);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound > 0 fail");

        // test with no min but max = 10
        question.setMaxReplies(10);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound > 0 fail");

        // test with min & max
        question.setMinReplies(1);
        question.setMaxReplies(3);
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound > 0 fail");

        // test with erroneous min & max
        question.setMinReplies(10);
        question.setMaxReplies(3);
        Assertions.assertTrue(checkMinMaxBounds.eval(question.getMinReplies(), question), "MinMax on min should not fail");
        Assertions.assertTrue(checkMinMaxBounds.eval(question.getMaxReplies(), question), "MinMax on max should not fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMinReplies(), question), "Min bound is not positive fail");
        Assertions.assertFalse(checkMinPositiveness.eval(question.getMaxReplies(), question), "Max bound > 0 fail");
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

        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertFalse(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertFalse(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");

        number.setMinValue(-10.0);
        number.setMaxValue(10.0);
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertFalse(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertFalse(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");

        number.setMinValue(-10.0);
        number.setMaxValue(-20.0);
        Assertions.assertTrue(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertTrue(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertFalse(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertTrue(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertTrue(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");

        number.setMinValue(1.0);
        number.setMaxValue(10.0);
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertTrue(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertTrue(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertFalse(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");

        number.setMinValue(-10.0);
        number.setDefaultInstance(new NumberInstance(-20.0));
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertTrue(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertFalse(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");

        instance = new NumberInstance(-20.0);
        instance.setTeamScope((TeamScope) number.getScope());
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertTrue(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertTrue(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertFalse(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");

        number.setDefaultInstance(new NumberInstance(20.0));
        instance = new NumberInstance(0.0);
        instance.setTeamScope((TeamScope) number.getScope());
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertFalse(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertTrue(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertFalse(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");

        instance = new NumberInstance(20.0);
        instance.setTeamScope((TeamScope) number.getScope());
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMinValue(), number), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(number.getMaxValue(), number), "MinMax on max should not fail");
        Assertions.assertFalse(lessThanMin.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertTrue(greaterThanMax.eval(number.getDefaultInstance().getValue(), number.getDefaultInstance()), "MinMax on default value fail");
        Assertions.assertFalse(lessThanMin.eval(instance.getValue(), instance), "MinMax on player instance fail");
        Assertions.assertTrue(greaterThanMax.eval(instance.getValue(), instance), "MinMax on player instance fail");
    }

    @Test
    public void testGrade() {
        Condition checkMinMaxBounds = new NumberDescBoundsConstraint();

        // Create default number
        GradeDescriptor grade = new GradeDescriptor();

        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMinValue(), grade), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMaxValue(), grade), "MinMax on max should not fail");

        grade.setMinValue(-10l);
        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMinValue(), grade), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMaxValue(), grade), "MinMax on max should not fail");

        grade.setMinValue(null);
        grade.setMaxValue(10l);
        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMinValue(), grade), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMaxValue(), grade), "MinMax on max should not fail");

        grade.setMinValue(-10l);
        grade.setMaxValue(10l);
        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMinValue(), grade), "MinMax on min should not fail");
        Assertions.assertFalse(checkMinMaxBounds.eval(grade.getMaxValue(), grade), "MinMax on max should not fail");

        grade.setMinValue(-10l);
        grade.setMaxValue(-20l);
        Assertions.assertTrue(checkMinMaxBounds.eval(grade.getMinValue(), grade), "MinMax on min should not fail");
        Assertions.assertTrue(checkMinMaxBounds.eval(grade.getMaxValue(), grade), "MinMax on max should not fail");
    }
}
