import json,os,re
from ssconv import convert
gen=json.load(open('song-patterns.generated.json'))  # generated (v2) incl journeys
idx=json.load(open('songsterr/index.json'))
vc=lambda v:'.' if v<=0 else str(max(1,min(9,round(v*9))))
os.makedirs('/workspace/rhythm/public/songs',exist_ok=True)
meta=[];full=[]
for e in gen:
    k=e['id']; e=dict(e)
    if k in idx and isinstance(idx[k],list):
        r=convert(f'songsterr/{k}.json')
        sid=idx[k][0]
        url=f"https://www.songsterr.com/a/wsa/{re.sub('[^a-z0-9]+','-',r['artist'].lower())}-{re.sub('[^a-z0-9]+','-',r['title'].lower())}-drum-tab-s{sid}"
        rs=r['sections']
        if len(rs)==1:
            from ssconv import autosection
            s0=rs[0]; rs=autosection(s0['bars'],s0['ticksPerStep'],s0['timeSig'],s0['bpm'],r['title']); auto=True
        else: auto=False
        secs=[]
        for j,s in enumerate(rs):
            if s['name'].startswith('(') or s['name'].startswith('...'): s=dict(s,name=f'Section {j+1}')
            hum={'cometogether':{'Intro':dict(lateMs=14,jitterMs=7)}}.get(k,{}).get(s['name'])
            secs.append(dict(name=s['name'],bars=s['bars'],**({'humanize':hum} if hum else {}),ticksPerStep=s['ticksPerStep'],timeSig=s['timeSig'],bpm=s['bpm'],confidence='transcribed: Songsterr community drum tab (note-complete as published; not checked bar-by-bar against the recording)'+('; section boundaries detected from changes in the drum part (the tab has no section markers)' if auto else '')))
        e['sections']=secs; e['bpm']=r['bpm']
        e['source']=url; e['transcription']=dict(source='Songsterr',songId=sid,revisionId=r['revisionId'],track=r['track'],bars=r['nbars'],tempoChanges=len(r['tempos']))
        e['confidence']='transcribed (Songsterr community tab)'
        e['formNote']=f"Full drum part from the Songsterr community tab (revision {r['revisionId']}, track: {r['track'] or 'drums'}), with repeats expanded, tempo map and section markers as published. Community tabs can contain errors."
        if k=='funkydrummer': e['formNote']+=' This tab covers the "Bonus Beat Reprise" version.'
        if k=='cobham': e['formNote']+=' The tab is partial (about 2.5 minutes).'
        sec_len=sum(n*4/d*60/b for s in secs for ts,b in zip(s['timeSig'],s['bpm']) for n,d in [map(int,ts.split('/'))])
        e['lengthCheck']=dict(e.get('lengthCheck',{}),modelSeconds=round(sec_len))
    else:
        secs=[]
        for s in e['sections']:
            bars=[{kk:''.join(map(vc,a)) for kk,a in b.items() if any(a)} for b in s['bars']]
            n=len(bars); secs.append(dict(name=s['name'],bars=bars,ticksPerStep=[s.get('ticksPerStep',e.get('ticksPerStep',3))]*n,timeSig=[s.get('timeSig',e['timeSig'])]*n,bpm=[e['bpm']]*n,confidence=s.get('confidence','approximate')))
        e['sections']=secs
    for s in e['sections']: s['timeSig']=[t if re.match(r'^\d+/\d+$',t) else e['timeSig'] if re.match(r'^\d+/\d+$',e['timeSig']) else '4/4' for t in s['timeSig']]
    full.append(e)
    json.dump(dict(id=k,sections=e['sections']),open(f'/workspace/rhythm/public/songs/{k}.json','w'),separators=(',',':'))
    m={x:y for x,y in e.items() if x!='sections'}
    m['form']=[dict(section=s['name'],bars=len(s['bars']),timeSig=sorted(set(s['timeSig']))) for s in e['sections']]
    fb=0
    for sec in e['sections']:
        for b in sec['bars']:
            if any(c not in '.' for v in b.values() for c in v): break
            fb+=1
        else: continue
        break
    m['firstDrumBar']=fb
    m['category']='Journeys' if k.startswith('j-') else 'Songs'
    meta.append(m)
one=[e['id'] for e in full if len(e['sections'])<2]
intro_only=[e['id'] for e in full if len(e['sections'])==1 or all(s['name'].lower().startswith('intro') for s in e['sections'])]
print('CHECK single-section songs:',one or 'none','| intro-only labels:',intro_only or 'none')
json.dump(full,open('song-patterns.json.full','w'))
json.dump(meta,open('/workspace/rhythm/src/data/songs.json','w'),separators=(',',':'))
print(len(meta), sum(1 for m in meta if m.get('transcription')),'transcribed')
