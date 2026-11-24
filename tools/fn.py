#!/usr/bin/env python3
"""Print one function from the game source without dumping the rest of the file.

    python3 tools/fn.py <functionName> [file]     e.g.  fn.py bldCan build.js
    python3 tools/fn.py --list <file>             every function/const name with its line number

<file> is a name in src/ (build.js or build) or a path. Without <file>, all src/*.js are searched.
Matches: `function name(`, `name=function`, `const|let|var name=`.
The printed span runs from the match to the end of its body (brace matching that skips strings,
comments and regex literals). Any single line longer than 300 characters is cut to its first 300
characters followed by "…[N more chars]", so the 83k-character line in world.js cannot flood output.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
MAX_LINE = 300
KEYWORD_BEFORE_REGEX = re.compile(r"(?:return|typeof|case|in|of|void|delete)\s*$")


def resolve(name):
    if os.path.isfile(name):
        return os.path.abspath(name)
    base = name if name.endswith(".js") else name + ".js"
    path = os.path.join(SRC, os.path.basename(base))
    if os.path.isfile(path):
        return path
    sys.exit(f"fn.py: no source file '{name}' (looked in src/)")


def find_matches(text, name):
    """Yield (start, kind) for every definition of `name`, in file order."""
    n = re.escape(name)
    found = {}
    patterns = [
        (re.compile(r"(?<![\w$.])function\s+" + n + r"(?![\w$])\s*\("), "decl"),
        (re.compile(r"(?<![\w$.])" + n + r"(?![\w$])\s*=\s*function\b"), "expr"),
        (re.compile(r"(?<![\w$.])(?:const|let|var)\s+" + n + r"(?![\w$])\s*="), "expr"),
    ]
    for pattern, kind in patterns:
        for m in pattern.finditer(text):
            found.setdefault(m.start(), kind)
    return sorted(found.items())


def skip_string(text, i):
    quote = text[i]
    j, n = i + 1, len(text)
    while j < n:
        ch = text[j]
        if ch == "\\":
            j += 2
            continue
        if ch == quote:
            return j + 1
        if ch == "\n" and quote != "`":
            return j  # unterminated: stop rather than swallow the file
        j += 1
    return n


def skip_regex(text, i):
    j, n, in_class = i + 1, len(text), False
    while j < n:
        ch = text[j]
        if ch == "\\":
            j += 2
            continue
        if ch == "\n":
            return j
        if in_class:
            if ch == "]":
                in_class = False
        elif ch == "[":
            in_class = True
        elif ch == "/":
            j += 1
            while j < n and text[j].isalpha():  # flags such as g, i
                j += 1
            return j
        j += 1
    return n


def code_chars(text, start=0):
    """Yield (index, char, depth) for every code character from start on.

    Comments are skipped. A string or regex literal yields only its opening character.
    depth is the bracket depth before the character, counted from start.
    """
    i, n, depth = start, len(text), 0
    last = ""
    while i < n:
        c = text[i]
        nxt = text[i + 1] if i + 1 < n else ""
        if c == "/" and nxt == "/":
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "/" and nxt == "*":
            j = text.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"`":
            yield i, c, depth
            i = skip_string(text, i)
            last = c
            continue
        if c == "/" and (last == "" or last in "(,=:[!&|?{};+-*%<>~^"
                         or KEYWORD_BEFORE_REGEX.search(text[max(0, i - 10):i])):
            yield i, c, depth
            i = skip_regex(text, i)
            last = "/"
            continue
        yield i, c, depth
        if c in "([{":
            depth += 1
        elif c in ")]}":
            depth -= 1
        if not c.isspace():
            last = c
        i += 1


def function_span(text, start, kind):
    last = ""
    for i, c, d in code_chars(text, start):
        if c == "}" and d == 1:  # closes the body that opened at the match
            k = i + 1
            while k < len(text) and text[k] in " \t":
                k += 1
            if kind == "expr" and k < len(text) and text[k] == ";":
                return text[start:k + 1]
            return text[start:i + 1]
        if c in ")]}" and d == 0:  # ran out of the enclosing scope
            return text[start:i]
        if c == ";" and d == 0:
            return text[start:i + 1]
        # a const/assignment with no ';' ends at a newline once its statement is complete
        if c == "\n" and d == 0 and kind == "expr" and last and (last.isalnum() or last in "_$)]}\"'`/"):
            return text[start:i]
        if not c.isspace():
            last = c
    return text[start:]


def top_level_positions(text):
    return {i for i, _c, d in code_chars(text) if d == 0}


def clip(span):
    out = []
    for line in span.split("\n"):
        if len(line) > MAX_LINE:
            line = line[:MAX_LINE] + f"…[{len(line) - MAX_LINE} more chars]"
        out.append(line)
    return "\n".join(out)


def show(name, file_arg):
    files = [resolve(file_arg)] if file_arg else sorted(glob.glob(os.path.join(SRC, "*.js")))
    hits = []
    for path in files:
        with open(path, encoding="utf8") as handle:
            text = handle.read()
        for start, kind in find_matches(text, name):
            hits.append((path, text, start, kind))
    if not hits:
        sys.exit(f"fn.py: '{name}' not defined in {'src/*.js' if not file_arg else file_arg}")
    for path, text, start, kind in hits:
        if len(hits) > 1:
            line_no = text.count("\n", 0, start) + 1
            print(f"# {os.path.relpath(path, ROOT)}:{line_no}")
        print(clip(function_span(text, start, kind)))


def list_names(file_arg):
    path = resolve(file_arg)
    with open(path, encoding="utf8") as handle:
        text = handle.read()
    patterns = [
        (re.compile(r"(?<![\w$.])function\s+([\w$]+)\s*\("), "function"),
        (re.compile(r"(?<![\w$.])([\w$]+)\s*=\s*function\b"), "assign"),
        (re.compile(r"(?<![\w$.])(?:const|let|var)\s+([\w$]+)\s*="), "const"),
    ]
    top = top_level_positions(text)
    rows = []
    for pattern, kind in patterns:
        for m in pattern.finditer(text):
            if m.start() in top:
                rows.append((text.count("\n", 0, m.start()) + 1, m.group(1), kind))
    for line_no, name, kind in sorted(rows):
        print(f"{line_no}\t{name}\t{kind}")


def main(argv):
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0
    if argv[0] == "--list":
        if len(argv) != 2:
            sys.exit("usage: fn.py --list <file>")
        list_names(argv[1])
        return 0
    if len(argv) > 2:
        sys.exit("usage: fn.py <functionName> [file]")
    show(argv[0], argv[1] if len(argv) == 2 else None)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
