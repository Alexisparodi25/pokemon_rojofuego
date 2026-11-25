#!/usr/bin/env python3
"""Regenera Effects.FUNCTIONAL: habilidades cuyo id aparece en el código del motor."""
import re, glob, os
os.chdir(os.path.join(os.path.dirname(__file__), '..'))
src = ''.join(open(f, encoding='utf-8').read() for f in glob.glob('engine/*.java') if not f.endswith('Effects.java'))
strs = set(re.findall(r'"([a-z0-9]+)"', src))
rows = [l.split('\t') for l in open('pokefuego/data/abilities.tsv', encoding='utf-8') if l.strip()]
fun = sorted(r[1] for r in rows if re.sub('[^a-z0-9]', '', r[1].lower()) in strs)
e = open('engine/Effects.java', encoding='utf-8').read()
e = re.sub(r'(public static final String\[\] FUNCTIONAL = \{\n).*?(\};)', lambda m: m.group(1) + '    ' + ',\n    '.join('"%s"' % n for n in fun) + m.group(2), e, flags=re.S)
open('engine/Effects.java', 'w', encoding='utf-8').write(e)
print(len(fun), 'habilidades con efecto')
