/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.messaging.ejb;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Player;
import com.wegas.messaging.persistence.Message;
import java.util.Date;
import java.util.Properties;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.mail.*;
import javax.mail.Message.RecipientType;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import org.slf4j.LoggerFactory;

/**
 * @fixme @important The mail should be sent in an async queue, so they don't
 * hang the reply endlessly
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class EMailFacade {

    static final private org.slf4j.Logger logger = LoggerFactory.getLogger(EMailFacade.class);

    /**
     *
     * @param to
     * @param from
     * @param subject
     * @param body
     * @param toType
     * @param mimetype
     * @throws javax.mail.MessagingException when something went wrong
     */
    public void send(String to, String from, String replyTo,
            String subject, String body, RecipientType toType, String mimetype) throws MessagingException {

        Properties props = new Properties();
        final String username = Helper.getWegasProperty("mail.smtp.username");
        final String password = Helper.getWegasProperty("mail.smtp.password");

        props.put("mail.smtp.host", Helper.getWegasProperty("mail.smtp.host"));           // Attaching to default Session, or we could start a new one

        props.setProperty("mail.smtp.auth", Helper.getWegasProperty("mail.smtp.auth"));
        props.put("mail.smtp.port", Helper.getWegasProperty("mail.smtp.port"));
        if (Helper.getWegasProperty("mail.smtp.starttls.enable").equals("true")) {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.ssl.trust", Helper.getWegasProperty("mail.smtp.host"));
        } else {
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.port", Helper.getWegasProperty("mail.smtp.port"));
            props.put("mail.smtp.ssl.trust", Helper.getWegasProperty("mail.smtp.host"));
        }

        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });

        javax.mail.Message msg = new MimeMessage(session);

        if (replyTo != null){
            msg.setHeader("Reply-To", replyTo);
        }
        msg.setFrom(new InternetAddress(from));
        msg.setRecipients(toType, InternetAddress.parse(to, false));
        msg.setSubject(subject);
        msg.setContent(body, mimetype);
        msg.setSentDate(new Date());
        Transport.send(msg);
    }

    /**
     * @deprecated 
     *
     * @param p
     * @param from
     * @param subject
     * @param body
     */
    public void send(Player p, String from, String subject, String body) throws MessagingException {
        this.send(p.getUser().getName(), from, null, subject, body, RecipientType.TO, "text/plain");
    }

    /**
     * @deprecated 
     * @param p
     * @param msg
     */
    public void send(Player p, Message msg) throws MessagingException {
        this.send(p, "admin@wegas.com", msg.getSubject(), msg.getBody());
    }

    /**
     *
     * @param messageEvent
     */
    public void listener(@Observes MessageEvent messageEvent) {
        // @fixme remove this hardcoded condition w/ some db values or at least a line in the prop file
//        if (messageEvent.getType().equals("important")) {
//            this.send("fx@red-agent.com", "admin@wegas.com",
//                    messageEvent.getMessage().getSubject(),
//                    messageEvent.getMessage().getBody());
//        }
    }
}
