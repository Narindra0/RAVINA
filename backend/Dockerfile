FROM php:8.2-apache

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    APACHE_DOCUMENT_ROOT=/var/www/html/public

# Configure Apache document root
RUN set -eux; \
    sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf; \
    sed -ri 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf; \
    a2enmod rewrite

# Install required packages and PHP extensions
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        default-mysql-client \
        default-libmysqlclient-dev \
        git \
        unzip; \
    docker-php-ext-install pdo_mysql; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN set -eux; \
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer; \
    composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

COPY . .

RUN set -eux; \
    chown -R www-data:www-data /var/www/html/var /var/www/html/public/uploads || true

EXPOSE 80

CMD ["apache2-foreground"]

