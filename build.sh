#/bin/sh

# Build script for randomsig@oppermann.ch
# SYNOPSIS
# build.sh [version]
#
# [version] needs to be an existing tag (git tag)
#
# It creates a build/[version]/ directory and replaces the
# known placeholders with their value.

if [ $# -lt 1 ]; then
	echo "Missing version. Please provide a version to be build."
	echo "$0 [version]"
	exit 1
fi

VERSION=$1

# Check if this version exists
git tag | grep -q "^${VERSION}\$"

if [ $? -ne 0 ]; then
	echo "I don't know the given version (${VERSION})."
	echo "Please check 'git tag' for available versions to be build."
	exit 1
fi

echo "Version: ${VERSION}"

# Get the commit id of this version
COMMITID=$(git rev-parse ${VERSION})

if [ $? -ne 0 ]; then
	echo "Failed to retrieve commitid for version ${VERSION}"
	exit 1
fi

echo "Commit ID: ${COMMITID}"

# Build target
TARGET="./build/${VERSION}"

echo "Target: ${TARGET}"

# Check if the target already exists. If yes, then delete it
if [ -e "${TARGET}" ]; then
	echo -n "Target directory already exists. Removing ... "
	rm -rf "${TARGET}"

	if [ $? -ne 0 ]; then
		echo "failed"
		echo "Couldn't remove ${TARGET}. Please remove it manually".
		exit 1
	fi

	echo "done"
fi

# Create the target directory
echo -n "Creating target directory ... "
mkdir -p "${TARGET}"

if [ $? -ne 0 ]; then
	echo "failed"
	echo "Failed to create target ${TARGET}. Please advise."
	exit 1
fi

echo "done";

FILELIST="install.rdf chrome.manifest chrome"

# Copy the files for the release
echo -n "Copying files ... "
cp -R ${FILELIST} "${TARGET}"

if [ $? -ne 0 ]; then
	echo "failed"
	echo "Failed to copy the files to the target directory"
	exit 1
fi

echo "done"

# Replace the known placeholders
echo "Replacing placeholders ..."
files=$(find "${TARGET}" -type f)

for file in ${files}; do
	echo "   ${file}"

	sed s/@@randomsig_version@@/${VERSION}/g ${file} > ${file}.tmp
	mv ${file}.tmp ${file}

	sed s/@@randomsig_commitid@@/${COMMITID}/g ${file} > ${file}.tmp
	mv ${file}.tmp ${file}
done

echo "done"

# ZIP the files to an XPI file
basepwd=$(pwd);

echo "Creating XPI file ..."
cd ${TARGET}
zip -r9v randomsig-${VERSION}.xpi .

if [ $? -ne 0 ]; then
	cd "${basepwd}"

	echo "failed"
	echo "Failed to create XPI file. Investigate."
	exit 1
fi

cd "${basepwd}"

echo "done"

echo "XPI: ${TARGET}/randomsig-${VERSION}.xpi";
echo "Build for version ${VERSION} done!"