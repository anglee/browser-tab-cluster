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

# Create zip for Chrome Web Store submission
zip: build
    cd dist && zip -r ../tab-cluster-v1.0.0.zip . -x "*.DS_Store"
