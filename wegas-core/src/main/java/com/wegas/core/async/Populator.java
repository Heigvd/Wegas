/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.async;

import com.wegas.core.async.PopulatorFacade.Candidate;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import jakarta.enterprise.context.Dependent;
import java.util.concurrent.Callable;
import jakarta.inject.Inject;

/**
 *
 * @author maxence
 */
@Dependent
public class Populator implements Callable<Integer> {

    @Inject
    private PopulatorFacade populatorFacade;

    @Override
    public Integer call() {
        Candidate candidate;
        int count = 0;

        while ((candidate = populatorFacade.getNextCandidate(this)) != null) { // NOPMD
            if (candidate.owner instanceof Team) {
                populatorFacade.populateTeam(candidate.owner.getId(), candidate.accountId);
            } else if (candidate.owner instanceof Player) {
                populatorFacade.populatePlayer(candidate.owner.getId(), candidate.accountId);
            }
            count++;
        }
        return count;
    }

}
