import os
import json
import re

script_path = 'js/script.js'
with open(script_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Get lists of files
ts_files = os.listdir('assets/images/events/TechnoSpark2k26')
ts_gallery = ['TechnoSpark2k26/' + f for f in ts_files if f.lower().endswith('.jpg')]

cc_files = os.listdir('assets/images/events/CareerCompass')
cc_gallery = ['CareerCompass/' + f for f in cc_files if f.lower().endswith('.jpg')]

ts_img = ts_gallery[0] if ts_gallery else ''
cc_img = cc_gallery[0] if cc_gallery else ''

ts_replacement = f"img: '{ts_img}',\n    gallery: {json.dumps(ts_gallery, indent=6)}"
cc_replacement = f"img: '{cc_img}',\n    gallery: {json.dumps(cc_gallery, indent=6)}"

# Replace for TechnoSpark 2k26
content = re.sub(r"img: 'TechnoSpark2k26/[^']*?',\s*gallery: \[[^\]]*\]", ts_replacement, content, count=1, flags=re.DOTALL)

# Replace for Career Compass
content = re.sub(r"img: 'CareerCompass/[^']*?',\s*gallery: \[[^\]]*\]", cc_replacement, content, count=1, flags=re.DOTALL)

with open(script_path, 'w', encoding='utf-8') as f:
    f.write(content)
