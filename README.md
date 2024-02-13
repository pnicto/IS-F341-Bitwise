# Bitwise

This project is setup with `nx` a new tool found in the wild.

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

- In the project root, run to start the db.
  ```bash
  docker compose up
  # alternatively you can use this command to run in detached mode
  docker compose up  -d
  ```
- Once the db is up and running, you use nx to serve the project

  ```bash
  # only the backend
  pnpm nx serve backend

  # only the frontend
  pnpm nx serve frontend

  # both frontend and backend
  pnpm nx run-many -t serve -p frontend backend
  ```

  **Alternatively, you can use the vscode extension to the do the same.**
