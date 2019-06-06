/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.reviewing.ejb.ReviewingFacade;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.reviewing.persistence.Review;
import java.util.List;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/PeerReviewController/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PeerReviewController {

    /**
     * Commit request to eval FSM
     */
    @Inject
    private RequestFacade requestFacade;

    /**
     * PeerReview facade
     */
    @Inject
    private ReviewingFacade reviewFacade;

    /**
     * Player Facade
     */
    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     * Inject Variable Instance Facade
     */
    @Inject
    private VariableInstanceFacade instanceFacade;

    /**
     * Return the VariableInstance to review, according to given peer review
     * descriptor and given review
     *
     * @param prdId  ID of the peer review descriptor which specify the
     *               variable to review
     * @param rId    ID of the review indicating whom the variable to review
     *               belongs
     * @param selfId
     *
     * @return the variable instance to review
     */
    @GET

    @Path("/{reviewDescriptorId : [1-9][0-9]*}/ToReview/{reviewId : [1-9][0-9]*}/{playerId: [1-9][0-9]*}")
    public VariableInstance getInstanceToReview(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("reviewId") Long rId,
            @PathParam("playerId") Long selfId) {

        Player self = playerFacade.find(selfId);
        Review review = reviewFacade.findReview(rId);
        PeerReviewInstance authorInstance = review.getAuthor();

        PeerReviewDescriptor prd = (PeerReviewDescriptor) authorInstance.getDescriptor();
        VariableDescriptor toReview = prd.getToReview();

        // since changing ToReview broadcast scope to GameScope is not a so good idea
        // a special way to have right to read author variable instance is required...
        // it's not very nice and looks like a ugly hack.... let's grant TEAM and PLAYER
        // right (just for this request indeed)
        Player oneOfTheAuthors = authorInstance.getOwner().getAnyLivePlayer();

        requestFacade.getRequestManager().grant(oneOfTheAuthors.getAssociatedWritePermission());
        requestFacade.getRequestManager().grant(oneOfTheAuthors.getTeam().getAssociatedWritePermission());

        VariableInstance instance = toReview.findInstance(authorInstance, requestFacade.getCurrentUser());
        if (instance != null) {
            return instance;
        } else {
            throw WegasErrorMessage.error("Unable to find a player");
        }
    }

    /**
     * Let a player submit his variable. It means the variable become ready to
     * be reviewed
     *
     * @param playerId id of the player who submit
     * @param prdId    the peer review descriptor containing the variable to
     *                 submit
     *
     * @return Standard HTTP OK
     */
    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Submit/{playerId : [1-9][0-9]*}")
    public Response submit(
            @PathParam("playerId") Long playerId,
            @PathParam("reviewDescriptorId") Long prdId) {

        reviewFacade.submit(prdId, playerId);
        requestFacade.commit(playerId); // Player scoped

        return Response.ok().build();
    }

    /**
     * Called by the teacher, it will take each PeerReviewInstance matching the
     * given peer review descriptor and dispatch them (who review who?)
     *
     * @param prdId  the peer review descriptor
     * @param gameId the current game
     *
     * @return STD HTTP 200 OK
     */
    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Dispatch/{gameId: [1-9][0-9]*}")
    public Response dispatch(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("gameId") Long gameId
    ) {
        List<PeerReviewInstance> touched = reviewFacade.dispatch(prdId);
        this.commit(touched);
        return Response.ok().build();
    }

    /**
     * Save a review posted by a player.
     *
     * @param other review to save
     *
     * @return updated PeerReviewInstance
     */
    @POST
    @Path("/SaveReview/{playerId: [1-9][0-9]*}")
    public PeerReviewInstance saveReview(Review other, @PathParam("playerId") Long playerId) {
        Review review = reviewFacade.findReview(other.getId());
        Player player = playerFacade.find(playerId);
        PeerReviewInstance instance = reviewFacade.getPeerReviewInstanceFromReview(review, player);
        reviewFacade.saveReview(instance, other);
        return instance;
    }

    /**
     * Submitting a review occurs twice in the whole process First time when the
     * reviewer post his review. In this case, the review switch from DISPATCHED
     * to REVIEWED. The second time is when the author post his comments, switch
     * from NOTIFIED to COMPLETED
     *
     * @param review   review to submit
     * @param playerId
     *
     * @return peerReviewInstance with up to date reviews
     */
    @POST
    @Path("/SubmitReview/{playerId: [1-9][0-9]*}")
    public PeerReviewInstance submitReview(Review review, @PathParam("playerId") Long playerId) {
        Player player = playerFacade.find(playerId);
        Review submitedReview = reviewFacade.submitReview(review, player);
        requestFacade.commit(player); // Player scoped
        return reviewFacade.getPeerReviewInstanceFromReview(submitedReview, player);
    }

    /**
     *
     * Reviewing phase is over -> authors will be able to see feedbacks
     *
     * @param prdId  peerReviewDescriptor
     * @param gameId the current game
     *
     * @return Standard HTTP 200
     */
    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Notify/{gameId: [1-9][0-9]*}")
    public Response notify(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("gameId") Long gameId
    ) {
        List<PeerReviewInstance> touched = reviewFacade.notify(prdId);
        this.commit(touched);
        return Response.ok().build();
    }

    /**
     *
     * The Reviewing will be completely finished after closing
     *
     * @param prdId  peerReviewDescriptor
     * @param gameId the current game
     *
     * @return Standard HTTP 200
     */
    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Close/{gameId: [1-9][0-9]*}")
    public Response close(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("gameId") Long gameId
    ) {
        List<PeerReviewInstance> touched = reviewFacade.close(prdId);
        this.commit(touched);
        return Response.ok().build();
    }

    private void commit(List<PeerReviewInstance> instances) {
        for (PeerReviewInstance pri : instances) {
            InstanceOwner owner = pri.getOwner();
            if (owner != null) {
                Player p = owner.getAnyLivePlayer();
                if (p != null) {
                    requestFacade.commit(p);
                }
            }
        }
        requestFacade.flushClear();
    }
}
