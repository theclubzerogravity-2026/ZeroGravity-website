import os
import json

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

ts_event = f"""  {{
    tag: '29 & 30 SEPT', title: 'TechnoSpark 2k26',
    desc: 'Get ready for our biggest flagship event of the year! A spectacular showcase of technology, innovation, and teamwork.',
    img: '{ts_img}',
    gallery: {json.dumps(ts_gallery, indent=6)}
  }},"""

cc_event = f"""  {{
    tag: '29 & 30 SEPT', title: 'Career Compass',
    desc: 'Expert sessions by industry professionals guiding you through career opportunities, interview preparations, and navigating the corporate world.',
    img: '{cc_img}',
    gallery: {json.dumps(cc_gallery, indent=6)}
  }},"""

old_ts = """  {
    tag: 'UPCOMING EVENT', title: 'TechnoSpark 2k26',
    desc: 'Get ready for our biggest flagship event of the year! A spectacular showcase of technology, innovation, and teamwork.',
    img: '../../../technospark/technospark.png',
    gallery: [
      "../../../technospark/technospark.png"
    ]
  },"""

content = content.replace(old_ts, ts_event + '\n' + cc_event)

with open(script_path, 'w', encoding='utf-8') as f:
    f.write(content)
