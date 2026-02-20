import re

def find_unclosed_divs():
    with open('index.html', encoding='utf-8') as f:
        content = f.read()
    
    # Use re.finditer to get positions
    stack = []
    for match in re.finditer(r'<(div|/div)', content):
        tag = match.group(1)
        pos = match.start()
        # count lines until this pos
        line_no = content.count('\n', 0, pos) + 1
        
        if tag == 'div':
            stack.append((line_no, match.group(0)))
        else:
            if stack:
                stack.pop()
            else:
                print(f"Stray closing div on line {line_no}")
    
    if stack:
        print("Unclosed divs:")
        for line_no, tag in stack:
            print(f"- Line {line_no}: {tag}")
    else:
        print("All divs closed.")

if __name__ == "__main__":
    find_unclosed_divs()
