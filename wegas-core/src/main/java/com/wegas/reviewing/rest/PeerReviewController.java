/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.util.SecurityHelper;
import com.wegas.reviewing.ejb.ReviewingFacade;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.reviewing.persistence.Review;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/PeerReviewController/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PeerReviewController {

    /**
     * Commit request to eval FSM
     */
    @EJB
    private RequestFacade requestFacade;

    /**
     * PeerReview EJB facade
     */
    @EJB
    private ReviewingFacade reviewFacade;

    /**
     * EJB User Facade
     */
    @EJB
    private UserFacade userFacade;

    /**
     * EJB Player Facade
     */
    @EJB
    private PlayerFacade playerFacade;

    /**
     * EJB Variable Descriptor Facade
     */
    @EJB
    private VariableDescriptorFacade descriptorFacade;

    /**
     * EJB Variable Instance Facade
     */
    @EJB
    private VariableInstanceFacade instanceFacade;

    /**
     * EJB Game Facade
     */
    @EJB
    private GameFacade gameFacade;

    /**
     * Return the VariableInstance to review, according to given peer review
     * descriptor and given review
     *
     * @param prdId    ID of the peer review descriptor which specify the
     *                 variable to review
     * @param rId      ID of the review indicating whom the variable to review
     *                 belongs
     * @param playerId
     * @return the variable instance to review
     */
    @GET
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/ToReview/{reviewId : [1-9][0-9]*}/{playerId: [1-9][0-9]*}")
    public VariableInstance getInstanceToReview(
            @PathParam("reviewDescriptorId") Long prdId,
            @PathParam("reviewId") Long rId,
            @PathParam("playerId") Long playerId) {

        try {
            Player player = playerFacade.find(playerId);
            Review review = reviewFacade.findReview(rId);
            PeerReviewInstance authorInstance = review.getAuthor();
            // Make sure the currentPlayer can read the Author variable
            assertReviewReadRight(review, player);

            PeerReviewDescriptor prd = (PeerReviewDescriptor) authorInstance.getDescriptor();

            VariableDescriptor toReview = prd.getToReview();
            // Find a player owning the author instance
            Player author = instanceFacade.findAPlayer(authorInstance);

            // And return this author istance
            return toReview.getInstance(author);
        } catch (NoPlayerException ex) {
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
     * @return Standard HTTP OK
     */
    @POST
    @Path("/{reviewDescriptorId : [1-9][0-9]*}/Submit/{playerId : [1-9][0-9]*}")
    public Response submit(
            @PathParam("playerId") Long playerId,
            @PathParam("reviewDescriptorId") Long prdId) {

        // Assert currentUser can edit the specified prd
        checkPermissions(playerFacade.find(playerId).getGame(), playerId);

        reviewFacade.submit(prdId, playerId);
        requestFacade.commit(true); // Player scoped

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
        assertTeacherRight(prdId, gameId);
        List<PeerReviewInstance> touched = reviewFacade.dispatch(prdId);
        this.commit(touched);
        return Response.ok().build();
    }

    /**
     * Make sure the current user has teacher right
     *
     * @param prdId  the peer review descriptor
     * @param gameId the current game
     */
    private void assertTeacherRight(Long prdId, Long gameId) {
        List<Game> games = descriptorFacade.find(prdId).getGameModel().getGames();
        Game game = gameFacade.find(gameId);

        // Assert the game correspong to one of the prd gameModel games
        if (!(games.contains(game)
                && SecurityHelper.isPermitted(game, "Edit"))) {
            throw new UnauthorizedException();
        }
    }

    /**
     * Save a review posted by a player.
     *
     * @param other review to save
     * @return updated PeerReviewInstance
     */
    @POST
    @Path("/SaveReview/{playerId: [1-9][0-9]*}")
    public PeerReviewInstance saveReview(Review other, @PathParam("playerId") Long playerId) {
        Review review = reviewFacade.findReview(other.getId());
        Player player = playerFacade.find(playerId);
        PeerReviewInstance instance = reviewFacade.getPeerReviewInstanceFromReview(review, player);
        assertReviewWriteRight(review, player);
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
     * @return peerReviewInstance with up to date reviews
     */
    @POST
    @Path("/SubmitReview/{playerId: [1-9][0-9]*}")
    public PeerReviewInstance submitReview(Review review, @PathParam("playerId") Long playerId) {
        Player player = playerFacade.find(playerId);
        assertReviewWriteRight(reviewFacade.findReview(review.getId()), player);
        Review submitedReview = reviewFacade.submitReview(review, player);
        requestFacade.commit(true); // Player scoped
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
        assertTeacherRight(prdId, gameId);
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
        assertTeacherRight(prdId, gameId);
        List<PeerReviewInstance> touched = reviewFacade.close(prdId);
        this.commit(touched);
        return Response.ok().build();
    }

    /* ************************
     *  Security
     * ************************/
    /**
     * Make sure the current user can read the given review
     *
     * @param r the review to read
     */
    private void assertReviewReadRight(Review r, Player player) {
        PeerReviewInstance pri = reviewFacade.getPeerReviewInstanceFromReview(r, player);
        Game game = instanceFacade.findGame(pri);

        if (!((SecurityHelper.isPermitted(game, "Edit"))
                || // Teacher/Scenarist
                (pri.getToReview().contains(r))
                || (pri.getReviewed().contains(r)))) { // Author when review the feedback
            throw new UnauthorizedException(); // Not one of this case ? NOT AUTHORIZED
        }
    }

    /**
     * Make sure current user can edit the given review
     *
     * @param r the review to edit
     */
    private void assertReviewWriteRight(Review r, Player player) {
        PeerReviewInstance pri = reviewFacade.getPeerReviewInstanceFromReview(r, player);
        Game game = instanceFacade.findGame(pri);

        if (!((SecurityHelper.isPermitted(game, "Edit"))
                || // Teacher/Scenarist
                (r.getReviewState() == Review.ReviewState.DISPATCHED && pri.getToReview().contains(r)) // Reviewer when reviewing
                || (r.getReviewState() == Review.ReviewState.NOTIFIED && pri.getReviewed().contains(r)))) { // Author when review the feedback
            throw new UnauthorizedException(); // Not one of this case ? NOT AUTHORIZED
        }
    }

    /**
     * Assert the current user can act as given player
     *
     * @param game     current game
     * @param playerId player context
     * @throws UnauthorizedException
     */
    private void checkPermissions(Game game, Long playerId) throws UnauthorizedException {
        if (!SecurityHelper.isPermitted(game, "Edit") && !userFacade.matchCurrentUser(playerId)) {
            throw new UnauthorizedException();
        }
    }

    private void commit(List<PeerReviewInstance> instances) {
        for (PeerReviewInstance pri : instances) {
            try {
                Player findAPlayer = instanceFacade.findAPlayer(pri);
                requestFacade.commit(findAPlayer, false);
                //requestFacade.firePlayerAction(findAPlayer);
            } catch (NoPlayerException ex) {
            }
        }
        requestFacade.flushClear();
    }
}
