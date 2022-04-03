#!/usr/bin/env bash
# set -eo pipefail

set -x

# Set this to your package name
# You can also source this from the ENV and share this script between packages
PACKAGE_NAME="internal-lorem-ipsum-docker"

# Replace this with your container registry
REGISTRY_URL="registry.example.com"

GIT_COMMIT_HASH=$(git rev-parse HEAD)

# Make a tmp directory to extract out bundle to
# this helps removes everything thats not needed before
# we even send stuff over to the docker build context
dirName="${PACKAGE_NAME}-${GIT_COMMIT_HASH}"

# Make the tmp directory and capture it's path
tmpDir=$(mktemp -d -t $dirName-XXXXXXX)

NODE_OPTIONS=--trace-warnings

# Run bundle with our tmp directory, and ask it not to zip up the result
yarn bundle --temporary-directory $tmpDir --ignore-file .bundleignore

set -e

# Build our container using the tmp directory
docker build \
  -t ${PACKAGE_NAME}:${GIT_COMMIT_HASH} \
  --compress \
  -f $tmpDir$INIT_CWD/Dockerfile \
  $tmpDir

set +e

# Tag our new image with the package and version
docker tag ${PACKAGE_NAME}:${GIT_COMMIT_HASH} ${REGISTRY_URL}/${PACKAGE_NAME}:${GIT_COMMIT_HASH}

# Remove our temporary directory
rm -rf $tmpDir

# Push the image up
docker push ${REGISTRY_URL}/${PACKAGE_NAME}:${GIT_COMMIT_HASH}
