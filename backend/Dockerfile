ARG PHP_VERSION=8.4

FROM php:${PHP_VERSION}-cli AS base

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    APP_ENV=prod \
    APP_DEBUG=0

RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        git \
        unzip \
        libicu-dev \
        libzip-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libonig-dev \
        default-mysql-client \
    ; \
    docker-php-ext-configure gd --with-freetype --with-jpeg; \
    docker-php-ext-install -j"$(nproc)" \
        intl \
        gd \
        zip \
        pdo_mysql \
        opcache \
    ; \
    rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

COPY composer.json composer.lock symfony.lock ./

# On évite l'échec des auto-scripts (cache:clear) pendant le build Railway
RUN composer install \
        --no-dev \
        --no-interaction \
        --optimize-autoloader \
        --no-scripts \
        --prefer-dist

COPY . .

RUN composer dump-autoload --optimize

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "-t", "public", "public/index.php"]

