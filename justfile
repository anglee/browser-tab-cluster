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
