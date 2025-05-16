#!/bin/bash

# This script packages the VS Code extension with the correct PATH

# Add Homebrew to PATH
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"

# Display the tools we're using
echo "Using npm: $(which npm)"
echo "Using node: $(which node)"

# Build the extension
echo "Building extension in production mode..."
npm run package

# Install vsce if needed
echo "Installing @vscode/vsce..."
npm install -g @vscode/vsce

# Package the extension
echo "Packaging extension with vsce..."
vsce package

# Done
echo "Done! Check for the .vsix file in the current directory."
