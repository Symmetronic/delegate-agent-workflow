#!/bin/sh
set -e

prepare_node_modules() {
  sudo mkdir -p /workspace/node_modules
  sudo chown -R "${USERNAME}:${USERNAME}" /workspace/node_modules
}

prepare_openhands_data() {
  sudo mkdir -p "/home/${USERNAME}/.openhands"
  sudo chown -R "${USERNAME}:${USERNAME}" "/home/${USERNAME}/.openhands"
}

install_dependencies() {
  prepare_node_modules
  npm ci
  npm run prepare
}

prepare_openhands_data
install_dependencies
