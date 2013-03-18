package com.wegas.core.websocket.pusher;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.math.BigInteger;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.apache.http.client.ClientProtocolException;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.protocol.BasicHttpContext;
import org.apache.http.protocol.HttpContext;
import org.apache.http.util.EntityUtils;

/**
 * Static class to send messages to Pusher's REST API.
 *
 * Please set pusherApplicationId, pusherApplicationKey, pusherApplicationSecret
 * accordingly before sending any request.
 *
 * @author Stephan Scheuermann Copyright 2010. Licensed under the MIT license:
 * http://www.opensource.org/licenses/mit-license.php
 */
public class Pusher {

    /**
     * Pusher Host name
     */
    private final static String pusherHost = "api.pusherapp.com";
    /**
     * Pusher Application Identifier
     */
    private final static String pusherApplicationId = "38862";
    /**
     * Pusher Application Key
     */
    private final static String pusherApplicationKey = "732a1df75d93d028e4f9";
    /**
     * Pusher Secret
     */
    private final static String pusherApplicationSecret = "a20a04b96f53cd10af77";

    /**
     * Converts a byte array to a string representation
     *
     * @param data
     * @return
     */
    private static String byteArrayToString(byte[] data) {
        BigInteger bigInteger = new BigInteger(1, data);
        String hash = bigInteger.toString(16);
        // Zero pad it
        while (hash.length() < 32) {
            hash = "0" + hash;
        }
        return hash;
    }

    /**
     * Returns a md5 representation of the given string
     *
     * @param data
     * @return
     */
    private static String md5Representation(String data) {
        try {
            //Get MD5 MessageDigest
            MessageDigest messageDigest = MessageDigest.getInstance("MD5");
            byte[] digest = messageDigest.digest(data.getBytes("US-ASCII"));
            return byteArrayToString(digest);
        } catch (NoSuchAlgorithmException nsae) {
            //We should never come here, because GAE has a MD5 algorithm
            throw new RuntimeException("No MD5 algorithm");
        } catch (UnsupportedEncodingException e) {
            //We should never come here, because UTF-8 should be available
            throw new RuntimeException("No UTF-8");
        }
    }

    /**
     * Returns a HMAC/SHA256 representation of the given string
     *
     * @param data
     * @return
     */
    private static String hmacsha256Representation(String data) {
        try {
            // Create the HMAC/SHA256 key from application secret
            final SecretKeySpec signingKey = new SecretKeySpec(pusherApplicationSecret.getBytes(), "HmacSHA256");

            // Create the message authentication code (MAC)
            final Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(signingKey);

            //Process and return data
            byte[] digest = mac.doFinal(data.getBytes("UTF-8"));
            digest = mac.doFinal(data.getBytes());
            //Convert to string
            BigInteger bigInteger = new BigInteger(1, digest);
            return String.format("%0" + (digest.length << 1) + "x", bigInteger);
        } catch (NoSuchAlgorithmException nsae) {
            //We should never come here, because GAE has HMac SHA256
            throw new RuntimeException("No HMac SHA256 algorithm");
        } catch (UnsupportedEncodingException e) {
            //We should never come here, because UTF-8 should be available
            throw new RuntimeException("No UTF-8");
        } catch (InvalidKeyException e) {
            throw new RuntimeException("Invalid key exception while converting to HMac SHA256");
        }
    }

    /**
     * Build query string that will be appended to the URI and HMAC/SHA256
     * encoded
     *
     * @param eventName
     * @param jsonData
     * @return
     */
    private static String buildQuery(String eventName, String jsonData, String socketID) {
        StringBuffer buffer = new StringBuffer();
        //Auth_Key
        buffer.append("auth_key=");
        buffer.append(pusherApplicationKey);
        //Timestamp
        buffer.append("&auth_timestamp=");
        buffer.append(System.currentTimeMillis() / 1000);
        //Auth_version
        buffer.append("&auth_version=1.0");
        //MD5 body
        buffer.append("&body_md5=");
        buffer.append(md5Representation(jsonData));
        //Event Name
        buffer.append("&name=");
        buffer.append(eventName);
        //Append socket id if set
        if (!socketID.isEmpty()) {
            buffer.append("&socket_id=");
            buffer.append(socketID);
        }
        //Return content of buffer
        return buffer.toString();
    }

    /**
     * Build path of the URI that is also required for Authentication
     *
     * @return
     */
    private static String buildURIPath(String channelName) {
        StringBuffer buffer = new StringBuffer();
        //Application ID
        buffer.append("/apps/");
        buffer.append(pusherApplicationId);
        //Channel name
        buffer.append("/channels/");
        buffer.append(channelName);
        //Event
        buffer.append("/events");
        //Return content of buffer
        return buffer.toString();
    }

    /**
     * Build authentication signature to assure that our event is recognized by
     * Pusher
     *
     * @param uriPath
     * @param query
     * @return
     */
    private static String buildAuthenticationSignature(String uriPath, String query) {
        StringBuffer buffer = new StringBuffer();
        //request method
        buffer.append("POST\n");
        //URI Path
        buffer.append(uriPath);
        buffer.append("\n");
        //Query string
        buffer.append(query);
        //Encode data
        String h = buffer.toString();
        return hmacsha256Representation(h);
    }

    /**
     * Build URI where request is send to
     *
     * @param uriPath
     * @param query
     * @param signature
     * @return
     */
    private static String buildURI(String uriPath, String query, String signature) {
        StringBuffer buffer = new StringBuffer();
        //Protocol
        buffer.append("http://");
        //Host
        buffer.append(pusherHost);
        //URI Path
        buffer.append(uriPath);
        //Query string
        buffer.append("?");
        buffer.append(query);
        //Authentication signature
        buffer.append("&auth_signature=");
        buffer.append(signature);
        return buffer.toString();
    }

    /**
     * Delivers a message to the Pusher API without providing a socket_id
     *
     * @param channel
     * @param event
     * @param jsonData
     * @return
     * @throws IOException
     * @throws ClientProtocolException
     */
    public static String triggerPush(String channel, String event, String jsonData) throws ClientProtocolException, IOException {
        return triggerPush(channel, event, jsonData, "");
    }

    /**
     * Delivers a message to the Pusher API
     *
     * @param channel
     * @param event
     * @param jsonData
     * @param socketId
     * @return
     * @throws IOException
     * @throws ClientProtocolException
     */
    public static String triggerPush(String channel, String event, String jsonData, String socketId) throws ClientProtocolException, IOException {
        //Build URI path
        String uriPath = buildURIPath(channel);
        //Build query
        String query = buildQuery(event, jsonData, socketId);
        //Generate signature
        String signature = buildAuthenticationSignature(uriPath, query);
        //Build URI
        String url = buildURI(uriPath, query, signature);


        DefaultHttpClient httpClient = new DefaultHttpClient();
        HttpContext cntxt = new BasicHttpContext();

        HttpPost httpPost = new HttpPost(url);
        httpPost.addHeader("Content-Type", "application/json");
        httpPost.setEntity(new StringEntity(jsonData));
        org.apache.http.HttpResponse httpResponse = httpClient.execute(httpPost);

        //Start request
        try {
            return EntityUtils.toString(httpResponse.getEntity());
        } catch (IOException e) {
            //Log warning
            return null;
        }
    }
}