import sys
import json
import pathlib

# Define paths for both library files
FA_LIB_PATH = pathlib.Path(__file__).parent / "library.json"
MM_LIB_PATH = pathlib.Path(__file__).parent / "moore_mealy_library.json"

def get_library_path(entry_type):
    """Determines which library file path to use based on the entry type."""
    if entry_type in ["MOORE", "MEALY"]:
        return MM_LIB_PATH
    else:
        # Default to FA library for DFA, NFA, ENFA, or unknown types
        return FA_LIB_PATH

def load_lib(filepath):
    """Loads a JSON library file from the given path."""
    if filepath.exists():
        try:
            return json.loads(filepath.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON in {filepath}: {e}")
            return []
    return []

def save_lib(data, filepath):
    """Saves the data back to the specified JSON library file."""
    filepath.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print(f"Saved entry to {filepath.name}")

def main():
    if len(sys.argv) < 2:
        print("Usage: python append_solution.py new_entry.json")
        print("Note: The script determines the target library (FA or MM) based on the entry's 'type' field.")
        return

    # 1. Load new entry
    newpath = pathlib.Path(sys.argv[1])
    if not newpath.exists():
        print(f"File not found: {newpath}")
        return

    try:
        newentry = json.loads(newpath.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in {newpath}")
        return

    entry_type = newentry.get('type', 'DFA').upper()
    entry_id = newentry.get('id') or newentry.get('title')

    if not entry_id:
        print("Error: Library entry must contain an 'id' or 'title' for unique tracking.")
        return

    # 2. Determine target library
    target_path = get_library_path(entry_type)
    data = load_lib(target_path)
    
    # 3. Check for uniqueness
    ids = {e.get('id') for e in data}
    if entry_id in ids:
        print(f"Warning: Entry ID '{entry_id}' already exists in {target_path.name}. Skipping append.")
        return

    # 4. Append and save
    data.append(newentry)
    save_lib(data, target_path)

if __name__ == "__main__":
    main()