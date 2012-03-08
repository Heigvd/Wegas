/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.users.UserEntity;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class TeamEntityFacade extends AbstractFacade<TeamEntity> {

    /**
     *
     */
    @EJB
    private UserEntityFacade userFacade;
    /**
     *
     */
    @EJB
    private GameEntityFacade gameFacade;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @param gameModelId
     * @param t
     */
    public void createTeam(Long gameModelId, TeamEntity t) {
        GameEntity g = gameFacade.find(gameModelId);
        g.addTeam(t);
        em.flush();
        em.refresh(t);
        g.getGameModel().propagateDefaultVariableInstance(false);
    }

    /**
     *
     * @param teamId
     * @param userId
     * @return
     */
    public PlayerEntity createPlayer(Long teamId, Long userId) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        UserEntity u = userFacade.find(userId);
        TeamEntity t = this.find(teamId);
        PlayerEntity p = new PlayerEntity();
        p.setUser(u);
        t.addPlayer(p);
        em.flush();
        em.refresh(p);
        //t.getGame().getGameModel().propagateDefaultVariableInstance(false);
        return p;
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     */
    public TeamEntityFacade() {
        super(TeamEntity.class);
    }
}
