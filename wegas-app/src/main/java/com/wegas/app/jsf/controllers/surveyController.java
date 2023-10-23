
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.controllers.utils.HttpParam;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import com.wegas.survey.persistence.SurveyDescriptor;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.RequestScoped;
import jakarta.faces.context.ExternalContext;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 
 *
 * Controls player access to games
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("surveyController")
@RequestScoped
public class surveyController extends AbstractGameController {

    private static final long serialVersionUID = 1563759464312489408L;

    private static final Logger logger = LoggerFactory.getLogger(surveyController.class);

    /**
     *
     */
    @Inject
    @HttpParam("surveyIds")
    private String surveyIds;

    private List<SurveyDescriptor> surveys;

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;
    /**
     *
     */
    @Inject
    private UserFacade userFacade;
    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     */
    @Inject
    ErrorController errorController;

    @Inject
    private RequestManager requestManager;

    /**
     *
     */
    @PostConstruct
    public void init() {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();
        User currentUser = userFacade.getCurrentUser();

        if (this.playerId != null) {
            errorController.accessDenied();
        }

        if (surveyIds != null) {
            this.surveys = Arrays.stream(surveyIds.split(","))
                .map(id -> variableDescriptorFacade.find(Long.parseLong(id.trim())))
                .filter(vd -> vd instanceof SurveyDescriptor)
                .map(SurveyDescriptor.class::cast)
                .collect(Collectors.toList());

            GameModel gm = null;
            for (SurveyDescriptor sd : surveys) {
                if (gm == null) {
                    gm = sd.getGameModel();
                } else {
                    if (!gm.equals(sd.getGameModel())) {
                        gm = null;
                        break;
                    }
                }
            }
            if (gm != null) {
                currentPlayer = playerFacade.findPlayerInGameModel(gm.getId(),
                    currentUser.getId());
            }
        }

        if (currentPlayer == null) {
            // If no player could be found, we redirect to an error page
            errorController.gameNotFound();
        } else {
            Status status = currentPlayer.getStatus();
            Game.Status gameStatus = currentPlayer.getGame().getStatus();

            if (status != Status.LIVE && status != Status.SURVEY) {
                try {
                    externalContext.dispatch("/wegas-app/jsf/error/waiting.xhtml");
                } catch (IOException ex) {
                    logger.error("Dispatch error: {}", ex);
                }
            } else if (gameStatus != gameStatus.LIVE) {
                errorController.gameDeleted();
            }
        }
    }
}
