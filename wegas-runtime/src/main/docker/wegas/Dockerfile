#FROM adoptopenjdk/openjdk11:alpine-jre
FROM eclipse-temurin:17-jre-jammy
LABEL org.opencontainers.image.source https://github.com/heigvd/wegas

ENV HEAP=1100m

ENV WORKDIR=/opt/wegas

# connection to postrgres
ENV DB_HOST=
ENV DB_PORT=5432
ENV DB_NAME=wegas_dev
ENV DB_USER=user
ENV DB_PASSWORD=1234

# connection to mongo
ENV MONGO_HOST=

# Java config
ENV GC=G1GC
ENV NB_THREADS=9
ENV NB_POPULATORS=3
ENV DEBUG=false
ENV DEBUG_PORT=9009

# Payara config
ENV THE_WAR=${WORKDIR}/ROOT.war
ENV PAYARA_MICRO=${WORKDIR}/payara-micro.jar

ENV INTERFACES=10.*.*.*
ENV CLUSTER_MODE=

ENV HAZELCAST_SHUTDOWN_HOOK=false
ENV HZ_CLUSTER_NAME=hazelcast_wegas_cluster

ENV HTTP_PORT=80
ENV SSL_PORT=443

# Wegas Config
ENV WEGAS_PROPERTIES=/var/lib/wegas/wegas.properties
ENV PATCH_WEGAS_PROPERTIES=false


# Create image

RUN update-ca-certificates

RUN mkdir -p $WORKDIR
WORKDIR $WORKDIR

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install iproute2 --yes && rm -rf /var/lib/apt/lists/*
RUN adduser --disabled-password --home $WORKDIR payara && chown -R payara:payara /opt

VOLUME /var/lib/wegas/

# RUN apk add --update curl && \
#     rm -rf /var/cache/apk/*

COPY as_prebootcmd .
COPY run .
COPY payara-micro.current.jar payara-micro.jar
COPY Wegas.war ROOT.war

RUN chown -R payara:payara .
RUN chmod +x ./run

USER payara

CMD ["./run"]

# Default payara ports to expose 8080 8181
EXPOSE 80 443 6900

#HEALTHCHECK CMD curl -f localhost:8080/Wegas/ || exit 1
