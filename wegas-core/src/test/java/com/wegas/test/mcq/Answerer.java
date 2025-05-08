/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.test.mcq;

import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;

/**
 * TODO refactor/remove/moveToTest as this is only used by one test
 *
 * @author maxence
 */
@Stateless
@LocalBean
public class Answerer {

    @Inject
    private QuestionDescriptorFacade questionDescriptorFacade;

    public void selectAndValidateChoice(Long choiceId, Long playerId) {
        questionDescriptorFacade.selectAndValidateChoiceTx(choiceId, playerId);
    }
}
