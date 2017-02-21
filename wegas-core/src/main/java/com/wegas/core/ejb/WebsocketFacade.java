/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pusher.rest.Pusher;
import com.pusher.rest.data.PresenceUser;
import com.pusher.rest.data.Result;
import com.wegas.core.Helper;
import com.wegas.core.event.client.*;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.PusherChannelExistenceWebhook;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.OnlineUser;
import com.wegas.core.security.util.SecurityHelper;
import org.apache.shiro.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.lang.reflect.InvocationTargetException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.logging.Level;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPOutputStream;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;

/**
 * @author Yannick Lagger (lagger.yannick.com)
 */
@Stateless
@LocalBean
public class WebsocketFacade {

    private static final Logger logger = LoggerFactory.getLogger(WebsocketFacade.class);

    private final Pusher pusher;
    private final Boolean maintainLocalListUpToDate;

    public final static String GLOBAL_CHANNEL = "global-channel";
    public final static String ADMIN_CHANNEL = "private-Role-Admin";

    public static final Pattern USER_CHANNEL_PATTERN = Pattern.compile(Helper.USER_CHANNEL_PREFIX + "(\\d+)");
    public static final Pattern PRIVATE_CHANNEL_PATTERN = Pattern.compile("private-(User|Player|Team|Game|GameModel)-(\\d+)");

    private static boolean onlineUsersUptodate = false;

    private static final Map<Long, OnlineUser> onlineUsers = new HashMap<>();

    public enum WegasStatus {
        DOWN,
        READY,
        OUTDATED
    }

    /**
     *
     */
    @Inject
    private UserFacade userFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private RequestManager requestManager;

    /**
     * Initialize Pusher Connection
     */
    public WebsocketFacade() {
        Pusher tmp;
        String appId = getProperty("pusher.appId");
        String key = getProperty("pusher.key");
        String secret = getProperty("pusher.secret");
        maintainLocalListUpToDate = "true".equalsIgnoreCase(getProperty("pusher.onlineusers_hook"));

        if (!Helper.isNullOrEmpty(appId) && !Helper.isNullOrEmpty(key) && !Helper.isNullOrEmpty(secret)) {
            tmp = new Pusher(getProperty("pusher.appId"),
                    getProperty("pusher.key"), getProperty("pusher.secret"));
            tmp.setCluster(getProperty("pusher.cluster"));
            pusher = tmp;
        } else {
            pusher = null;
        }
    }

    /**
     * Get all channels based on entites
     *
     * @param entities
     * @return according to entities, all concerned channels
     */
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

    public void sendLock(String channel, String token) {
        if (this.pusher != null) {
            logger.error("send lock " + token + " to " + channel);
            pusher.trigger(channel, "LockEvent",
                    "{\"@class\": \"LockEvent\", \"token\": \"" + token + "\", \"status\": \"lock\"}", null);
        }
    }

    public void sendUnLock(String channel, String token) {
        if (this.pusher != null) {
            logger.error("send lock " + token + " to " + channel);
            pusher.trigger(channel, "LockEvent",
                    "{\"@class\": \"LockEvent\", \"token\": \"" + token + "\", \"status\": \"unlock\"}", null);
        }
    }

    /**
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

    /**
     * @param channel
     * @param message
     * @param socketId
     */
    public void sendPopup(String channel, String message, final String socketId) {
        if (this.pusher != null) {
            pusher.trigger(channel, "CustomEvent",
                    "{\"@class\": \"CustomEvent\", \"type\": \"popupEvent\", \"payload\": {\"content\": \"<p>" + message + "</p>\"}}", socketId);
        }
    }

