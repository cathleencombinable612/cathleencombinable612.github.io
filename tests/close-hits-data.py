import json,glob,os
# flags any voice with two hits closer than 20 ms (flams count as 2 hits ~min(30ms, step/4) apart)
bad={}
for f in sorted(glob.glob('/workspace/rhythm/public/songs/*.json')):
    d=json.load(open(f)); k=d['id']; t=0.0; last={}; hits=0
    for s in d['sections']:
        for i,b in enumerate(s['bars']):
            tps=s['ticksPerStep'][i]; bpm=s['bpm'][i]; stepSec=tps*60/bpm/12
            n=len(next(iter(b.values())))
            for st in range(n):
                for v,str_ in b.items():
                    c=str_[st]
                    if c=='.': continue
                    tt=t+st*stepSec
                    if c in 'fr':
                        g=max(0.02,min(0.028,stepSec/2))
                        if g<0.02: bad.setdefault(k,[]).append((s['name'],i,v,'flam %.1fms'%(g*1000)))
                    if v in last and tt-last[v]<0.02: bad.setdefault(k,[]).append((s['name'],i,v,'%.1fms'%((tt-last[v])*1000)))
                    last[v]=tt
            t+=n*stepSec
print({k:(len(v),v[:3]) for k,v in bad.items()})
