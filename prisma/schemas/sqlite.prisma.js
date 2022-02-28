module.exports = {
    prefix:  `// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"`,
    postfix: `}

model KeyStore {
  uuid      String   @unique
  active    Boolean  @default(true)
  data      String
}
`
};
