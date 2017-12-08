FROM quay.io/ukhomeofficedigital/openjdk8

RUN rpm -Uvh https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm
RUN rpm -Uvh https://mirror.webtatic.com/yum/el7/webtatic-release.rpm
RUN yum update -y
RUN yum -y install php56w php56w-fpm php56w-opcache php56w-intl php56w-common php56w-pear php56w-pdo php56w-dom git nginx

RUN curl https://curl.haxx.se/ca/cacert.pem > /etc/ssl/certs/cacert.pem
RUN echo >> /etc/ssl/certs/cacert.pem

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

RUN yum -y install ruby ruby-rdoc ruby-devel gcc make automake autoconf
RUN gem update --system && gem install --no-rdoc --no-ri compass --version 0.12.7
RUN ln -s /usr/local/bin/compass /usr/bin/compass

COPY assets/symfony.conf /etc/nginx/sites-available/
COPY assets/php.ini /etc/php.ini
COPY assets/nginx.conf /etc/nginx/

RUN mkdir /etc/nginx/sites-enabled
RUN ln -s /etc/nginx/sites-available/symfony.conf /etc/nginx/sites-enabled/symfony

COPY frontend /var/www/symfony

WORKDIR /var/www/symfony

RUN composer install
RUN bin/console assets:install --symlink
RUN bin/console assetic:dump

RUN useradd www-data
RUN usermod -u 1000 www-data
RUN chown -R www-data:www-data /var/www/symfony/var/cache /var/www/symfony/var/logs
RUN chmod -R 777 /var/www/symfony/var/cache /var/www/symfony/var/logs

# Dummy file to work in docker-compose
RUN mkdir /data
RUN touch /data/hocs-ui-ca.pem

COPY assets/entrypoint.sh entrypoint.sh
RUN chmod +x  entrypoint.sh
ENTRYPOINT ["./entrypoint.sh"]

CMD cat /data/hocs-ui-ca.pem >> /etc/ssl/certs/cacert.pem && php-fpm && nginx

EXPOSE 8080