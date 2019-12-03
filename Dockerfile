FROM ubuntu:16.04

RUN apt-get update \
    && apt-get -y upgrade \
    && apt-get -y install wget openjdk-8-jdk unzip curl gnupg \
    && curl -sL https://deb.nodesource.com/setup_10.x  | bash - \
    && apt-get -y install nodejs \
    && rm -rf /var/lib/apt/lists/*

ENV JAVA_HOME /usr/lib/jvm/java-8-openjdk-amd64/
ENV PATH $JAVA_HOME/bin:$PATH

WORKDIR /mcash/app

# Install proxy dependencies
COPY app/package.json .
RUN npm install
COPY app .
RUN npm run build

# Configures full node
WORKDIR /mcash/FullNode
COPY bin/config-local.conf ./config.conf
COPY bin/FullNode.jar .

COPY scripts /mcash/scripts

COPY entrypoint.sh /

EXPOSE 13399

ENTRYPOINT ["/entrypoint.sh"]

