package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.util.JsfUtil;
import com.wegas.core.ejb.GameEntityFacade;
import com.wegas.core.ejb.TeamEntityFacade;
import com.wegas.core.ejb.UserEntityFacade;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.users.UserEntity;
import java.io.Serializable;
import java.util.ResourceBundle;
import javax.ejb.EJB;
import javax.ejb.EJBException;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import javax.faces.model.DataModel;
import javax.faces.model.ListDataModel;
import javax.faces.model.SelectItem;
import javax.persistence.NoResultException;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author fx
 */
@ManagedBean(name = "lobbyController")
@SessionScoped
public class LobbyController implements Serializable {

    /**
     *
     */
    @EJB
    private UserEntityFacade userEntityFacade;
    /**
     *
     */
    @EJB
    private GameEntityFacade gameEntityFacade;
    /**
     *
     */
    @EJB
    private TeamEntityFacade teamEntityFacade;
    /**
     *
     */
    private String gameToken;
    /*
     *
     */
    private Long selectedTeamId;
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

    public UserEntity getCurrentUser() {

        Subject subject = SecurityUtils.getSubject();
        return userEntityFacade.getUserByPrincipal(subject.getPrincipal().toString());
    }

    public DataModel getAvailableGames() {
        return new ListDataModel(this.getCurrentUser().getPlayers());
    }

    public String joinGame() {
        try {
            this.currentGame = gameEntityFacade.getGameByToken(this.gameToken);
            return "gameJoined";
        }
        catch (EJBException e) {
            if (e.getCausedByException() instanceof NoResultException) {
                JsfUtil.addErrorMessage(e, ResourceBundle.getBundle("com.wegas.app.Bundle").getString("LobbyPage_GameNotFound"));
                return null;
            } else {
                throw e;
            }
        }
    }

    public SelectItem[] getAvailableTeams() {
        return JsfUtil.getSelectItems(this.currentGame.getTeams(), true);
    }

    public String joinTeam() {
        currentPlayer = teamEntityFacade.createPlayer(this.selectedTeamId, getCurrentUser().getId());
        return "teamJoined";
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
    public void setGameToken(String gameToken) {
        this.gameToken = gameToken;
    }

    /**
     * @return the selectedTeamId
     */
    public Long getSelectedTeamId() {
        return selectedTeamId;
    }

    /**
     * @param selectedTeamId the selectedTeamId to set
     */
    public void setSelectedTeamId(Long selectedTeamId) {
        this.selectedTeamId = selectedTeamId;
    }
}
