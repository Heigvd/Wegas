/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.pusher.rest.Pusher;
import com.pusher.rest.data.PresenceUser;
import com.pusher.rest.data.Result;
import com.wegas.core.Helper;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.EntityDestroyedEvent;
import com.wegas.core.event.client.EntityUpdatedEvent;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.event.client.OutdatedEntitiesEvent;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import java.io.ByteArrayOutputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.Asynchronous;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.lang.reflect.InvocationTargetException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.MissingResourceException;
import java.util.zip.GZIPOutputStream;
import org.apache.shiro.SecurityUtils;

/**
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Stateless
@LocalBean
public class WebsocketFacade {

    private static final Logger logger = LoggerFactory.getLogger(WebsocketFacade.class);

    private final Pusher pusher;
    private final static String GLOBAL_CHANNEL = "presence-global";

    public enum WegasStatus {

        DOWN,
        READY,
        OUTDATED
    }

    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;

    @EJB
    GameFacade gameFacade;

    @EJB
    TeamFacade teamFacade;

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    @EJB
    private PlayerFacade playerFacade;

    private boolean hasPermission(String type, Long id, Player currentPlayer) {
        if ("GameModel".equals(type)) {
            return SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + id);
        } else if ("Game".equals(type)) {
            Game game = gameFacade.find(id);
            return game != null && SecurityHelper.isPermitted(game, "View");
        } else if ("Team".equals(type)) {
            Team team = teamFacade.find(id);
            User user = userFacade.getCurrentUser();

            if (currentPlayer != null && currentPlayer.getUser() != null
                    && currentPlayer.getUser().equals(user)) {
                // Current logged User is the player itself
                // the player MUST be a member of the team
                return playerFacade.checkExistingPlayerInTeam(team.getId(), user.getId()) != null;
            } else {
                // Trainer of scenarist (player is not linked to user)
                return SecurityHelper.isPermitted(team.getGame(), "Edit");
            }
        } else if ("Player".equals(type)) {
            User user = userFacade.getCurrentUser();
            Player player = playerFacade.find(id);

            if (player != null) {
                if (currentPlayer != null && currentPlayer.getUser() != null
                        && currentPlayer.getUser().equals(user)) {
                    return player.equals(currentPlayer);
                } else {
                    // Trainer and scenarist 
                    return SecurityHelper.isPermitted(player.getGame(), "Edit");
                }
            } else {
                return false;
            }
        }
        return false;
    }

    public boolean hasPermission(String channel, Player currentPlayer) {
        String[] split = channel.split("-");
        if (split.length != 2) {
            return false;
        } else {
            return hasPermission(split[0], Long.parseLong(split[1]), currentPlayer);
        }
    }

    public List<String> getChannels(List<AbstractEntity> entities) {
        List<String> channels = new ArrayList<>();
        String channel = null;

        for (AbstractEntity entity : entities) {
            if (entity instanceof GameModel) {
                if (SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + entity.getId())) {
                    channel = "GameModel";
                }
            } else if (entity instanceof Game) {
                if (SecurityHelper.isPermitted((Game) entity, "View")) {
                    channel = "Game";
                }
            } else if (entity instanceof Team) {
                Team team = (Team) entity;
                User user = userFacade.getCurrentUser();
                if (SecurityHelper.isPermitted(team.getGame(), "Edit") // Trainer and scenarist 
                        || playerFacade.checkExistingPlayerInTeam(team.getId(), user.getId()) != null) { // or member of team
                    channel = "Team";
                }
            } else if (entity instanceof Player) {
                Player player = (Player) entity;
                User user = userFacade.getCurrentUser();
                if (SecurityHelper.isPermitted(player.getGame(), "Edit") // Trainer and scenarist 
                        || player.getUser() == user) { // is the player
                    channel = "Player";
                }
            }

            if (channel != null) {
                channels.add(channel + "-" + entity.getId());
            }
        }
        return channels;
    }

    /**
     *
     * @param channel
     * @param status
     * @param socketId
     */
    public void sendLifeCycleEvent(String channel, WegasStatus status, final String socketId) {
        if (this.pusher != null) {
            pusher.trigger(channel, "LifeCycleEvent",
                    "{\"@class\": \"LifeCycleEvent\", \"status\": \"" + status.toString() + "\"}", socketId);
        }
    }

    /**
     * Send LifeCycle event to every connected user
     *
     * @param status
     * @param socketId
     */
    public void sendLifeCycleEvent(WegasStatus status, final String socketId) {
        sendLifeCycleEvent(GLOBAL_CHANNEL, status, socketId);
    }

    public void sendPopup(String channel, String message, final String socketId) {
        if (this.pusher != null) {
            pusher.trigger(channel, "CustomEvent",
                    "{\"@class\": \"CustomEvent\", \"type\": \"popupEvent\", \"payload\": {\"content\": \"<p>" + message + "</p>\"}}", socketId);
        }
    }

    private String getProperty(String property) {
        try {
            return Helper.getWegasProperty(property);
        } catch (MissingResourceException ex) {
            logger.warn("Pusher init failed: missing " + property + " property");
            return null;
        }
    }

    public WebsocketFacade() {
        Pusher tmp;
        try {
            tmp = new Pusher(getProperty("pusher.appId"),
                    getProperty("pusher.key"), getProperty("pusher.secret"));
        } catch (Exception e) {
            logger.warn("Pusher init failed, please check your configuration");
            logger.debug("Pusher error details", e);
            tmp = null;
        }
        pusher = tmp;
    }

    /**
     * @param filter
     * @param entityType
     * @param entityId
     * @param data
     * @return Status
     * @throws IOException
     */
    public Integer send(String filter, String entityType, String entityId, Object data) throws IOException {
        if (this.pusher == null) {
            return 400;
        }
        return pusher.trigger(entityType + "-" + entityId, filter, data).getHttpStatus();
    }

    /**
     * fire and forget pusher events
     *
     * @param dispatchedEntities
     * @param destroyedEntities
     * @param outdatedEntities
     * @throws com.wegas.core.exception.internal.NoPlayerException
     */
    @Asynchronous
    public void onRequestCommit(final Map<String, List<AbstractEntity>> dispatchedEntities,
            final Map<String, List<AbstractEntity>> destroyedEntities,
            final Map<String, List<AbstractEntity>> outdatedEntities) throws NoPlayerException {
        this.onRequestCommit(dispatchedEntities, destroyedEntities, outdatedEntities, null);
    }

    /**
     * fire and forget pusher events
     *
     * @param dispatchedEntities
     * @param destroyedEntities
     * @param outdatedEntities
     * @param socketId           Client's socket id. Prevent that specific
     *                           client to receive this particular message
     * @throws com.wegas.core.exception.internal.NoPlayerException
     */
    @Asynchronous
    public void onRequestCommit(final Map<String, List<AbstractEntity>> dispatchedEntities,
            final Map<String, List<AbstractEntity>> destroyedEntities,
            final Map<String, List<AbstractEntity>> outdatedEntities,
            final String socketId) throws NoPlayerException {
        if (this.pusher == null) {
            return;
        }

        propagate(dispatchedEntities, socketId, EntityUpdatedEvent.class);
        propagate(destroyedEntities, socketId, EntityDestroyedEvent.class);
        propagate(outdatedEntities, socketId, OutdatedEntitiesEvent.class);
    }

    private <T extends ClientEvent> void propagate(Map<String, List<AbstractEntity>> container, String socketId, Class<T> eventClass) {
        try {
            for (Map.Entry<String, List<AbstractEntity>> entry : container.entrySet()){
                String audience = entry.getKey();
                List<AbstractEntity> toPropagate = entry.getValue();
                //logger.error(eventClass.getSimpleName() + " entities: " + audience + ": " + toPropagate.size());
                ClientEvent event = eventClass.getDeclaredConstructor(List.class).newInstance(toPropagate);
                propagate(event, audience, socketId);
            }
        } catch (NoSuchMethodException | SecurityException |
                InstantiationException | IllegalAccessException |
                IllegalArgumentException | InvocationTargetException ex) {
            logger.error("EVENT INSTANTIATION FAILS");
        }
    }

    private String gzip(String data) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        GZIPOutputStream gzos = new GZIPOutputStream(baos);
        OutputStreamWriter osw = new OutputStreamWriter(gzos, "UTF-8");

        osw.append(data);
        osw.flush();
        osw.close();

        byte[] ba = baos.toByteArray();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < ba.length; i++) {
            // @hack convert to uint array
            /* 
             * Sending a byte[] through pusher result takes lot of place cause 
             * json is like "data: [31, 8, -127, ...]", full text
             */
            sb.append(Character.toString((char) Byte.toUnsignedInt(ba[i])));
        }
        return sb.toString();
    }

    private void propagate(ClientEvent clientEvent, String audience, final String socketId) {
        try {
            String eventName = clientEvent.getClass().getSimpleName() + ".gz";
            //if (eventName.matches(".*\\.gz$")) {
            String content = gzip(clientEvent.toJson());
            //} else {
            //    content = clientEvent.toJson();
            //}
            Result result = pusher.trigger(audience, eventName, content, socketId);


            if (result.getHttpStatus() == 403) {
                logger.error("403 QUOTA REACHED");
                // Pusher Message Quota Reached...
            } else if (result.getHttpStatus() == 413) {
                logger.error("413 MESSAGE TOO BIG");
                // wooops pusher error (too big ?)
                if (clientEvent instanceof EntityUpdatedEvent) {
                    this.propagate(new OutdatedEntitiesEvent(((EntityUpdatedEvent) clientEvent).getUpdatedEntities()),
                            audience, socketId);
                    //this.outdateEntities(audience, ((EntityUpdatedEvent) clientEvent), socketId);
                } else {
                    logger.error("  -> OUTDATE");
                    this.sendLifeCycleEvent(audience, WegasStatus.OUTDATED, socketId);
                }
            }
        } catch (IOException ex) {
            logger.error("     IOEX <----------------------", ex);
        }
    }

    public String pusherAuth(final String socketId, final String channel) {
        if (channel.startsWith("presence")) {
            final Map<String, String> userInfo = new HashMap<>();
            User user = userFacade.getCurrentUser();
            userInfo.put("name", user.getName());
            return pusher.authenticate(socketId, channel, new PresenceUser(user.getId(), userInfo));
        }
        if (channel.startsWith("private")) {
            return pusher.authenticate(socketId, channel);
        }
        return null;
    }
}
