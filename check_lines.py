import re

def find_line_numbers():
    with open('index.html', encoding='utf-8') as f:
        for i, line in enumerate(f, 1):
            if 'id="dp-vendor"' in line:
                print(f"ID 'dp-vendor' found on line {i}")
            if '<div class="card">' in line and '<div class="card">' in line[line.find('<div class="card">')+18:]:
                # Check for double card on same line if any
                pass
            # Specifically check for the double card I saw
            if line.strip() == '<div class="card">' and i > 2930 and i < 2940:
                 print(f"Suspicious card div on line {i}")

if __name__ == "__main__":
    find_line_numbers()
