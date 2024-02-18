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

## Development

- Make prettier your default formatter in your editor.
- ```bash
  cp .example.env .env
  ```
  Add the required fields in `.env`.
- In the project root, run to start the db.

  ```bash
  docker compose up

  # alternatively you can use this command to run in detached mode
  docker compose up  -d
  ```

- Once the db is up and running, you use nx to serve the project

  ```bash
  # both frontend and backend
  pnpm nx run-many -t serve -p frontend backend

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

The schemas for the entire project are defined in `prisma/schema.prisma`

## The terminal output is messed up

I think there's some problem with the `nx` cli's stdout with new lines. Even if the terminal is not responsive it is going to work fine. If you want to kill it you can run `pkill node` in another window.

## Deleting `.nx` folder

Yes, you can delete that folder.

## The backend is too slow to update changes after save

We are relying on webpack hope that helps.
