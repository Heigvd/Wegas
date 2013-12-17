<%@page contentType="text/html" pageEncoding="ISO-8859-1" import="org.apache.shiro.crypto.hash.Sha256Hash, org.apache.shiro.util.SimpleByteSource"%>
<!DOCTYPE html>
<%
String salt = "sdfewtfsd324324dsfcvx";
Sha256Hash sha256Hash = new Sha256Hash("testuser", ( new SimpleByteSource(salt) ).getBytes());
        String result = sha256Hash.toHex();
        out.println(result);
%>