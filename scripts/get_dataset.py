import os
import sys
import shutil
import random
import csv
from pathlib import Path

VALID_EXTENSIONS = {".jpg", ".jpeg", ".png"}

def download_and_prepare_dataset(sample_size_per_class: int = 15):
    # Ensure kagglehub is installed
    try:
        import kagglehub
    except ImportError:
        print("\n[ERROR] 'kagglehub' package is not installed.")
        print("Please run: pip install kagglehub")
        sys.exit(1)

    print("=" * 60)
    print("Downloading 'sarthaktandulje/disaster-damage-5class' via kagglehub...")
    print("=" * 60)

    try:
        dataset_path = kagglehub.dataset_download("sarthaktandulje/disaster-damage-5class")
    except Exception as e:
        print("\n" + "!" * 60)
        print("[ERROR] Failed to download dataset using kagglehub.")
        print(f"Details: {e}")
        print("!" * 60)
        print("\nHow to fix:")
        print("1. Ensure your internet connection is active.")
        print("2. If Kaggle requires authentication for your network or account:")
        print("   - Go to https://www.kaggle.com/settings -> 'Create New Token'")
        print("   - Save the downloaded 'kaggle.json' to ~/.kaggle/kaggle.json")
        print("   - Or set environment variables KAGGLE_USERNAME and KAGGLE_KEY.")
        print("3. Try running the script again: python scripts/get_dataset.py\n")
        sys.exit(1)

    dataset_root = Path(dataset_path)
    print(f"\n[OK] Dataset cached at: {dataset_root}")

    # Discover candidate class directories
    # Look for folders containing image files directly or inside subfolders (e.g., train/test/val)
    all_dirs = [d for d in dataset_root.rglob("*") if d.is_dir()]
    # Map class_name -> list of Path image files
    class_images = {}

    # Check top-level directories or nested class directories
    for directory in [dataset_root] + all_dirs:
        # Check files in this directory
        imgs = [
            f for f in directory.iterdir()
            if f.is_file() and f.suffix.lower() in VALID_EXTENSIONS
        ]
        if imgs:
            class_name = directory.name
            if class_name not in class_images:
                class_images[class_name] = []
            class_images[class_name].extend(imgs)

    if not class_images:
        print("[WARN] No valid image files (.jpg, .jpeg, .png) found in the dataset directory.")
        return

    print("\n--- Discovered Classes & Image Counts ---")
    for cls_name, files in sorted(class_images.items()):
        print(f"  - {cls_name}: {len(files)} images")

    # Define destination path
    project_root = Path(__file__).resolve().parent.parent
    dest_dir = project_root / "test_images"
    dest_dir.mkdir(parents=True, exist_ok=True)

    labels_csv_path = dest_dir / "labels.csv"
    sampled_records = []

    print(f"\nSampling up to {sample_size_per_class} images per class into: {dest_dir}")

    # Ensure deterministic or reproducible sampling if desired, but user asked for random
    for cls_name, files in sorted(class_images.items()):
        cls_dest_dir = dest_dir / cls_name
        cls_dest_dir.mkdir(parents=True, exist_ok=True)

        chosen = random.sample(files, min(sample_size_per_class, len(files)))
        for src_file in chosen:
            target_file = cls_dest_dir / src_file.name
            # Copy file (do not delete or move original)
            shutil.copy2(src_file, target_file)
            # Store relative path for labels.csv: e.g. class_name/filename.jpg
            sampled_records.append({
                "filename": f"{cls_name}/{src_file.name}",
                "true_class": cls_name
            })

    # Write labels.csv
    with open(labels_csv_path, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "true_class"])
        writer.writeheader()
        writer.writerows(sampled_records)

    print(f"\n[OK] Sampled {len(sampled_records)} total images.")
    print(f"[OK] Created labels CSV at: {labels_csv_path}")
    print("Done!")

if __name__ == "__main__":
    download_and_prepare_dataset()
