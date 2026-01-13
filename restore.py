import zipfile
import os
import shutil

zip_path = 'attached_assets/Scan-Bot-Sante_1768296347036.zip'
extract_path = 'attached_assets/temp_extract'

print(f"Extracting {zip_path}...")

if os.path.exists(extract_path):
    shutil.rmtree(extract_path)
os.makedirs(extract_path)

try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_path)
        print("Extraction complete.")
        
        # Check structure
        items = os.listdir(extract_path)
        print(f"Items in root: {items}")
        
        source_dir = extract_path
        # If the zip contains a single folder that contains the project, perform one level of hoisting
        if len(items) == 1 and os.path.isdir(os.path.join(extract_path, items[0])):
            potential_root = os.path.join(extract_path, items[0])
            # Check if this directory looks like a project root (has package.json or src or client/server)
            if os.path.exists(os.path.join(potential_root, 'package.json')) or \
               os.path.exists(os.path.join(potential_root, 'client')) or \
               os.path.exists(os.path.join(potential_root, 'server')):
                print(f"Detected nested root: {items[0]}")
                source_dir = potential_root
        
        print(f"Moving files from {source_dir} to current directory...")
        
        for item in os.listdir(source_dir):
            if item == 'attached_assets':
                continue # Don't overwrite attached_assets
            if item == 'restore.py':
                continue
                
            src = os.path.join(source_dir, item)
            dst = item
            
            print(f"Processing {item}...")
            
            if os.path.exists(dst):
                if os.path.isdir(dst):
                    try:
                        shutil.rmtree(dst)
                    except Exception as e:
                        print(f"Error removing directory {dst}: {e}")
                else:
                    try:
                        os.remove(dst)
                    except Exception as e:
                        print(f"Error removing file {dst}: {e}")
            
            try:
                shutil.move(src, dst)
            except Exception as e:
                print(f"Error moving {src} to {dst}: {e}")

    print("Restore complete.")

except Exception as e:
    print(f"Error during restore: {e}")
    exit(1)
finally:
    if os.path.exists(extract_path):
        shutil.rmtree(extract_path)
