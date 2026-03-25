package com.wegas.announcement;

import com.wegas.announcement.ejb.AnnouncementFacade;
import com.wegas.announcement.persistence.Announcement;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import jakarta.inject.Inject;
import org.eclipse.persistence.jpa.jpql.parser.LocalDateTime;
import org.junit.After;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.util.Collection;
import java.util.Date;

public class AnnouncementFacadeTest extends AbstractArquillianTestMinimal {

    @Inject
    private AnnouncementFacade announcementFacade;

    private Announcement ongoing1;
    private Announcement ongoing2;

    @Before
    public void setUp() throws Exception {
        // create 3 announcements

        Date now = new Date();
        Date before1 = new Date(now.getTime() - (2000 * 60 * 60 * 24));
        Date before2 = new Date(now.getTime() - (1000 * 60 * 60 * 24));

        Date after1 = new Date(now.getTime() + (1000 * 60 * 60 * 24));
        Date after2 = new Date(now.getTime() + (2000 * 60 * 60 * 24));

        Announcement before = new Announcement();
        before.setStartTime(before1);
        before.setEndTime(before2);
        before.setMessage("This was before");

        this.ongoing1 = new Announcement();
        ongoing1.setStartTime(before2);
        ongoing1.setEndTime(after1);
        ongoing1.setMessage("This is ongoing");

        this.ongoing2 = new Announcement();
        ongoing2.setStartTime(before1);
        ongoing2.setEndTime(after1);
        ongoing2.setMessage("This is also ongoing");

        Announcement after = new Announcement();
        after.setStartTime(after1);
        after.setEndTime(after2);
        after.setMessage("This will be after");

        announcementFacade.create(before);
        announcementFacade.create(ongoing1);
        announcementFacade.create(ongoing2);
        announcementFacade.create(after);
    }

    @After
    public void tearDown() throws Exception {
        // TODO should instances be removed ?
    }

    @Test
    public void getActiveTest() throws Exception {
        Collection<Announcement> result = announcementFacade.findActive();
        Assert.assertEquals(2, result.size());
        Announcement a = result.iterator().next();
        Assert.assertEquals(a.getMessage(), ongoing1.getMessage());
        a = result.iterator().next();
        Assert.assertEquals(a.getMessage(), ongoing2.getMessage());
    }

    @Test
    public void getAllTest(){
        Collection<Announcement> result = announcementFacade.findAll();
        Assert.assertEquals(4, result.size());
    }


}
