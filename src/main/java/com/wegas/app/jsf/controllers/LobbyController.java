/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.controllers.util.JsfUtil;
import com.wegas.core.ejb.*;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.user.UserEntity;
import java.io.Serializable;
import java.util.List;
import java.util.ResourceBundle;
import javax.ejb.EJB;
import javax.ejb.EJBException;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.FacesConverter;
import javax.persistence.NoResultException;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name = "lobbyController")
@SessionScoped
public class LobbyController implements Serializable {

    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;
    /**
     *
     */
    @EJB
    private TeamFacade teamEntityFacade;
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;
    /**
     *
     */
    private String gameToken;
    /*
     *
     */
    private TeamEntity selectedTeam;
    /**
     *
     */
    private GameEntity currentGame;
    /**
     *
     */
    private PlayerEntity currentPlayer;

    /**
     *
     */
    public LobbyController() {
    }

    /**
     *
     * @return
     */
    public UserEntity getCurrentUser() {

        final Subject subject = SecurityUtils.getSubject();
        try {

            return userFacade.getUserByPrincipal(subject.getPrincipal().toString());

        }
        catch (EJBException e) {                                              // If the user is logged in but we cannot find a
            if (e.getCausedByException() instanceof NoResultException) {        // corresponding account, that means we need to create one.
                UserEntity newUser = new UserEntity();
                newUser.setName(subject.getPrincipal().toString());
                userFacade.create(newUser);
                return newUser;
            } else {
                throw e;
            }
        }
    }

    /**
     *
     * @return
     */
    public List<PlayerEntity> getPlayers() {
        return this.getCurrentUser().getPlayers();
    }

    /**
     *
     * @return
     */
    public List<GameModelEntity> getGameModels() {
        return gameModelFacade.findAll();
    }

    /**
     *
     * @return
     */
    public String joinGame() {
        try {
            this.currentGame = gameFacade.getGameByToken(this.gameToken);
            return "gameJoined";
        }
        catch (EJBException e) {
            if (e.getCausedByException() instanceof NoResultException) {
                JsfUtil.addErrorMessage(e, ResourceBundle.getBundle("wegas-app.Bundle").getString("LobbyPage_GameNotFound"));
                return null;
            } else {
                throw e;
            }
        }
    }

    /**
     *
     * @return
     */
    public List<TeamEntity> getAvailableTeams() {
        return this.currentGame.getTeams();
    }

    /**
     *
     * @return
     */
    public String joinTeam() {
        setCurrentPlayer(teamEntityFacade.joinTeam(this.getSelectedTeam().getId(), getCurrentUser().getId()));
        return "teamJoined";
    }

    /**
     *
     * @return
     */
    public GameModelEntity getCurrentGameModel() {
        return currentPlayer.getTeam().getGame().getGameModel();
    }

    /**
     * @return the gameToken
     */
    public String getGameToken() {
        return gameToken;
    }

    /**
     * @param gameToken the gameToken to set
     */
    public void setGameToken(final String gameToken) {
        this.gameToken = gameToken;
    }

    /**
     * @return the selectedTeam
     */
    public TeamEntity getSelectedTeam() {
        return this.selectedTeam;
    }

    /**
     * @param selectedTeam the selectedTeam to set
     */
    public void setSelectedTeam(final TeamEntity selectedTeam) {
        this.selectedTeam = selectedTeam;
    }

    /**
     * @return the currentPlayer
     */
    public PlayerEntity getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * @param currentPlayer the currentPlayer to set
     */
    public void setCurrentPlayer(final PlayerEntity currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    /**
     *
     */
    @FacesConverter(forClass = TeamEntity.class, value = "appTeamConverter")
    public static class LobbyControllerConverter implements Converter {

        /**
         *
         * @param facesContext
         * @param component
         * @param value
         * @return
         */
        @Override
        public Object getAsObject(final FacesContext facesContext, final UIComponent component, final String value) {
            if (value == null || value.length() == 0) {
                return null;
            }
            final LobbyController controller = (LobbyController) facesContext.getApplication().getELResolver().
                    getValue(facesContext.getELContext(), null, "lobbyController");
            return controller.teamEntityFacade.find(Long.valueOf(value));
        }

        String getStringKey(final Long value) {
            StringBuilder sb = new StringBuilder();
            sb.append(value);
            return sb.toString();
        }

        /**
         *
         * @param facesContext
         * @param component
         * @param object
         * @return
         */
        @Override
        public String getAsString(final FacesContext facesContext, final UIComponent component, final Object object) {
            if (object == null) {
                return null;
            }
            if (object instanceof TeamEntity) {
                final TeamEntity o = (TeamEntity) object;
                return getStringKey(o.getId());
            } else {
                throw new IllegalArgumentException("object " + object + " is of type " + object.getClass().getName() + "; expected type: " + TeamEntity.class.getName());
            }
        }
    }
}
