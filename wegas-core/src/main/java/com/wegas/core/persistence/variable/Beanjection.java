
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.ejb.GameFacade;
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

/**
 * Some bean container
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class Beanjection implements Serializable {

    private static final long serialVersionUID = 8656248029961666978L;

    private VariableInstanceFacade variableInstanceFacade;

    private VariableDescriptorFacade variableDescriptorFacade;

    private ResourceFacade resourceFacade;

    private IterationFacade iterationFacade;

    private ReviewingFacade reviewingFacade;

    private UserFacade userFacade;

    private AccountFacade accountFacade;

    private TeamFacade teamFacade;

    private QuestionDescriptorFacade questionDescriptorFacade;

    private StateMachineFacade stateMachineFacade;

    private GameFacade gameFacade;

    private RequestManager requestManager;

    public Beanjection() {
        // ensure to have an empty constructor
    }

    public Beanjection(VariableInstanceFacade variableInstanceFacade) {
        this.variableInstanceFacade = variableInstanceFacade;
    }

    public Beanjection(RequestManager requestManager,
        VariableInstanceFacade variableInstanceFacade,
        VariableDescriptorFacade variableDescriptorFacade,
        ResourceFacade resourceFacade,
        IterationFacade iterationFacade,
        ReviewingFacade reviewingFacade,
        UserFacade userFacade,
        AccountFacade accountFacade,
        TeamFacade teamFacade,
        QuestionDescriptorFacade questionDescriptorFacade,
        StateMachineFacade stateMachineFacade,
        GameFacade gameFacade) {
        this.requestManager = requestManager;
        this.variableInstanceFacade = variableInstanceFacade;
        this.variableDescriptorFacade = variableDescriptorFacade;
        this.resourceFacade = resourceFacade;
        this.iterationFacade = iterationFacade;
        this.reviewingFacade = reviewingFacade;
        this.userFacade = userFacade;
        this.accountFacade = accountFacade;
        this.teamFacade = teamFacade;
        this.questionDescriptorFacade = questionDescriptorFacade;
        this.stateMachineFacade = stateMachineFacade;
        this.gameFacade = gameFacade;
    }

    public RequestManager getRequestManager() {
        return requestManager;
    }

    public void setRequestManager(RequestManager requestManager) {
        this.requestManager = requestManager;
    }

    public VariableInstanceFacade getVariableInstanceFacade() {
        return variableInstanceFacade;
    }

    public void setVariableInstanceFacade(VariableInstanceFacade variableInstanceFacade) {
        this.variableInstanceFacade = variableInstanceFacade;
    }

    public ReviewingFacade getReviewingFacade() {
        return reviewingFacade;
    }

    public void setReviewingFacade(ReviewingFacade reviewinFacade) {
        this.reviewingFacade = reviewinFacade;
    }

    public VariableDescriptorFacade getVariableDescriptorFacade() {
        return variableDescriptorFacade;
    }

    public void setVariableDescriptorFacade(VariableDescriptorFacade variableDescriptorFacade) {
        this.variableDescriptorFacade = variableDescriptorFacade;
    }

    public IterationFacade getIterationFacade() {
        return iterationFacade;
    }

    public void setIterationFacade(IterationFacade iterationFacade) {
        this.iterationFacade = iterationFacade;
    }

    public UserFacade getUserFacade() {
        return userFacade;
    }

    public void setUserFacade(UserFacade userFacade) {
        this.userFacade = userFacade;
    }

    public TeamFacade getTeamFacade() {
        return teamFacade;
    }

    public void setTeamFacade(TeamFacade teamFacade) {
        this.teamFacade = teamFacade;
    }

    public QuestionDescriptorFacade getQuestionDescriptorFacade() {
        return questionDescriptorFacade;
    }

    public void setQuestionDescriptorFacade(QuestionDescriptorFacade questionDescriptorFacade) {
        this.questionDescriptorFacade = questionDescriptorFacade;
    }

    public ResourceFacade getResourceFacade() {
        return resourceFacade;
    }

    public void setResourceFacade(ResourceFacade resourceFacade) {
        this.resourceFacade = resourceFacade;
    }

    public AccountFacade getAccountFacade() {
        return accountFacade;
    }

    public void setAccountFacade(AccountFacade accountFacade) {
        this.accountFacade = accountFacade;
    }

    public void setGameFacade(GameFacade gameFacade) {
        this.gameFacade = gameFacade;
    }

    public GameFacade getGameFacade() {
        return gameFacade;
    }

    public StateMachineFacade getStateMachineFacade() {
        return stateMachineFacade;
    }

    public void setStateMachineFacade(StateMachineFacade stateMachineFacade) {
        this.stateMachineFacade = stateMachineFacade;
    }
}
