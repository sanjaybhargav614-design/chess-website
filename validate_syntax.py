import sys

def check_file(filename):
    with open(filename, 'r', encoding='utf-8') as f:
        code = f.read()
    
    # Simple brace/paren balancer
    stack = []
    in_single = False
    in_double = False
    in_backtick = False
    in_line_comment = False
    in_block_comment = False
    escape = False

    i = 0
    line_no = 1
    col = 0
    n = len(code)

    while i < n:
        ch = code[i]
        col += 1
        if ch == '\n':
            line_no += 1
            col = 0
            in_line_comment = False
            i += 1
            continue

        if in_line_comment:
            i += 1
            continue

        if in_block_comment:
            if ch == '*' and i + 1 < n and code[i+1] == '/':
                in_block_comment = False
                i += 2
                col += 1
                continue
            i += 1
            continue

        if in_single:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == "'":
                in_single = False
            i += 1
            continue

        if in_double:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '"':
                in_double = False
            i += 1
            continue

        if in_backtick:
            if escape:
                escape = False
            elif ch == '\\':
                escape = True
            elif ch == '`':
                in_backtick = False
            i += 1
            continue

        # Comments
        if ch == '/' and i + 1 < n:
            if code[i+1] == '/':
                in_line_comment = True
                i += 2
                col += 1
                continue
            elif code[i+1] == '*':
                in_block_comment = True
                i += 2
                col += 1
                continue

        # Strings
        if ch == "'":
            in_single = True
        elif ch == '"':
            in_double = True
        elif ch == '`':
            in_backtick = True
        elif ch in ('{', '(', '['):
            stack.append((ch, line_no, col))
        elif ch in ('}', ')', ']'):
            if not stack:
                print(f"Error {filename}:{line_no}:{col} unmatched closing {ch}")
                return False
            top, t_line, t_col = stack.pop()
            expected = {'{': '}', '(': ')', '[': ']'}[top]
            if ch != expected:
                print(f"Error {filename}:{line_no}:{col} got {ch}, expected {expected} matching line {t_line}:{t_col}")
                return False

        i += 1

    if stack:
        print(f"Error {filename} unclosed: {stack[-3:]}")
        return False

    print(f"OK: {filename} parsed cleanly, all brackets balanced.")
    return True

check_file('bots.js')
check_file('app.js')
check_file('engine-worker.js')

