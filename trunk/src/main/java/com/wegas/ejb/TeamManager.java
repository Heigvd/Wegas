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

import com.wegas.exception.InvalidContent;
import com.wegas.exception.NotFound;
import com.wegas.persistence.TeamEntity;
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
@Stateless
@LocalBean
public class TeamManager {

    private static final Logger logger = Logger.getLogger("EJB_UM");

    @EJB
    private AnonymousEntityManager aem;
    
    @EJB
    private UserManager ume;


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
    public void createTeam(TeamEntity u) {
        aem.create(u);
    }
    
    /**
     * 
     * @param id
     * @param t
     * @return
     */
    public TeamEntity updateTeam(Long id, TeamEntity t) {
        TeamEntity cTeam = this.getTeam(id);
        if (cTeam.equals(t)) {
            TeamEntity update = aem.update(t);
            return update;
        }
        throw new InvalidContent();
    }
    
    /**
     * 
     * @param teamId
     * @param userId
     * @return
     */
    public TeamEntity addUser(Long teamId, Long userId) {
        UserEntity u = ume.getUser(userId);
        TeamEntity t = this.getTeam(teamId);
        t.getUsers().add(u);
        aem.update(t);
        return t;
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
