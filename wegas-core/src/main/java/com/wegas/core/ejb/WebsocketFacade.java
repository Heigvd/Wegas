/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.cp.IAtomicLong;
import com.hazelcast.cp.lock.FencedLock;
import com.pusher.rest.Pusher;
import com.pusher.rest.data.PresenceUser;
import com.pusher.rest.data.Result;
import com.wegas.core.Helper;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.DestroyedEntity;
import com.wegas.core.event.client.EntityDestroyedEvent;
import com.wegas.core.event.client.EntityUpdatedEvent;
import com.wegas.core.event.client.OutdatedEntitiesEvent;
import com.wegas.core.exception.client.WegasAccessDenied;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.PusherChannelExistenceWebhook;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.OnlineUser;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Serializable;
import java.lang.reflect.InvocationTargetException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPOutputStream;
import javax.cache.Cache;
import javax.cache.processor.EntryProcessor;
import javax.cache.processor.EntryProcessorException;
import javax.cache.processor.MutableEntry;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import jakarta.ejb.Asynchronous;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Yannick Lagger (lagger.yannick.com)
 */
@Stateless
@LocalBean
public class WebsocketFacade {

    private static final Logger logger = LoggerFactory.getLogger(WebsocketFacade.class);

    private final Pusher pusher;
    private Boolean maintainLocalListUpToDate;

    public final static String GLOBAL_CHANNEL = "global-channel";

    public final static String ROLE_CHANNEL_PREFIX = "private-Role-";
    public final static String ADMIN_CHANNEL = ROLE_CHANNEL_PREFIX + "Administrator";
    /**
     * Channel to send lobby related to all admins
     */
    public final static String ADMIN_LOBBY_CHANNEL = "private-LobbyAdministrator";

    public static final Pattern USER_CHANNEL_PATTERN = Pattern.compile(Helper.USER_CHANNEL_PREFIX + "(\\d+)");
    public static final Pattern PRIVATE_CHANNEL_PATTERN = Pattern.compile("private-(User|Player|Team|Game|GameModel)-(\\d+)");

    @Inject
    private Cache<Long, OnlineUser> onlineUsers;

    @Inject
    private HazelcastInstance hazelcastInstance;

    private static final String UPTODATE_KEY = "onlineUsersUpTpDate";
    private static final String LOCKNAME = "WebsocketFacade.onlineUsersLock";

    private static final int MAX_PUSHER_BODY_SIZE = 10240;

    public enum WegasStatus {
        DOWN,
        READY,
        OUTDATED
    }

    @Inject
    private GameModelFacade gameModelFacade;

