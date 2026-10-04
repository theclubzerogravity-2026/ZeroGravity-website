import os
from PIL import Image, ImageOps

def compress_images(folder_path, max_height=400):
    for filename in os.listdir(folder_path):
        if filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            file_path = os.path.join(folder_path, filename)
            try:
                with Image.open(file_path) as img:
                    # Fix orientation issues
                    img = ImageOps.exif_transpose(img)
                    
                    if img.mode != 'RGB':
                        img = img.convert('RGB')
                        
                    # Calculate new width based on aspect ratio
                    ratio = max_height / float(img.size[1])
                    if ratio < 1.0:
                        new_width = int(img.size[0] * ratio)
                        img = img.resize((new_width, max_height), Image.Resampling.LANCZOS)
                        
                    # Save back with optimization
                    img.save(file_path, "JPEG", optimize=True, quality=80)
                    print(f"Compressed: {filename}")
            except Exception as e:
                print(f"Failed to compress {filename}: {e}")

if __name__ == "__main__":
    compress_images('assets/images/events/TechnoSpark2k26')
    compress_images('assets/images/events/CareerCompass')
