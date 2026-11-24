import json
import os
with open("engine-files.json", encoding="utf8") as manifest:
    JS = json.load(manifest)
JS += ["flags.js", "ui.js", "ui2.js", "ui3.js", "ui4.js", "ui5.js", "ui6.js", "ui7.js", "ui8.js", "ui9.js"]
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
build_number = json.dumps(os.environ.get("LC_BUILD_NUMBER", "") if os.environ.get("LC_BUILD_NUMBER", "").isdigit() else "")
js="\n;\n".join([f"const LC_BUILD_NUMBER = {build_number};", codec] + [open("src/"+f,encoding="utf8").read() for f in JS])
html=f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>The Long Century</title><style>{css}</style></head><body><script>{js}</script></body></html>"""
os.makedirs("dist",exist_ok=True)
open("dist/long-century.html","w",encoding="utf8").write(html)
if os.path.isdir("/mnt/user-data/outputs"):open("/mnt/user-data/outputs/long-century.html","w",encoding="utf8").write(html)
print("built",len(html)//1024,"KB")
