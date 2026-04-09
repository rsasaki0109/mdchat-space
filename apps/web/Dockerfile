FROM node:22-alpine AS build

WORKDIR /repo

COPY package.json package-lock.json ./
COPY apps/web ./apps/web

RUN npm ci

ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build:web

FROM node:22-alpine AS runner

WORKDIR /repo

ENV NODE_ENV=production

COPY --from=build /repo/package.json /repo/package-lock.json ./
COPY --from=build /repo/apps/web ./apps/web
COPY --from=build /repo/node_modules ./node_modules

EXPOSE 3000

WORKDIR /repo
CMD ["npm", "--workspace", "apps/web", "run", "start"]
