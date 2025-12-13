# Use Apify's Playwright Chrome image (browsers pre-installed)
FROM apify/actor-node-playwright-chrome:20

COPY package*.json ./
RUN npm install --omit=dev --omit=optional

COPY . ./
CMD ["npm", "start"]
