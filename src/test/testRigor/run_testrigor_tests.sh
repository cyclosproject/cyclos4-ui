#!/bin/bash

npm install -g testrigor-cli

BRANCH_NAME="$(git rev-parse --abbrev-ref HEAD)"
COMMIT_NAME="$(git rev-parse --verify HEAD)"

# Define default values for missing variables at .env file
. .env

# Paths for the test cases and rules files
TEST_CASES_PATH="tests/testRigor/testcases/**/*.txt"
RULES_PATH="tests/testRigor/rules/**/*.txt"

# Command to run the tests using the testRigor CLI
testrigor test-suite run "$TEST_SUITE_ID" --token "$AUTH_TOKEN" --localhost --url "$LOCALHOST_URL" --test-cases-path "$TEST_CASES_PATH" --rules-path "$RULES_PATH" --branch "$BRANCH_NAME" --commit "$COMMIT_NAME"