    /**
     * @param property
     * @return the property value
     */
    private String getProperty(String property) {
        try {
            return Helper.getWegasProperty(property);
        } catch (MissingResourceException ex) {
            logger.warn("Pusher init failed: missing " + property + " property");
            return null;
        }
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
     */
    public void onRequestCommit(final Map<String, List<AbstractEntity>> dispatchedEntities,
            final Map<String, List<AbstractEntity>> destroyedEntities,
            final Map<String, List<AbstractEntity>> outdatedEntities) {
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
     */
    public void onRequestCommit(final Map<String, List<AbstractEntity>> dispatchedEntities,
            final Map<String, List<AbstractEntity>> destroyedEntities,
            final Map<String, List<AbstractEntity>> outdatedEntities,
            final String socketId) {
        if (this.pusher == null) {
            return;
        }

        propagate(destroyedEntities, socketId, EntityDestroyedEvent.class);
        propagate(dispatchedEntities, socketId, EntityUpdatedEvent.class);
        propagate(outdatedEntities, socketId, OutdatedEntitiesEvent.class);
    }

    /**
     * @param <T>
     * @param container
     * @param socketId
     * @param eventClass
     */
    private <T extends ClientEvent> void propagate(Map<String, List<AbstractEntity>> container, String socketId, Class<T> eventClass) {
        try {
            for (Map.Entry<String, List<AbstractEntity>> entry : container.entrySet()) {
                String audience = entry.getKey();
                List<AbstractEntity> toPropagate = entry.getValue();
                ClientEvent event;

                if (eventClass == EntityDestroyedEvent.class) {
                    List<DestroyedEntity> refreshed = new ArrayList<>();
                    /*
                     * Not possible to find an already destroyed entity, so, in 
                     * this case (and since those informations are sufficient), 
                     * only id and class name are propagated
                     */
                    for (AbstractEntity ae : toPropagate) {
                        refreshed.add(new DestroyedEntity(ae.getId(), ae.getJSONClassName()));
                    }
                    event = eventClass.getDeclaredConstructor(List.class).newInstance(refreshed);
                } else {
                    event = eventClass.getDeclaredConstructor(List.class).newInstance(toPropagate);
                }
                propagate(event, audience, socketId);
            }
        } catch (NoSuchMethodException | SecurityException
                | InstantiationException | IllegalAccessException
                | IllegalArgumentException | InvocationTargetException ex) {
            logger.error("EVENT INSTANTIATION FAILS");
        }
    }

    /**
     * Gzip some string
     *
     * @param data
     * @return gzipped data
     * @throws IOException
     */
    private GzContent gzip(String channel, String name, String data, String socketId) throws IOException {
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
        return new GzContent(channel, name, sb.toString(), socketId);
    }

    private static class GzContent {

        private final String name;
        private final String[] channels = {""};
        private final String data;
        private final String socketId;

        public GzContent(String channel, String name, String data, String socketId) {
            this.data = data;
            this.socketId = socketId;
            this.channels[0] = channel;
            this.name = name;

        }

        public String getName() {
            return name;
        }

        public String[] getChannels() {
            return channels;
        }

        public String getData() {
            return data;
        }

        public String getSocketId() {
            return socketId;
        }
    };

    private int computeLength(GzContent gzip) {

        try {
            ObjectMapper mapper = JacksonMapperProvider.getMapper();
            String writeValueAsString = mapper.writeValueAsString(gzip);
            logger.error(writeValueAsString);
            logger.error("LENGTH SHOULD BE: " + writeValueAsString.length());

            return writeValueAsString.length();
        } catch (JsonProcessingException ex) {
            logger.error("FAILS TO COMPUTE LENGTH");
            return 0;
        }
    }

    /**
     * Send data through pusher
     *
     * @param clientEvent
     * @param audience
     * @param socketId
     */
    private void propagate(ClientEvent clientEvent, String audience, final String socketId) {
        try {
            String eventName = clientEvent.getClass().getSimpleName() + ".gz";
            //if (eventName.matches(".*\\.gz$")) {
            GzContent gzip = gzip(audience, eventName, clientEvent.toJson(), socketId);
            String content = gzip.getData();
            //int computedLength = computeLength(gzip);

            //if (computedLength > 10240) {
            //    logger.error("413 MESSAGE TOO BIG");
            // wooops pusher error (too big)
            //    this.fallback(clientEvent, audience, socketId);
            //} else {
            Result result = pusher.trigger(audience, eventName, content, socketId);

            if (result.getHttpStatus() == 403) {
                logger.error("403 QUOTA REACHED");
            } else if (result.getHttpStatus() == 413) {
                logger.error("413 MESSAGE TOO BIG");
                this.fallback(clientEvent, audience, socketId);
            }
            //}
        } catch (IOException ex) {
            logger.error("     IOEX <----------------------", ex);
        }
    }

    private void fallback(ClientEvent clientEvent, String audience, final String socketId) {
        if (clientEvent instanceof EntityUpdatedEvent) {
            this.propagate(new OutdatedEntitiesEvent(((EntityUpdatedEvent) clientEvent).getUpdatedEntities()),
                    audience, socketId);
            //this.outdateEntities(audience, ((EntityUpdatedEvent) clientEvent), socketId);
        } else {
            logger.error("  -> OUTDATE");
            this.sendLifeCycleEvent(audience, WegasStatus.OUTDATED, socketId);
        }
    }

    /**
     * Pusher authentication
     *
     * @param socketId
     * @param channel
     * @return complete body to return to the client requesting authentication
     */
    public String pusherAuth(final String socketId, final String channel) {
        if (channel.startsWith("presence")) {
            final Map<String, String> userInfo = new HashMap<>();
            User user = userFacade.getCurrentUser();
            userInfo.put("name", user.getName());
            return pusher.authenticate(socketId, channel, new PresenceUser(user.getId(), userInfo));
        }
        if (channel.startsWith("private")) {
            boolean hasPermission = requestManager.hasPermission(channel);
            if (hasPermission) {
                return pusher.authenticate(socketId, channel);
            }
        }
        return null;
    }

    private User getUserFromChannel(String channelName) {
        Matcher matcher = USER_CHANNEL_PATTERN.matcher(channelName);

        if (matcher.matches()) {
            if (matcher.groupCount() == 1) {
                Long userId = Long.parseLong(matcher.group(1));
                return userFacade.find(userId);
            }
        }
        return null;
    }

    /**
     *
     * @param hook
     */
    public void pusherChannelExistenceWebhook(PusherChannelExistenceWebhook hook) {
        synchronized (onlineUsers) {
            if (!WebsocketFacade.onlineUsersUptodate) {
                initOnlineUsers();
            }
            User user = this.getUserFromChannel(hook.getChannel());
            if (user != null) {
                if (hook.getName().equals("channel_occupied")) {
                    this.registerUser(user);
                } else if (hook.getName().equals("channel_vacated")) {
                    onlineUsers.remove(user.getId());
                }
                this.propagateOnlineUsers();
            }
        }
    }

    /**
     * Return online users
     *
     * @return list a users who are online
     */
    public Collection<OnlineUser> getOnlineUsers() {
        synchronized (onlineUsers) {
            if (!WebsocketFacade.onlineUsersUptodate) {
                initOnlineUsers();
            }
        }
        return onlineUsers.values();
    }

    /**
     * Register user within internal onlineUser list
     *
     * @param user
     */
    private void registerUser(User user) {
        if (user != null && !onlineUsers.containsKey(user.getId())) {
            onlineUsers.put(user.getId(), new OnlineUser(user));
        }
    }

    /**
     * Build initial onlineUser list from pusher channels list
     */
    private void initOnlineUsers() {
        try {
            this.clearOnlineUsers();

            Result get = pusher.get("/channels");
            String message = get.getMessage();

            ObjectMapper mapper = JacksonMapperProvider.getMapper();
            HashMap<String, HashMap<String, Object>> readValue = mapper.readValue(message, HashMap.class);
            HashMap<String, Object> channels = readValue.get("channels");

            for (String channel : channels.keySet()) {
                this.registerUser(this.getUserFromChannel(channel));
            }

            if (maintainLocalListUpToDate) {
                WebsocketFacade.onlineUsersUptodate = true;
            }

        } catch (IOException ex) {
            java.util.logging.Logger.getLogger(WebsocketFacade.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    /**
     * Say to admin's who are currently logged in that some users connect or
     * disconnect
     */
    private void propagateOnlineUsers() {
        try {
            ObjectMapper mapper = JacksonMapperProvider.getMapper();
            String users = mapper.writeValueAsString(onlineUsers.values());
            pusher.trigger(WebsocketFacade.ADMIN_CHANNEL, "online-users", users);
        } catch (JsonProcessingException ex) {
            java.util.logging.Logger.getLogger(WebsocketFacade.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    public void clearOnlineUsers() {
        synchronized (onlineUsers) {
            onlineUsers.clear();
            onlineUsersUptodate = false;
        }
    }

    /**
     * Assert HmacSHA256 BODY signature match
     *
     * @param request
     * @param raw
     */
    public void authenticateHookSource(HttpServletRequest request, byte[] raw) {
        try {
            String pusherKey = request.getHeader("X-Pusher-Key");

            if (pusherKey == null || !pusherKey.equals(Helper.getWegasProperty("pusher.key"))) {
                throw WegasErrorMessage.error("Invalid app key");
            }

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(Helper.getWegasProperty("pusher.secret").getBytes("UTF-8"), "HmacSHA256"));

            String hex = Helper.hex(mac.doFinal(raw));

            if (hex == null || !hex.equals(request.getHeader("X-Pusher-Signature"))) {
                throw WegasErrorMessage.error("Authentication Failed");
            }
        } catch (IOException ex) {
            throw WegasErrorMessage.error("Unable to read request body");
        } catch (NoSuchAlgorithmException | InvalidKeyException ex) {
            throw WegasErrorMessage.error(ex.getMessage());
        }
    }

}
