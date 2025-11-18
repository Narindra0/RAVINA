FROM php:8.2-apache

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    APP_DIR=/var/www/html \
    APACHE_DOCUMENT_ROOT=/var/www/html/public

# Configure Apache document root & enable rewrite
RUN set -eux; \
    sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf; \
    sed -ri 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf; \
    a2enmod rewrite

# Install system packages and PHP extensions
RUN set -eux; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
        default-mysql-client \
        default-libmysqlclient-dev \
        git \
        unzip; \
    docker-php-ext-install pdo_mysql; \
    rm -rf /var/lib/apt/lists/*

WORKDIR ${APP_DIR}

# Copy composer files from backend to leverage caching
COPY backend/composer.json backend/composer.lock ./

# Install Composer (if not already present) and dependencies
RUN set -eux; \
    if ! command -v composer > /dev/null; then \
        curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer; \
    fi; \
    composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction

# Copy the rest of the backend source code
COPY backend/ .

# Ensure writable directories belong to www-data
RUN set -eux; \
    chown -R www-data:www-data var public/uploads || true

EXPOSE 80

CMD ["apache2-foreground"]

