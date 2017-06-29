package com.wegas.core.async;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.util.concurrent.Callable;
import javax.inject.Inject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class Populator implements Callable<Integer> {

    private static final Logger logger = LoggerFactory.getLogger(Populator.class);

    @Inject
    private PopulatorScheduler scheduler;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private TeamFacade teamFacade;

    @Override
    public Integer call() {
        AbstractEntity owner;
        int count = 0;

        while ((owner = scheduler.getNextOwner(this)) != null) {
            logger.error("POPULATE " + owner + " instances");
            if (owner instanceof Team) {
                teamFacade.populateTeam(owner.getId());
            } else if (owner instanceof Player) {
                playerFacade.populatePlayer(owner.getId());
            }
            logger.error("  * " + owner + " completed");
            count++;
        }
        return count;
    }

}
