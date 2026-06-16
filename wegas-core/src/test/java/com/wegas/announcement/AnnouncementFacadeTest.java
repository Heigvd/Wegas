package com.wegas.announcement;

import com.wegas.announcement.ejb.AnnouncementFacade;
import com.wegas.announcement.persistence.Announcement;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import jakarta.inject.Inject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

import java.util.Collection;
import java.util.Date;
import java.util.List;

public class AnnouncementFacadeTest extends AbstractArquillianTestMinimal {

    @Inject
    private AnnouncementFacade announcementFacade;

    private Announcement ongoing1;
    private Announcement ongoing2;

    @Before
    public void setUp() throws Exception {
        long now = new Date().getTime();
        Date before1 = new Date(now - (1000 * 60 * 6));//-6 minutes
        Date before2 = new Date(now - (1000 * 60 * 3));

        Date after1 = new Date(now + (1000 * 60 * 3));
        Date after2 = new Date(now + (1000 * 60 * 6));

        Announcement before = new Announcement();
        before.setDisplayStartTime(before1);
        before.setDisplayEndTime(before2);
        before.setMessage("This was before");

        this.ongoing1 = new Announcement();
        ongoing1.setDisplayStartTime(before2);
        ongoing1.setDisplayEndTime(after1);
        ongoing1.setMessage("This is ongoing");

        this.ongoing2 = new Announcement();
        ongoing2.setDisplayStartTime(before1);
        ongoing2.setDisplayEndTime(after1);
        ongoing2.setMessage("This is also ongoing");

        Announcement after = new Announcement();
        after.setDisplayStartTime(after1);
        after.setDisplayEndTime(after2);
        after.setMessage("This will be after");

        announcementFacade.create(before);
        announcementFacade.create(ongoing2);
        announcementFacade.create(ongoing1);
        announcementFacade.create(after);
    }

    @Test
    public void getActiveTest() throws Exception {
        List<Announcement> result = announcementFacade.findActive();
        Assert.assertEquals(2, result.size());

        Assert.assertEquals(result.get(0).getMessage(), ongoing1.getMessage());
        Assert.assertEquals(result.get(1).getMessage(), ongoing2.getMessage());
    }

    @Test
    public void getAllTest(){
        List<Announcement> result = announcementFacade.findAll();
        Assert.assertEquals(4, result.size());
    }

    @Test
    public void deletionTest() throws Exception {
        Announcement other = new Announcement();
        other.setMessage("other");
        // create and get created entity
        other = announcementFacade.createNew(other);
        List<Announcement> result = announcementFacade.findAll();
        Assert.assertEquals(5, result.size());

        announcementFacade.remove(other.getId());
        Assert.assertNull(announcementFacade.find(other.getId()));
        result = announcementFacade.findAll();
        Assert.assertEquals(4, result.size());
    }

}
