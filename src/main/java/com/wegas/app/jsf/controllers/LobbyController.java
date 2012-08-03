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
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.UserFacade;
import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.user.User;
import java.io.IOException;
import java.io.Serializable;
import java.util.List;
import java.util.ResourceBundle;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.ejb.EJBException;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.component.UIComponent;
import javax.faces.context.FacesContext;
import javax.faces.convert.Converter;
import javax.faces.convert.FacesConverter;
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
    private Team selectedTeam;
    /**
     *
     */
    private Game currentGame;
    /**
     *
     */
    private Player currentPlayer;
    /**
     *
     */
    private User currentUser;

    /**
     *
     */
    public LobbyController() {
    }

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        this.setCurrentUser(findUser());
    }

    /**
     *
     * @return
     */
    public User findUser() {

        final Subject subject = SecurityUtils.getSubject();
        try {
            return userFacade.getUserByPrincipal(subject.getPrincipal().toString());
        }
        catch (EJBException e) {                                                   // If the user is logged in but we cannot find a
            if (e.getCause() instanceof PersistenceException) {                // corresponding account, that means we need to create one.
                User newUser = new User();
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
    public String joinGame() throws Exception {
        try {
            this.currentGame = gameFacade.findByToken(this.gameToken);
            return "gameJoined";
        }
        catch (Exception e) {
            if (e.getCause() instanceof PersistenceException) {
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
    public List<Team> getAvailableTeams() {
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
    public List<Player> getPlayers() {
        return this.getCurrentUser().getPlayers();
    }

    /**
     *
     * @return
     */
    public List<GameModel> getGameModels() {
        return gameModelFacade.findAll();
    }

    /**
     *
     * @return
     */
    public GameModel getCurrentGameModel() {
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
    public Team getSelectedTeam() {
        return this.selectedTeam;
    }

    /**
     * @param selectedTeam the selectedTeam to set
     */
    public void setSelectedTeam(final Team selectedTeam) {
        this.selectedTeam = selectedTeam;
    }

    /**
     * @return the currentPlayer
     */
    public Player getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * @param currentPlayer the currentPlayer to set
     */
    public void setCurrentPlayer(final Player currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    /**
     * @return the currentUser
     */
    public User getCurrentUser() {
        return currentUser;
    }

    /**
     * @param currentUser the currentUser to set
     */
    public void setCurrentUser(User currentUser) {
        this.currentUser = currentUser;
    }

    /**
     *
     */
    @FacesConverter(forClass = Team.class, value = "appTeamConverter")
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
            if (object instanceof Team) {
                final Team o = (Team) object;
                return getStringKey(o.getId());
            } else {
                throw new IllegalArgumentException("object " + object + " is of type " + object.getClass().getName() + "; expected type: " + Team.class.getName());
            }
        }
    }
}
