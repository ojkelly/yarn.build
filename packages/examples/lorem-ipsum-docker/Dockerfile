# Production image, copy all the files and run next
FROM node:17-alpine

RUN apk add --update \
  curl \
  && rm -rf /var/cache/apk/*

ENV NODE_ENV production

RUN corepack enable

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs

EXPOSE 3000

ENV PORT 3000

COPY ./ /app

CMD ["yarn", "workspace", "@internal/lorem-ipsum", "start"]
