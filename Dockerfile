FROM oven/bun:1

WORKDIR /app

COPY package.json ./

COPY . .

RUN bun install


CMD ["bun", "run", "dev"]