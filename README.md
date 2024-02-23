# Bitwise

This project is setup with [nx](https://nx.dev/) a new tool found in the wild.

- [Bitwise](#bitwise)
- [How to run](#how-to-run)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Development](#development)
- [Other questions](#other-questions)
  - [Adding new packages](#adding-new-packages)
  - [Schemas](#schemas)
  - [The terminal output is messed up](#the-terminal-output-is-messed-up)
  - [Deleting `.nx` folder](#deleting-nx-folder)
  - [The backend is too slow to update changes after save](#the-backend-is-too-slow-to-update-changes-after-save)
  - [Seeding database](#seeding-database)
- [Useful commands](#useful-commands)
- [API Response formats](#api-response-formats)
- [References](#references)

# How to run

## Prerequisites

- node >= 18
- pnpm >= 8
- docker >= 25

## Setup

- In the project root, run to install the dependencies.
  ```bash
  pnpm install
  ```
- Run this generate the typescript types for our schemas.
  ```bash
  pnpm prisma generate
  ```

## Development

- Make `Prettier` your default formatter in your editor.
- ```bash
  cp .example.env .env
  ```
  Add the required fields in `.env`.
- In the project root, run to start the db.

  ```bash
  docker compose up

  # alternatively you can use this command to run in detached mode
  docker compose up -d
  ```

- Optionally to seed the db, run

  ```bash
  pnpm prisma db seed
  ```

- Once the db is up and running, you use nx to serve the project

  ```bash
  # both frontend and backend
  pnpm nx run-many -t serve -p frontend backend # or
  pnpm nx run-many -t serve

  # only the backend
  pnpm nx serve backend

  # only the frontend
  pnpm nx serve frontend
  ```

  **Alternatively, you can use the vscode extension to the do the same.**

# Other questions

## Adding new packages

You have to install them in the project root using `pnpm`.

## Schemas

The schemas for the entire project are defined in `prisma/schema.prisma`.
**Every time you make changes to schemas make sure you run**. If you are getting some errors after running this commands it just means that the new schema changes are not straightforward to apply. In that case run the second command.

```bash
pnpm prisma db push

# this also clears the data
pnpm prisma db push --force-reset
```

## The terminal output is messed up

I think there's some problem with the `nx` cli's stdout with new lines. Even if the terminal is not responsive it is going to work fine. If you want to kill it you can run `pkill node` in another window.

## Deleting `.nx` folder

Yes, you can delete that folder.

## The backend is too slow to update changes after save

We are relying on webpack hope that answers.

## Seeding database

Data is seeded from `prisma/seed.ts` file. The sample lines of code in that file use `upsert()`, alternatively the entire db could be deleted and data can be inserted using `createMany()`.

https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding

# Useful commands

```bash
# to open the mongodb shell where you can interact with the database
docker exec -it bitwise-db-dev mongosh -u bitwise -p password --authenticationDatabase admin bitwise

# use a GUI to view/edit the db
pnpm prisma studio

# delete the db data (you could also use pnpm prisma db push --force-reset)
docker compose down -v # or
docker volume rm bitwise_data # after removing the container
```

# API Response formats

```typescript
// success
// both of these formats can be combined if required for success responses
// this message will be displayed on the frontend
{
	msg: string
}
// or
// this data will be used by the frontend
{
  products: [...]
}

// errors
{ msg: string }[]
// example
const errors = [
	{ msg: 'Missing field price' },
	{ msg: 'Age needs to a number greater than 0' },
]
```

# References

- https://www.mongodb.com/developer/products/mongodb/cheat-sheet/#crud
- https://www.prisma.io/docs/orm/prisma-client/queries/crud
- https://github.com/validatorjs/validator.js/?tab=readme-ov-file#validators
- https://github.com/validatorjs/validator.js/?tab=readme-ov-file#sanitizers
- https://express-validator.github.io/docs/guides/validation-chain
- https://reactrouter.com/en/main/route/loader
- https://nx.dev/getting-started/intro
- https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding
