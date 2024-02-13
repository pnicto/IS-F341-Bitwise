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

The schemas for the entire project are defined and exported from `schemas/src/lib/schemas.ts`.
