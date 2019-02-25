/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.IAtomicLong;
import com.hazelcast.core.ILock;
import com.pusher.rest.Pusher;
import com.pusher.rest.data.PresenceUser;
import com.pusher.rest.data.Result;
import com.wegas.core.Helper;
import com.wegas.core.event.client.*;
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
import fish.payara.micro.cdi.Inbound;
import fish.payara.micro.cdi.Outbound;
import io.prometheus.client.Gauge;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Serializable;
import java.lang.reflect.InvocationTargetException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.Map.Entry;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.zip.GZIPOutputStream;
import javax.cache.Cache;
import javax.cache.processor.EntryProcessor;
import javax.cache.processor.EntryProcessorException;
import javax.cache.processor.MutableEntry;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import javax.ejb.Asynchronous;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Yannick Lagger (lagger.yannick.com)
 */
@Stateless
@LocalBean
public class WebsocketFacade {

    private static final Gauge onlineUsersGauge = Gauge.build().name("online_users").help("Number of onlineusers").register();

    private static final Logger logger = LoggerFactory.getLogger(WebsocketFacade.class);

    private final Pusher pusher;
    private Boolean maintainLocalListUpToDate;

    public final static String GLOBAL_CHANNEL = "global-channel";
    public final static String ADMIN_CHANNEL = "private-Role-Administrator";

    public static final Pattern USER_CHANNEL_PATTERN = Pattern.compile(Helper.USER_CHANNEL_PREFIX + "(\\d+)");
    public static final Pattern PRIVATE_CHANNEL_PATTERN = Pattern.compile("private-(User|Player|Team|Game|GameModel)-(\\d+)");

    @Inject
    private Cache<Long, OnlineUser> onlineUsers;

    @Inject
    private HazelcastInstance hazelcastInstance;

    private static final String COMMANDS_EVENT = "WF_UPDATE_OU_METRIC";
    private static final String UPDATE_OU_METRIC_CMD = "WF_UPDATE_OU_METRIC";

    @Inject
    @Outbound(eventName = COMMANDS_EVENT, loopBack = true)
    private Event<String> commands;

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
            tmp = new Pusher(appId, key, secret);
            tmp.setCluster(getProperty("pusher.cluster"));
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
                User user = userFacade.getCurrentUser();

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

    public void sendLock(String channel, String token) {
        if (this.pusher != null) {
            logger.info("send lock  \"{}\" to \"{}\"", token, channel);
            pusher.trigger(channel, "LockEvent",
                    "{\"@class\": \"LockEvent\", \"token\": \"" + token + "\", \"status\": \"lock\"}", null);
        }
    }

    public void sendUnLock(String channel, String token) {
        if (this.pusher != null) {
            logger.info("send unlock  \"{}\" to \"{}\"", token, channel);
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
     * @param filter
     * @param entityType
     * @param entityId
     * @param data
     *
     * @return Status
     *
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
     * @param socketId           Client's socket id. Prevent that specific
     *                           client to receive this particular message
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
                     * Not possible to find an already destroyed entity, so, in
                     * this case (and since those informations are sufficient),
                     * only id and class name are propagated
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
            logger.error("EVENT INSTANTIATION FAILS");
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
            GzContent gzip = gzip(audience, eventName, clientEvent.toJson(), socketId);
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

                if (result.getHttpStatus() == 403) {
                    logger.error("403 QUOTA REACHED");
                } else if (result.getHttpStatus() == 413) {
                    logger.error("413 MESSAGE TOO BIG NOT DETECTED!!!!");
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
            pusher.trigger(gameModel.getChannel(), "PageIndexUpdate", "newIndex", socketId);
        }
    }

    public void pageUpdate(Long gameModelId, String pageId, String socketId) {
        if (pusher != null) {
            GameModel gameModel = gameModelFacade.find(gameModelId);
            pusher.trigger(gameModel.getChannel(), "PageUpdate", pageId, socketId);
        }
    }

    public void gameModelContentUpdate(GameModelContent content, String socketId) {
        if (pusher != null) {
            pusher.trigger(content.getGameModel().getChannel(), "LibraryUpdate-" + content.getLibraryType(), content.getContentKey(), socketId);
        }
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
                    for (Entry<String, List<AbstractEntity>> entry : newPlayer.getGame().getEntities().entrySet()) {
                        this.propagate(new EntityUpdatedEvent(entry.getValue()), entry.getKey(), null);
                    }

                    pusher.trigger(this.getChannelFromUserId(user.getId()), "team-update", toJson(newPlayer.getTeam()));
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
        }
        if (channel.startsWith("private")) {
            if (requestManager.hasChannelPermission(channel)) {
                return pusher.authenticate(socketId, channel);
            }
        }
        return null;
    }

    private String getChannelFromUserId(long userId) {
        return Helper.USER_CHANNEL_PREFIX + userId;
    }