    /**
     *
     */
    @Inject
    private UserFacade userFacade;

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
            tmp = new Pusher(appId, key, secret);
            tmp.setCluster(getProperty("pusher.cluster"));
            tmp.setEncrypted(true);
            pusher = tmp;
        } else {
            pusher = null;
        }
    }

    /**
     * Get all channels based on entities
     *
     * @param entities
     *
     * @return according to entities, all concerned channels
     */
    public List<String> getChannels(List<AbstractEntity> entities) {
        List<String> channels = new ArrayList<>();
        String channel = null;

        for (AbstractEntity entity : entities) {
            if (entity instanceof GameModel) {
                if (requestManager.hasGameModelReadRight((GameModel) entity)) {
                    channel = ((GameModel) entity).getChannel();
                }
            } else if (entity instanceof Game) {
                if (requestManager.hasGameReadRight((Game) entity)) {
                    channel = ((Game) entity).getChannel();
                }
            } else if (entity instanceof Team) {
                Team team = (Team) entity;
                userFacade.getCurrentUser();

                if (requestManager.hasTeamRight(team)) {
                    channel = ((Team) entity).getChannel();
                }
            } else if (entity instanceof Player) {
                Player player = (Player) entity;
                if (requestManager.hasPlayerRight(player)) {
                    channel = ((Player) entity).getChannel();
                }
            }

            if (channel != null) {
                channels.add(channel);
            }
        }
        return channels;
    }

    /**
     * Send lock to other users involved in the locked process
     *
     * @param channel the channel involved user listen to
     * @param token   token to lock
     */
    @Asynchronous
    public void sendLock(String channel, String token) {
        if (this.pusher != null) {
            logger.info("send lock  \"{}\" to \"{}\"", token, channel);
            try {
                pusher.trigger(channel, "LockEvent",
                    parseJSON("{\"@class\": \"LockEvent\", \"token\": \"" + token + "\", \"status\": \"lock\"}"), null);
            } catch (IOException ex) {
                logger.error("Fail to send lockEvent");
            }
        }
    }

    /**
     * Unlock the lock to involved users.
     *
     * @param channel the channel involved user listen to
     * @param token   token to unlock
     */
    @Asynchronous
    public void sendUnLock(String channel, String token) {
        if (this.pusher != null) {
            logger.info("send unlock  \"{}\" to \"{}\"", token, channel);
            try {
                pusher.trigger(channel, "LockEvent",
                    parseJSON("{\"@class\": \"LockEvent\", \"token\": \"" + token + "\", \"status\": \"unlock\"}"), null);
            } catch (IOException ex) {
                logger.error("Fail to send unlockEvent");
            }
        }
    }

    /**
     *
     * @param channel
     * @param status
     * @param socketId
     */
    public void sendLifeCycleEvent(String channel, WegasStatus status, final String socketId) {
        if (this.pusher != null) {
            try {
                pusher.trigger(channel, "LifeCycleEvent",
                    parseJSON("{\"@class\": \"LifeCycleEvent\", \"status\": \"" + status.toString() + "\"}"), socketId);
            } catch (IOException ex) {
                logger.error("Fails to parse json");
            }
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
            try {
                pusher.trigger(channel, "CustomEvent",
                    parseJSON("{\"@class\": \"CustomEvent\", \"type\": \"popupEvent\", \"payload\": {\"content\": \"<p>" + message + "</p>\"}}"), socketId);
            } catch (IOException ex) {
                logger.error("Fails to send custom event");
            }
        }
    }

    /**
     * @param channel
     * @param entity
     * @param socketId
     */
    public void sendLiveUpdate(String channel, String objectId, Object entity, final String socketId) {
        if (this.pusher != null) {
            try {
                pusher.trigger(channel, "CustomEvent",
                    parseJSON("{\"@class\": \"CustomEvent\", \"type\": \"" + objectId + ":LiveUpdate\", \"payload\": " + toJson(entity) + "}"), socketId);
            } catch (IOException ex) {
                logger.error("Fails to send custom event");
            }
        }
    }

    /**
     * @param property
     *
     * @return the property value
     */
    private String getProperty(String property) {
        try {
            return Helper.getWegasProperty(property);
        } catch (MissingResourceException ex) {
            logger.warn("Pusher init failed: missing {} property", property);
            return null;
        }
    }

    /**
     * @param data
     *
     * @return Status
     *
     * @throws IOException
     */
    public Integer send(String channel, String eventName, Object data) throws IOException {
        if (this.pusher == null) {
            return 400;
        } else if (requestManager.hasChannelPermission(channel)) {
            return pusher.trigger(channel, "CustomEvent",
                parseJSON("{\"@class\": \"CustomEvent\", \"type\": \"" + eventName + "\", \"payload\": " + toJson(data) + "}")
            ).getHttpStatus();
        } else {
            throw new WegasAccessDenied(channel, channel, null, requestManager.getCurrentUser());
        }
    }

    /**
     * fire and forget pusher events
     *
     * @param dispatchedEntities
     * @param destroyedEntities
     */
    public void onRequestCommit(final Map<String, List<AbstractEntity>> dispatchedEntities,
        final Map<String, List<AbstractEntity>> destroyedEntities) {
        this.onRequestCommit(dispatchedEntities, destroyedEntities, null);
    }

    /**
     * fire and forget pusher events
     *
     * @param dispatchedEntities
     * @param destroyedEntities
     * @param socketId           Client's socket id. Prevent that specific client to receive this
     *                           particular message
     */
    public void onRequestCommit(final Map<String, List<AbstractEntity>> dispatchedEntities,
        final Map<String, List<AbstractEntity>> destroyedEntities,
        final String socketId) {
        if (this.pusher == null) {
            return;
        }

        propagate(destroyedEntities, socketId, EntityDestroyedEvent.class);
        propagate(dispatchedEntities, socketId, EntityUpdatedEvent.class);
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
                     * Not possible to find an already destroyed entity, so, in this case (and since
                     * those informations are sufficient), only id and class name are propagated
                     */
                    for (AbstractEntity ae : toPropagate) {
                        refreshed.add(new DestroyedEntity(ae));
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
            logger.error("EVENT INSTANTIATION FAILS", ex);
        }
    }

    /**
     * Gzip some string
     *
     * @param data
     *
     * @return gzipped data, base64 encoded
     *
     * @throws IOException
     */
    private GzContent gzip(String channel, String name, String data, String socketId) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        GZIPOutputStream gzos = new GZIPOutputStream(baos);
        OutputStreamWriter osw = new OutputStreamWriter(gzos, "UTF-8");

        osw.append(data);
        osw.flush();
        osw.close();

        String b64 = Base64.getEncoder().encodeToString(baos.toByteArray());

        return new GzContent(channel, name, b64, socketId);
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
    }

    private int computeLength(GzContent gzip) {
        String data = gzip.getData();

        // "=" are converted to \u003d => + 5 chars for each "="
        // + two "
        return data.length() + StringUtils.countMatches(data, "=") * 5 + 2;
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
            GzContent gzip = gzip(audience, eventName, clientEvent.toJson(requestManager.getView()), socketId);
            String content = gzip.getData();

            int computedLength = computeLength(gzip);

            logger.trace("computedLength: " + computedLength);
            if (computedLength < MAX_PUSHER_BODY_SIZE) {

                //if (computedLength > 10240) {
                //    logger.error("413 MESSAGE TOO BIG");
                // wooops pusher error (too big)
                //    this.fallback(clientEvent, audience, socketId);
                //} else {
                Result result = pusher.trigger(audience, eventName, content, socketId);

                if (result == null) {
                    logger.error("Unexpected NULL pusher result");
                    this.fallback(clientEvent, audience, socketId);
                } else if (result.getHttpStatus() != null) {
                    if (result.getHttpStatus() == 403) {
                        logger.error("403 QUOTA REACHED");
                    } else if (result.getHttpStatus() == 413) {
                        logger.error("413 MESSAGE TOO BIG NOT DETECTED!!!!");
                        this.fallback(clientEvent, audience, socketId);
                    }
                } else {
                    logger.error("NO HTTP CODE: Result{status:{}. message{}}",
                        result.getStatus(),
                        result.getMessage());
                    // fallback or not fallback?
                    // As we have no status code, how to decide if the propagation was successful?
                    this.fallback(clientEvent, audience, socketId);
                }

            } else {
                logger.error("413 MESSAGE TOO BIG (Detected)");
                this.fallback(clientEvent, audience, socketId);
            }
            //}
        } catch (IOException ex) {
            logger.error("     IOEX <----------------------", ex);
        }
    }

    public void pageIndexUpdate(Long gameModelId, String socketId) {
        if (pusher != null) {
            GameModel gameModel = gameModelFacade.find(gameModelId);
            if (gameModel != null) {
                // gameModel may be if deleted
                pusher.trigger(gameModel.getChannel(), "PageIndexUpdate", "newIndex", socketId);
            }
        }
    }

    public void pageUpdate(Long gameModelId, String pageId, String socketId) {
        if (pusher != null && !pageId.equals("index")) {
            GameModel gameModel = gameModelFacade.find(gameModelId);
            pusher.trigger(gameModel.getChannel(), "PageUpdate", pageId, socketId);
        }
    }

    public void gameModelContentUpdate(GameModelContent content, String socketId) {
        if (pusher != null) {
            pusher.trigger(content.getGameModel().getChannel(), "LibraryUpdate-" + content.getLibraryType(), content.getContentKey(), socketId);
        }
    }

    /**
     * Inform connected users the given library has been destroyed
     *
     * @param content  the destroyed library
     * @param socketId socket Id which identifies the user who initiated the destruction
     */
    public void gameModelContentDestroy(GameModelContent content, String socketId) {
        if (pusher != null) {
            pusher.trigger(content.getGameModel().getChannel(), "LibraryDestroy-" + content.getLibraryType(), content.getContentKey(), socketId);
        }
    }

    public final Object parseJSON(String json) throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        return mapper.readValue(json, Object.class);
    }

    public final String toJson(Object o) throws IOException {
        ObjectMapper mapper = JacksonMapperProvider.getMapper();
        //ObjectWriter writerWithView = mapper.writerWithView(Views.class);
        ObjectWriter writer = mapper.writer();
        return writer.writeValueAsString(o);
    }

    public void populateQueueDec() throws IOException {
        if (pusher != null) {
            pusher.trigger(GLOBAL_CHANNEL, "populateQueue-dec", 1);
        }
    }

    public void propagateNewPlayer(Player newPlayer) {
        if (pusher != null) {
            User user = newPlayer.getUser();
            if (user != null) {
                try {
                    /* for (Entry<String, List<AbstractEntity>> entry :
                     * newPlayer.getGame().getEntities().entrySet()) { this.propagate(new
                     * EntityUpdatedEvent(entry.getValue()), entry.getKey(), null); } */

                    pusher.trigger(this.getChannelFromUserId(user.getId()), "team-update",
                        parseJSON(
                            // serialise with jackson to exlude unneeded properties
                            toJson(newPlayer.getTeam()
                            )));
                    this.propagate(newPlayer.getEntities(), null, EntityUpdatedEvent.class);
                } catch (IOException ex) {
                    logger.error("Error while propagating player");
                }
            }
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
     *
     * @return complete body to return to the client requesting authentication
     */
    public String pusherAuth(final String socketId, final String channel) {
        if (channel.startsWith("presence")) {
            final Map<String, String> userInfo = new HashMap<>();
            User user = userFacade.getCurrentUser();
            userInfo.put("name", user.getName());
            return pusher.authenticate(socketId, channel, new PresenceUser(user.getId(), userInfo));
        } else if (channel.equals(ADMIN_LOBBY_CHANNEL)) {
            // check authentication against std admin channel
            if (requestManager.hasChannelPermission(ADMIN_CHANNEL)) {
                return pusher.authenticate(socketId, channel);
            }
        } else if (channel.startsWith("private") && requestManager.hasChannelPermission(channel)) {
            return pusher.authenticate(socketId, channel);
        }
        return null;
    }

    private String getChannelFromUserId(long userId) {
        return Helper.USER_CHANNEL_PREFIX + userId;
    }

    private Long getUserIdFromChannel(String channelName) {
        Matcher matcher = USER_CHANNEL_PATTERN.matcher(channelName);

        if (matcher.matches() && matcher.groupCount() == 1) {
            return Long.parseLong(matcher.group(1));
        }
        return null;
    }

    private User getUserFromChannel(String channelName) {
        Long userId = this.getUserIdFromChannel(channelName);
        if (userId != null) {
            return userFacade.find(userId);
        } else {
            return null;
        }
    }

    /**
     * @param hook
     */
    public void pusherChannelExistenceWebhook(PusherChannelExistenceWebhook hook) {
        this.maintainLocalListUpToDate = true;
        initOnlineUsersIfRequired();
        if (hook.getName().equals("channel_occupied")) {
            User user = this.getUserFromChannel(hook.getChannel());
            if (user != null) {
                this.registerUser(user);
                userFacade.touchLastSeenAt(user);
            }
        } else if (hook.getName().equals("channel_vacated")) {
            Long userId = this.getUserIdFromChannel(hook.getChannel());
            if (userId != null) {
                onlineUsers.remove(userId);
                userFacade.touchLastSeenAt(userId);
            }
        }

        this.propagateOnlineUsers();
    }

    @Asynchronous
    public void touchOnlineUser(Long userId, Long playerId) {
        if (userId != null) {
            // do not use lambda since
            onlineUsers.invoke(userId, new OnlineUserToucher(playerId));
        }
    }

    /**
     * Return online users
     *
     * @return list a users who are online
     */
    public Collection<OnlineUser> getOnlineUsers() {
        requestManager.su();
        try {
            if (pusher != null) {
                initOnlineUsersIfRequired();
                return this.getLocalOnlineUsers();
            } else {
                return new ArrayList<>();
            }
        } finally {
            requestManager.releaseSu();
        }
    }

    public int getOnlineUserCount() {
        return this.getLocalOnlineUsers().size();
    }

    public Collection<OnlineUser> getLocalOnlineUsers() {
        Collection<OnlineUser> ou = new ArrayList<>();
        if (pusher != null) {
            Iterator<Cache.Entry<Long, OnlineUser>> iterator = onlineUsers.iterator();
            while (iterator.hasNext()) {
                ou.add(iterator.next().getValue());
            }
        }
        return ou;
    }

    /**
     * @param user
     * @param compareRoles
     *
     * @return true if user is member of at least on of the listed roles
     */
    private static boolean hasAnyRoles(User user, String... compareRoles) {
        Collection<Role> roles = user.getRoles();
        Iterator<Role> rIt = roles.iterator();
        while (rIt.hasNext()) {
            Role role = rIt.next();
            for (String r : compareRoles) {
                if (role.getName().toUpperCase().equals(r.toUpperCase())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * 0 means Admin, 1 Scenarist or Trainer, 2 Player and 3, Guest;
     *
     * @return king of role ranking... quite ugly...
     */
    private int getHighestRole(User user) {
        if (hasAnyRoles(user, "Administrator")) {
            return 0;
        } else if (hasAnyRoles(user, "Scenarist", "Trainer")) {
            return 1;
        } else {
            // Registeered Player or guest ?
            if (user.getMainAccount() instanceof GuestJpaAccount) {
                return 3;
            } else {
                return 2;
            }
        }
    }

    /**
     * Register user within internal onlineUser list
     *
     * @param user
     */
    private void registerUser(User user) {
        if (user != null && !onlineUsers.containsKey(user.getId())) {
            onlineUsers.put(user.getId(), new OnlineUser(user, getHighestRole(user)));
        }
    }

    /**
     * Build initial onlineUser list from pusher channels list
     */
    private void initOnlineUsersIfRequired() {
        if (pusher != null) {
            try {
                IAtomicLong onlineUsersUpToDate = hazelcastInstance.getCPSubsystem().getAtomicLong(UPTODATE_KEY);
                if (onlineUsersUpToDate.get() != 1l) {
                    // Get the Lock
                    FencedLock onlineUsersLock = hazelcastInstance.getCPSubsystem().getLock(LOCKNAME);
                    onlineUsersLock.lock();
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
                            // pusher hook maintains the list up to date
                            onlineUsersUpToDate.set(1);
                        } else {
                            // there is NO pusher hook to maintain the list up to date
                            onlineUsersUpToDate.set(0);
                        }
                    } finally {
                        onlineUsersLock.unlock();
                    }
                }
            } catch (IOException ex) {
                logger.error("InitOnlineUser", ex);
            }
        }
    }

    /**
     * Build initial onlineUser list from pusher channels list
     */
    public void syncOnlineUsers() {
        if (pusher != null) {
            try {
                Result get = pusher.get("/channels");
                String message = get.getMessage();

                ObjectMapper mapper = JacksonMapperProvider.getMapper();
                HashMap<String, HashMap<String, Object>> readValue = mapper.readValue(message, HashMap.class);
                HashMap<String, Object> channels = readValue.get("channels");

                /*
                 * Assert all online users are in the local list
                 */
                for (String channel : channels.keySet()) {
                    this.registerUser(this.getUserFromChannel(channel));
                }

                /*
                 * Detect no longer online user still in the local list and remove them
                 */
                Iterator<Cache.Entry<Long, OnlineUser>> it = onlineUsers.iterator();
                while (it.hasNext()) {
                    Cache.Entry<Long, OnlineUser> next = it.next();
                    if (next.getKey() != null && !channels.containsKey(getChannelFromUserId(next.getKey()))) {
                        it.remove();
                    }
                }

                if (maintainLocalListUpToDate) {
                    IAtomicLong onlineUsersUpToDate = hazelcastInstance.getCPSubsystem().getAtomicLong(UPTODATE_KEY);
                    onlineUsersUpToDate.set(1);
                }

            } catch (IOException ex) {
                logger.error("SyncOnlineUser", ex);
            }
        }
    }

    /**
     * Say to admin's who are currently logged in that some users connect or disconnect
     */
    private void propagateOnlineUsers() {
        pusher.trigger(WebsocketFacade.ADMIN_LOBBY_CHANNEL, "online-users", "");
    }

    public void clearOnlineUsers() {
        FencedLock onlineUsersLock = hazelcastInstance.getCPSubsystem().getLock(LOCKNAME);
        onlineUsersLock.lock();
        try {
            IAtomicLong onlineUsersUpToDate = hazelcastInstance.getCPSubsystem().getAtomicLong(UPTODATE_KEY);
            onlineUsers.clear();
            onlineUsersUpToDate.set(0);
        } finally {
            onlineUsersLock.unlock();
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

    /**
     * Atomic EntryProcessor to update a OnlineUer lastActivity time.
     * <p>
     * One SHALL NOT convert this to a lamba expression (unless the lamba is serializable)
     */
    public static class OnlineUserToucher implements EntryProcessor<Long, OnlineUser, Object>, Serializable {

        private static final long serialVersionUID = 1L;
        private final Long playerId;

        public OnlineUserToucher(Long playerId) {
            this.playerId = playerId;
        }

        @Override
        public Object process(MutableEntry<Long, OnlineUser> entry, Object... arguments) throws EntryProcessorException {
            if (entry != null && playerId != null) {
                OnlineUser value = entry.getValue();
                if (value != null) {
                    value.touch(playerId);
                    entry.setValue(value);
                }
            }
            return null;
        }
    }
}
