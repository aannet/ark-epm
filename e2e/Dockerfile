FROM mcr.microsoft.com/playwright:v1.41.0-jammy

WORKDIR /e2e

COPY package*.json ./
RUN npm ci

# Installer wait-on pour attendre les services
RUN npm install -g wait-on

# Créer le dossier pour les rapports
RUN mkdir -p reports/html

# Télécharger les navigateurs
RUN npx playwright install chromium

COPY . .

# Entrypoint par défaut - attente des services puis exécution
CMD ["npm", "test"]
