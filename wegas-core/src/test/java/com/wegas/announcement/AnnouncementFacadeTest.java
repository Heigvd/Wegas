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
        before.setStartDisplayTime(before1);
        before.setEndDisplayTime(before2);
        before.setMessage("This was before");

        this.ongoing1 = new Announcement();
        ongoing1.setStartDisplayTime(before2);
        ongoing1.setEndDisplayTime(after1);
        ongoing1.setMessage("This is ongoing");

        this.ongoing2 = new Announcement();
        ongoing2.setStartDisplayTime(before1);
        ongoing2.setEndDisplayTime(after1);
        ongoing2.setMessage("This is also ongoing");

        Announcement after = new Announcement();
        after.setStartDisplayTime(after1);
        after.setEndDisplayTime(after2);
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
        Collection<Announcement> result = announcementFacade.findAll();
        Assert.assertEquals(4, result.size());
    }

}
