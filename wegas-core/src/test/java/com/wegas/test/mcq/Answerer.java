/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.test.mcq;

import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;

/**
 *
 * @author maxence
 */

@Stateless
@LocalBean
public class Answerer {

    @EJB
    private QuestionDescriptorFacade questionDescriptorFacade;

    public void selectAndValidateChoice(Long choiceId, Long playerId){
        questionDescriptorFacade.TX_selectAndValidateChoice(choiceId, playerId);
    }
}