    private Long getUserIdFromChannel(String channelName) {
        Matcher matcher = USER_CHANNEL_PATTERN.matcher(channelName);

        if (matcher.matches()) {
            if (matcher.groupCount() == 1) {
                return Long.parseLong(matcher.group(1));
            }
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
        ILock onlineUsersLock = hazelcastInstance.getLock(LOCKNAME);
        onlineUsersLock.lock();
        this.maintainLocalListUpToDate = true;
        try {
            IAtomicLong onlineUsersUpToDate = hazelcastInstance.getAtomicLong(UPTODATE_KEY);
            if (onlineUsersUpToDate.get() == 0) {
                initOnlineUsers();
            }
            if (hook.getName().equals("channel_occupied")) {
                User user = this.getUserFromChannel(hook.getChannel());
                if (user != null) {
                    this.registerUser(user);
                }
            } else if (hook.getName().equals("channel_vacated")) {
                Long userId = this.getUserIdFromChannel(hook.getChannel());
                if (userId != null) {
                    onlineUsers.remove(userId);
                    updateOnlineUserMetric();
                }
            }

            this.propagateOnlineUsers();
        } finally {
            onlineUsersLock.unlock();
        }
    }

    @Asynchronous
    public void touchOnlineUser(Long userId) {
        if (userId != null) {
            // do not use lambda since
            onlineUsers.invoke(userId, new OnlineUserToucher());
        }
    }

    /**
     * Return online users
     *
     * @return list a users who are online
     */
    public Collection<OnlineUser> getOnlineUsers() {
        if (pusher != null) {
            ILock onlineUsersLock = hazelcastInstance.getLock(LOCKNAME);
            onlineUsersLock.lock();
            try {
                IAtomicLong onlineUsersUpToDate = hazelcastInstance.getAtomicLong(UPTODATE_KEY);
                if (onlineUsersUpToDate.get() == 0) {
                    initOnlineUsers();
                }
                return this.getLocalOnlineUsers();
            } finally {
                onlineUsersLock.unlock();
            }
        } else {
            return new ArrayList<>();
        }
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

            IAtomicLong onlineUsersUpToDate = hazelcastInstance.getAtomicLong(UPTODATE_KEY);
            if (onlineUsersUpToDate.get() == 1) {
                updateOnlineUserMetric();
            }
        }
    }

    /**
     * Build initial onlineUser list from pusher channels list
     */
    private void initOnlineUsers() {
        if (pusher != null) {
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
                    IAtomicLong onlineUsersUpToDate = hazelcastInstance.getAtomicLong(UPTODATE_KEY);
                    onlineUsersUpToDate.set(1);
                }

                updateOnlineUserMetric();

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
                 * Detect no longer online user still in the local list
                 * and remove them
                 */
                Iterator<Cache.Entry<Long, OnlineUser>> it = onlineUsers.iterator();
                while (it.hasNext()) {
                    Cache.Entry<Long, OnlineUser> next = it.next();
                    if (next.getKey() != null) {
                        if (!channels.containsKey(getChannelFromUserId(next.getKey()))) {
                            it.remove();
                        }
                    }
                }

                updateOnlineUserMetric();

                if (maintainLocalListUpToDate) {
                    IAtomicLong onlineUsersUpToDate = hazelcastInstance.getAtomicLong(UPTODATE_KEY);
                    onlineUsersUpToDate.set(1);
                }

            } catch (IOException ex) {
                logger.error("SyncOnlineUser", ex);
            }
        }
    }

    /**
     * Say to admin's who are currently logged in that some users connect or
     * disconnect
     */
    private void propagateOnlineUsers() {
        Result trigger = pusher.trigger(WebsocketFacade.ADMIN_CHANNEL, "online-users", "");
    }

    public void clearOnlineUsers() {
        ILock onlineUsersLock = hazelcastInstance.getLock(LOCKNAME);
        onlineUsersLock.lock();
        try {
            IAtomicLong onlineUsersUpToDate = hazelcastInstance.getAtomicLong(UPTODATE_KEY);
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

    public void updateOnlineUserMetric() {
        commands.fire(UPDATE_OU_METRIC_CMD);
    }

    public void onOnlineUserMetric(@Inbound(eventName = COMMANDS_EVENT) @Observes String command) {
        if (UPDATE_OU_METRIC_CMD.equals(command)) {
            onlineUsersGauge.set(this.getLocalOnlineUsers().size());
        }
    }

    /**
     * Atomic EntryProcessor to update a OnlineUer lastActivity time.
     * <p>
     * One SHALL NOT convert this to a lamba expression (unless the lamba is serializable)
     */
    public static class OnlineUserToucher implements EntryProcessor<Long, OnlineUser, Object>, Serializable {

        private static final long serialVersionUID = 1L;

        @Override
        public Object process(MutableEntry<Long, OnlineUser> entry, Object... arguments) throws EntryProcessorException {
            if (entry != null) {
                OnlineUser value = entry.getValue();
                if (value != null) {
                    value.touch();
                    entry.setValue(value);
                }
            }
            return null;
        }
    }
}
