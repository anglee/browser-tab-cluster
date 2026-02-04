# Default recipe
default: build

# Install dependencies
install:
    npm install

# Build the extension
build:
    npm run build

# Run development server
dev:
    npm run dev

# Clean build output
clean:
    rm -rf dist

# Rebuild from scratch
rebuild: clean build

# Bump version (usage: just bump major|minor|patch)
bump type:
    npm run bump -- {{type}}

# Create zip for Chrome Web Store submission
zip: build
    npm run zip
