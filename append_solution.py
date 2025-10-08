
import sys, json, pathlib
LIB = pathlib.Path(__file__).parent / "library.json"
def load_lib():
    if LIB.exists():
        return json.loads(LIB.read_text(encoding="utf-8"))
    return []
def save_lib(data):
    LIB.write_text(json.dumps(data, indent=2), encoding="utf-8")
    print("Saved", LIB)
def main():
    if len(sys.argv) < 2:
        print("Usage: python append_solution.py new_entry.json")
        return
    newpath = pathlib.Path(sys.argv[1])
    if not newpath.exists():
        print("File not found:", newpath)
        return
    newentry = json.loads(newpath.read_text(encoding="utf-8"))
    data = load_lib()
    ids = {e.get('id') for e in data}
    if newentry.get('id') in ids:
        print("ID already exists in library.json. Choose a different id or edit existing.")
        return
    data.append(newentry)
    save_lib(data)
if __name__ == "__main__":
    main()
