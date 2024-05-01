#!/usr/bin/bash

backend() {
	fly deploy -a bitwise-backend -c fly.backend.toml --remote-only
	fly scale -c fly.backend.toml memory 256
}

frontend() {
	fly deploy -a bitwise -c fly.frontend.toml --build-arg VITE_API_URL="https://bitwise-backend.fly.dev/api" --build-arg VITE_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/ojgeqolkv/" --build-arg VITE_IMAGEKIT_PUBLIC_KEY="public_078DlC2+5zIEziPHkar4xD9gvqE=" --remote-only
	fly scale -c fly.frontend.toml memory 256
}

if [ "$1" == "backend" ]; then
	backend
elif [ "$1" == "frontend" ]; then
	frontend
else
	backend
	frontend
fi
