package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.util.JsfUtil;
import com.wegas.core.ejb.GameEntityFacade;
import com.wegas.core.ejb.TeamEntityFacade;
import com.wegas.core.ejb.UserEntityFacade;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.users.UserEntity;
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
import javax.faces.model.DataModel;
import javax.faces.model.ListDataModel;
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

    public UserEntity getCurrentUser() {

        Subject subject = SecurityUtils.getSubject();
        try {
            return userEntityFacade.getUserByPrincipal(subject.getPrincipal().toString());
        }
        catch (EJBException e) {
            System.out.println(e.getCause()+"*"+e.getCausedByException());
            if (e.getCausedByException() instanceof NoResultException) {
                UserEntity u = new UserEntity();
                u.setName(subject.getPrincipal().toString());
                userEntityFacade.create(u);
                return u;
            } else {
                throw e;
            }
        }
    }

    public List<PlayerEntity> getPlayers() {
        return this.getCurrentUser().getPlayers();
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

    public List<TeamEntity> getAvailableTeams() {
        return this.currentGame.getTeams();
    }

    public String joinTeam() {
        setCurrentPlayer(teamEntityFacade.createPlayer(this.getSelectedTeam().getId(), getCurrentUser().getId()));
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
     * @return the selectedTeam
     */
    public TeamEntity getSelectedTeam() {
        return this.selectedTeam;
    }

    /**
     * @param selectedTeam the selectedTeam to set
     */
    public void setSelectedTeam(TeamEntity selectedTeam) {
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
    public void setCurrentPlayer(PlayerEntity currentPlayer) {
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
        public Object getAsObject(FacesContext facesContext, UIComponent component, String value) {
            if (value == null || value.length() == 0) {
                return null;
            }
            LobbyController controller = (LobbyController) facesContext.getApplication().getELResolver().
                    getValue(facesContext.getELContext(), null, "lobbyController");
            return controller.teamEntityFacade.find(Long.valueOf(value));
        }

        String getStringKey(Long value) {
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
        public String getAsString(FacesContext facesContext, UIComponent component, Object object) {
            if (object == null) {
                return null;
            }
            if (object instanceof TeamEntity) {
                TeamEntity o = (TeamEntity) object;
                return getStringKey(o.getId());
            } else {
                throw new IllegalArgumentException("object " + object + " is of type " + object.getClass().getName() + "; expected type: " + TeamEntity.class.getName());
            }
        }
    }
}
