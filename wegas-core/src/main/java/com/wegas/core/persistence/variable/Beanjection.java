
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.resourceManagement.ejb.IterationFacade;
import com.wegas.resourceManagement.ejb.ResourceFacade;
import com.wegas.reviewing.ejb.ReviewingFacade;
import java.io.Serializable;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;

/**
 * Some bean container
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class Beanjection implements Serializable {

    private static final long serialVersionUID = 8656248029961666978L;

    @Inject
    private VariableInstanceFacade variableInstanceFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    @Inject
    private ResourceFacade resourceFacade;

    @Inject
    private IterationFacade iterationFacade;

    @Inject
    private ReviewingFacade reviewingFacade;

    @Inject
    private UserFacade userFacade;

    @Inject
    private AccountFacade accountFacade;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private QuestionDescriptorFacade questionDescriptorFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private RequestManager requestManager;

//    public Beanjection() {
//        // ensure to have an empty constructor
//    }

//    public Beanjection(VariableInstanceFacade variableInstanceFacade) {
//        this.variableInstanceFacade = variableInstanceFacade;
//    }
//
//    public Beanjection(RequestManager requestManager,
//        VariableInstanceFacade variableInstanceFacade,
//        VariableDescriptorFacade variableDescriptorFacade,
//        ResourceFacade resourceFacade,
//        IterationFacade iterationFacade,
//        ReviewingFacade reviewingFacade,
//        UserFacade userFacade,
//        AccountFacade accountFacade,
//        TeamFacade teamFacade,
//        QuestionDescriptorFacade questionDescriptorFacade,
//        StateMachineFacade stateMachineFacade,
//        GameFacade gameFacade) {
//        this.requestManager = requestManager;
//        this.variableInstanceFacade = variableInstanceFacade;
//        this.variableDescriptorFacade = variableDescriptorFacade;
//        this.resourceFacade = resourceFacade;
//        this.iterationFacade = iterationFacade;
//        this.reviewingFacade = reviewingFacade;
//        this.userFacade = userFacade;
//        this.accountFacade = accountFacade;
//        this.teamFacade = teamFacade;
//        this.questionDescriptorFacade = questionDescriptorFacade;
//        this.stateMachineFacade = stateMachineFacade;
//        this.gameFacade = gameFacade;
//    }

    public RequestManager getRequestManager() {
        return requestManager;
    }

    public VariableInstanceFacade getVariableInstanceFacade() {
        return variableInstanceFacade;
    }

    public ReviewingFacade getReviewingFacade() {
        return reviewingFacade;
    }

    public VariableDescriptorFacade getVariableDescriptorFacade() {
        return variableDescriptorFacade;
    }

    public IterationFacade getIterationFacade() {
        return iterationFacade;
    }

    public UserFacade getUserFacade() {
        return userFacade;
    }

    public TeamFacade getTeamFacade() {
        return teamFacade;
    }

    public QuestionDescriptorFacade getQuestionDescriptorFacade() {
        return questionDescriptorFacade;
    }

    public ResourceFacade getResourceFacade() {
        return resourceFacade;
    }

    public AccountFacade getAccountFacade() {
        return accountFacade;
    }

    public GameFacade getGameFacade() {
        return gameFacade;
    }

    public GameModelFacade getGameModelFacade(){
        return gameModelFacade;
    }

    public StateMachineFacade getStateMachineFacade() {
        return stateMachineFacade;
    }

}
