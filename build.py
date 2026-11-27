import json
import os
import subprocess
with open("engine-files.json", encoding="utf8") as manifest:
    JS = json.load(manifest)
JS += ["flags.js", "ui.js", "ui2.js", "ui3.js", "ui4.js", "ui5.js", "ui6.js", "ui7.js", "ui8.js", "ui9.js", "ui_audio.js", "ui_day.js"]
def read_src(f):
    """Plain JS is read as is; TypeScript engine files (src/engine/*.ts) are stripped to JS by Node, the same way build.mjs and Vite do."""
    if not f.endswith(".ts"):
        return open("src/"+f,encoding="utf8").read()
    js="process.stdout.write(require('./scripts/transpile-engine.cjs').readEngineFile(process.cwd(),process.argv[1]))"
    return subprocess.run(["node","--no-warnings","-e",js,f],check=True,capture_output=True,text=True).stdout
css="\n".join(open("src/"+f,encoding="utf8").read() for f in ["ui.css","ui3.css"])
with open("src/vendor/pako.js", encoding="utf8") as source:
    compression = source.read()
with open("src/vendor/pako-LICENSE.txt", encoding="utf8") as source:
    license_text = source.read()
codec = (
    "const SAVE_COMPRESSION=(function(window,module,exports,define){\n"
    + "/*\n" + license_text + "*/\n" + compression
    + "\n;return window.pako;\n})({});"
)
codec_copy=codec.replace("http://zlib.net/manual.html#Advanced","zlib.net/manual.html#Advanced").replace("const SAVE_COMPRESSION=","var SAVE_COMPRESSION=",1)  # worker copy: comment link only
build_number = os.environ.get("LC_BUILD_NUMBER", "")
if not build_number.isascii() or not build_number.isdecimal():
    build_number = ""
js="\n;\n".join([f"const LC_BUILD_NUMBER = {json.dumps(build_number)};", codec] + [read_src(f) for f in JS])
html=f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>The Long Century</title><style>{css}</style></head><body><script type="text/plain" id="codec-src">{codec_copy}</script><script>{js}</script></body></html>"""
os.makedirs("dist",exist_ok=True)
open("dist/long-century.html","w",encoding="utf8").write(html)
if os.path.isdir("/mnt/user-data/outputs"):open("/mnt/user-data/outputs/long-century.html","w",encoding="utf8").write(html)
print("built",len(html)//1024,"KB")
