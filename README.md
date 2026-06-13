# Watermark Image Tool

A tool for adding watermarks to images.

## Features
- Add text watermark to images
- Customize watermark position
- Batch processing support
- Multiple image format support (JPG, PNG, WEBP)

## Tech Stack
- JavaScript / Node.js
- Canvas API / Sharp
- Express.js

## Installation
```bash
git clone https://github.com/raflinaufal/watermark-image
cd watermark-image
npm install
```

## Usage
```bash
npm start
```

Then open your browser at `http://localhost:3000`

## API
```
POST /api/watermark
Content-Type: multipart/form-data

Fields:
- image: (file) - The image to watermark
- text: (string) - Watermark text
- position: (string) - Position (top-left, center, bottom-right)
```

## Contributing
Pull requests and issues are welcome!
