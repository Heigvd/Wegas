/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.ejb;

import com.wegas.exception.NotFound;
import com.wegas.persistence.game.GameEntity;
import com.wegas.persistence.game.PlayerEntity;
import com.wegas.persistence.game.TeamEntity;
import com.wegas.persistence.users.GroupEntity;
import com.wegas.persistence.users.UserEntity;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaQuery;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless(name = "TeamManagerBean")
@LocalBean
public class TeamManager {

    private static final Logger logger = Logger.getLogger("EJB_UM");
    /**
     * 
     */
    @EJB
    private AnonymousEntityManager aem;
    /**
     * 
     */
    @EJB
    private UserManager ume;
    /**
     * 
     */
    @EJB
    private GameManager gm;
    /**
     * 
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     * 
     * @return
     */
    public List<TeamEntity> getTeams() {
        CriteriaQuery cq = em.getCriteriaBuilder().createQuery();
        cq.select(cq.from(GroupEntity.class));
        Query q = em.createQuery(cq);

        return q.getResultList();
    }

    /**
     * 
     * @param id
     * @return
     */
    public TeamEntity getTeam(Long id) {
        TeamEntity find = em.find(TeamEntity.class, id);

        if (find == null) {
            throw new NotFound();
        }
        return find;
    }

    /**
     * 
     * @param u
     */
    public void createTeam(Long gameModelId, TeamEntity t) {
        GameEntity g = gm.getGame(gameModelId);
        g.addTeam(t);
        em.flush();
        em.refresh(t);
        g.getGameModel().propagateDefaultVariableInstance(false);
    }

    /**
     * 
     * @param id
     * @param t
     * @return
     */
    public TeamEntity updateTeam(Long id, TeamEntity t) {
        TeamEntity cTeam = this.getTeam(id);
        cTeam.merge(t);
        return cTeam;
    }

    /**
     * 
     * @param teamId
     * @param userId
     * @return
     */
    public PlayerEntity createPlayer(Long teamId, Long userId) {
        logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        UserEntity u = ume.getUser(userId);
        TeamEntity t = this.getTeam(teamId);
        PlayerEntity p = new PlayerEntity();
        p.setUser(u);
        t.addPlayer(p);
        em.flush();
        em.refresh(p);
        t.getGame().getGameModel().propagateDefaultVariableInstance(false);
        return p;
    }

    /**
     * 
     * @param id
     */
    public void destroyTeam(Long id) {
        TeamEntity u = this.getTeam(id);
        aem.destroy(u);
    }
}
