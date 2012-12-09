#/bin/sh

BUILDDIR=./build
BASEDIR=$(pwd)
PREFIX=randomsig

# Build script for randomsig@oppermann.ch
# SYNOPSIS
# build.sh [version]
#
# [version] needs to be an existing tag (git tag)
#
# It creates a ./build/[version]/ directory and replaces the
# known placeholders with their value.

if [ $# -lt 1 ]; then
	echo "Missing version. Please provide a version to be build."
	echo "$0 [version]"
	exit 1
fi

VERSION=$1

if [ $VERSION != "HEAD" ]; then
	# Check if this version exists
	git tag | grep -q "^${VERSION}\$"

	if [ $? -ne 0 ]; then
		echo "I don't know the given version (${VERSION})."
		echo "Please check 'git tag' for available versions to be build."
		exit 1
	fi
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
TARGET="${BUILDDIR}/${VERSION}"

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

# Check for the build directory
if [ ! -d ${BUILDDIR} ]; then
	echo -n "Creating build directory ... "
	mkdir -p "${BUILDDIR}"

	if [ $? -ne 0 ]; then
		echo "failed"
		echo "Failed to create build directory ${BUILDDIR}. Please advise."
		exit 1
	fi

	echo "done";
fi

# Clone the local repository
echo -n "Cloning to branch ${VERSION} ... "

if [ $VERSION != "HEAD" ]; then
	git clone --quiet --local --branch "${VERSION}" . "${TARGET}"
else
	git clone --quiet --local . "${TARGET}"
fi

if [ $? -ne 0 ]; then
	echo "failed"
	echo "Failed to clone repository. Advise."
	exit 1
fi

echo "done"

echo "Changing pwd to ${TARGET}"
cd "${TARGET}"
mkdir ./.build

if [ $? -ne 0 ]; then
	echo "Failed to create temporary build directory at ${TARGET}/.build"
	exit 1
fi

FILELIST="install.rdf chrome.manifest chrome"

# Copy the files for the release
echo -n "Copying files ... "
cp -R ${FILELIST} ./.build

if [ $? -ne 0 ]; then
	echo "failed"
	echo "Failed to copy the files to the build directory"
	exit 1
fi

echo "done"

# Replace the known placeholders
echo "Replacing placeholders ..."
files=$(find ./.build -type f)

for file in ${files}; do
	echo "   ${file}"

	sed s/@@${PREFIX}_version@@/${VERSION}/g ${file} > ${file}.tmp
	mv ${file}.tmp ${file}

	sed s/@@${PREFIX}_commitid@@/${COMMITID}/g ${file} > ${file}.tmp
	mv ${file}.tmp ${file}
done

echo "done"

# ZIP the files to an XPI file
echo "Creating XPI file ..."
cd ./.build
zip -r9v "${BASEDIR}/${BUILDDIR}/${PREFIX}-${VERSION}.xpi" .

if [ $? -ne 0 ]; then
	cd "${BASEDIR}"

	echo "failed"
	echo "Failed to create XPI file. Investigate."
	exit 1
fi

echo "done"

echo "XPI: ${BASEDIR}/${BUILDDIR}/${PREFIX}-${VERSION}.xpi";
echo "Build for version ${VERSION} done!"

cd "${BASEDIR}"
