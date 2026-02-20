import re
from collections import Counter

def find_duplicates():
    with open('index.html', encoding='utf-8') as f:
        content = f.read()
    
    ids = re.findall(r'id="([^"]+)"', content)
    counts = Counter(ids)
    dupes = {i: c for i, c in counts.items() if c > 1}
    
    if dupes:
        print("Duplicate IDs found:")
        for i, c in dupes.items():
            print(f"- {i}: {c} times")
    else:
        print("No duplicate IDs found.")

    classes = re.findall(r'class="([^"]+)"', content)
    # classes are expected to be duplicated, but we can check for weird things
    
    # Check for unclosed divs (basic count)
    open_divs = len(re.findall(r'<div', content))
    close_divs = len(re.findall(r'</div', content))
    print(f"Divs: {open_divs} open, {close_divs} closed. Difference: {open_divs - close_divs}")

if __name__ == "__main__":
    find_duplicates()
