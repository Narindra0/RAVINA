FROM php:8.3-apache

ENV APP_ENV=prod \
    COMPOSER_ALLOW_SUPERUSER=1 \
    DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        default-mysql-client \
        libzip-dev \
        unzip \
        git \
    && docker-php-ext-install pdo_mysql \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

COPY composer.json composer.lock symfony.lock ./

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer \
    && composer install --no-dev --optimize-autoloader --no-interaction --no-progress

COPY . .

RUN composer dump-autoload --optimize \
    && a2enmod rewrite \
    && chown -R www-data:www-data var public

EXPOSE 8080

CMD ["sh", "-c", "php -d variables_order=EGPCS -S 0.0.0.0:${PORT:-8080} -t public"]

