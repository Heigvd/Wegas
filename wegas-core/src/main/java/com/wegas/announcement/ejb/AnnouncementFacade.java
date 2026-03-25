package com.wegas.announcement.ejb;

import com.wegas.announcement.persistence.Announcement;
import com.wegas.core.ejb.BaseFacade;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import java.util.Date;
import java.util.List;

@Stateless
@LocalBean
public class AnnouncementFacade extends BaseFacade<Announcement> {

    public AnnouncementFacade(){super(Announcement.class);}

    public Announcement createNew(Announcement announcement){

        getEntityManager().persist(announcement);
        Long id = announcement.getId();
        return this.find(id);
    }

    public List<Announcement> findActive(){

        final CriteriaBuilder criteriaBuilder = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery<Announcement> query = criteriaBuilder.createQuery(Announcement.class);
        Root<Announcement> root = query.from(Announcement.class);
        query.select(root);

        final Date now = new Date();

        Predicate active = criteriaBuilder.and(
                criteriaBuilder.lessThan(root.get("startDisplayTime"), now),
                criteriaBuilder.greaterThan(root.get("endDisplayTime"), now)
        );

        query.where(active);
        query.orderBy(criteriaBuilder.desc(root.get("startDisplayTime")));

        return this.getEntityManager().createQuery(query).getResultList();
    }

    /**
     * Internal use
     * @param entity entity to persist
     */
    @Override
    public void create(Announcement entity) {
        getEntityManager().persist(entity);
    }

    @Override
    public void remove(Announcement entity) {
        getEntityManager().remove(entity);
    }
}
