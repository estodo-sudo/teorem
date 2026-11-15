"""Deep-merges a JSON fragment (stdin) into src/i18n/tr.json, preserving order."""
import json, sys
from collections import OrderedDict
p = 'src/i18n/tr.json'
base = json.load(open(p), object_pairs_hook=OrderedDict)
frag = json.loads(sys.stdin.read(), object_pairs_hook=OrderedDict)
def merge(a, b):
    for k, v in b.items():
        if k in a and isinstance(a[k], dict) and isinstance(v, dict):
            merge(a[k], v)
        else:
            a[k] = v
merge(base, frag)
open(p, 'w').write(json.dumps(base, ensure_ascii=False, indent=2) + '\n')
