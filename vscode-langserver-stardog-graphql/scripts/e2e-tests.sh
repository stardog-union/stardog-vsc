#!/usr/bin/env bash

export CODE_TESTS_PATH="$(pwd)/out/test"
export CODE_TESTS_WORKSPACE="--disable-extensions $(pwd)/fixtures"
export CODE_EXTENSIONS_PATH="$(pwd)/.."

node "$(pwd)/node_modules/vscode/bin/test"
