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
import com.wegas.persistence.game.PlayerEntity;
import com.wegas.persistence.game.TeamEntity;
import com.wegas.persistence.users.GroupEntity;
import com.wegas.persistence.users.UserEntity;
import java.util.List;
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
@Stateless(name = "PlayerManagerBean")
@LocalBean
public class PlayerManager {

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
    private UserManager um;
    /**
     * 
     */
    @EJB 
    private TeamManager tm;
    /**
     * 
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    public void create(Long teamId, PlayerEntity p) {
        TeamEntity te = tm.getTeam(teamId);
        te.addPlayer(p);
        em.flush();
        em.refresh(p);
        te.getGame().getGameModel().propagateDefaultVariableInstance(false);
    }

    /**
     * 
     * @param playerId
     * @return 
     */
    public PlayerEntity getPlayer(Long playerId) {
        PlayerEntity find = em.find(PlayerEntity.class, playerId);
        return find;
    }

    /**
     * 
     * @param id
     * @param t
     * @return
     */
    public PlayerEntity updatePlayer(Long playerId, PlayerEntity player) {
        PlayerEntity oPlayer = this.getPlayer(playerId);
        oPlayer.merge(player);
        return oPlayer;
    }
}
