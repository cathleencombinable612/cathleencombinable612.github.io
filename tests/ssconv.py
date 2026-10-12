import json,sys,math
from fractions import Fraction as Fr
GM={91:'snare',92:'openHat',93:'ride',94:'china',96:'crash2',97:'crash2',98:'crash2',65:'tomHi',66:'tomMid',67:'cowbell',68:'cowbell',81:'rideBell',83:'shaker',85:'shaker',86:'tomFloor',87:'tomFloor',78:'crossStick',126:'crash1',35:'kick',36:'kick',38:'snare',40:'snare',39:'snare',37:'crossStick',42:'closedHat',44:'pedalHat',46:'openHat',49:'crash1',57:'crash2',55:'crash2',52:'china',51:'ride',59:'ride',53:'rideBell',41:'tomFloor',43:'tomFloor',45:'tomMid',47:'tomMid',48:'tomHi',50:'tomHi',56:'cowbell',54:'shaker',70:'shaker',69:'shaker',82:'shaker',75:'crossStick',76:'crossStick',77:'crossStick',62:'tomHi',63:'tomMid',64:'tomFloor',60:'tomHi',61:'tomMid',31:'crossStick',33:'crossStick',34:'rideBell',58:'crossStick',22:'closedHat',26:'openHat',21:'closedHat',23:'openHat',24:'openHat',25:'openHat',27:'pedalHat',28:'crash1',29:'crash1',30:'china'}
DYN={'ppp':0.2,'pp':0.3,'p':0.45,'mp':0.6,'mf':0.75,'f':0.85,'ff':0.95,'fff':1.0}
def expand(ms):
    order=[];i=0;start=0;passes={};n=len(ms)
    guard=0
    while i<n and guard<5000:
        guard+=1;m=ms[i]
        if m.get('repeatStart'): start=i
        ae=m.get('alternateEnding')
        p=passes.get(start,1)
        if ae and p not in ae: i+=1; continue
        order.append(i)
        rc=m.get('repeat')
        if rc:
            if passes.get(start,1)<rc: passes[start]=passes.get(start,1)+1; i=start; continue
            else: passes[start]=1
        i+=1
    return order
def bar_events(m,sig):
    num,den=sig; barLen=Fr(num,den)  # in whole notes
    ev=[];unknown=set()
    for v in m.get('voices',[]):
        pos=Fr(0); pend_grace=False
        for b in v.get('beats',[]):
            d=Fr(*b['duration'])
            # Songsterr 'duration' is already the sounding length (dots and tuplets applied), e.g. a 16th triplet is [1,24].
            if b.get('graceNote') or b.get('grace'):
                pend_grace={GM.get(nt.get('fret')) for nt in b.get('notes',[])}; continue
            vel=DYN.get(b.get('velocity','mf'),0.75)
            if not b.get('rest'):
                for nt in b.get('notes',[]):
                    if nt.get('tie') or nt.get('rest'): continue
                    vo=GM.get(nt.get('fret'))
                    if not vo: unknown.add(nt.get('fret')); continue
                    vv=vel
                    if nt.get('ghost'): vv=0.3
                    if nt.get('accentuated') or nt.get('accent'): vv=1.0 if nt.get('accentuated')!=1 else 0.95
                    ev.append((pos,vo,vv,'f' if pend_grace and vo in pend_grace else ''))
            pend_grace=False
            pos+=d
    return barLen,ev,unknown
def grid(barLen,ev):
    # choose finest needed: units of 1/96 whole? use quarter=12 ticks -> whole=48 ticks
    best=None
    for tps in (3,4,2,1):
        step=Fr(tps,48); ok=all((p/step).denominator==1 for p,*_ in ev)
        if ok: best=tps;break
    if best is None: best=1
    step=Fr(best,48); steps=int(barLen/step)
    tr={}
    for p,vo,vv,fl in ev:
        i=int(round(p/step))
        if i>=steps: continue
        a=tr.setdefault(vo,['.']*steps)
        c='f' if fl else str(max(1,min(9,round(vv*9))))
        if a[i]=='.' or c=='f' or c>a[i]: a[i]=c
    if not tr: tr={'kick':['.']*steps}
    return best,steps,{k:''.join(v) for k,v in tr.items()}
def convert(path):
    d=json.load(open(path)); p=d['part']; ms=p['measures']
    sig=(4,4); sigs=[]
    for m in ms:
        if m.get('signature'): sig=tuple(m['signature'])
        sigs.append(sig)
    order=expand(ms)
    tempo=p.get('automations',{}).get('tempo',[{'bpm':100,'type':4}])
    t0=tempo[0]; bpm=t0['bpm']*(4/t0.get('type',4)) if t0.get('type',4)!=4 else t0['bpm']
    if t0.get('type')==8: bpm=t0['bpm']/2
    if t0.get('type')==2: bpm=t0['bpm']*2
    def qbpm(t):
        b=t['bpm']; ty=t.get('type',4)
        return b*4/ty if ty else b
    tm=sorted(tempo,key=lambda t:(t.get('measure',0),t.get('position',0)))
    def bpmAt(idx):
        cur=tm[0]
        for t in tm:
            if t.get('measure',0)<=idx: cur=t
        return round(qbpm(cur),2)
    secs=[];cur=None;unk=set();marker='Intro'
    for idx in order:
        m=ms[idx]
        mk=(m.get('marker') or {}).get('text')
        if mk: marker=mk
        if cur is None or mk:
            cur={'name':marker,'bars':[],'ticksPerStep':[],'timeSig':[],'bpm':[]}; secs.append(cur)
        bl,ev,u=bar_events(m,sigs[idx]); unk|=u
        tps,steps,tr=grid(bl,ev)
        cur['bars'].append(tr); cur['ticksPerStep'].append(tps); cur['timeSig'].append('%d/%d'%sigs[idx]); cur['bpm'].append(bpmAt(idx))
    return dict(bpm=round(qbpm(tm[0])),tempos=tempo,sections=secs,unknown=sorted(x for x in unk if x is not None),nbars=len(order),title=d['meta']['title'],artist=d['meta']['artist'],songId=d['meta']['songId'],revisionId=d['meta']['revisionId'],track=d['meta']['tracks'][d['track']]['name'])
if __name__=='__main__':
    r=convert(sys.argv[1]); print(r['title'],r['bpm'],r['nbars'],'unknown',r['unknown'])
    for s in r['sections']: print(' ',s['name'],len(s['bars']),set(s['timeSig']),set(s['ticksPerStep']))
    print(r['sections'][1]['bars'][0] if len(r['sections'])>1 else r['sections'][0]['bars'][4])

def autosection(bars, tps, ts, bpm, title):
    """Split an unmarked tab into parts where the drum texture changes."""
    def feat(b):
        on={k for k,v in b.items() if any(c!='.' for c in v)}
        if not on or on=={'kick'} and not any(c!='.' for c in b.get('kick','')): return 'no drums'
        cym='ride' if on&{'ride','rideBell'} else 'open hat' if 'openHat' in on and 'closedHat' not in on else 'hi-hat' if on&{'closedHat','openHat','pedalHat'} else 'rim' if 'crossStick' in on else 'toms' if on&{'tomHi','tomMid','tomFloor'} else 'drums'
        return cym
    f=[feat(b) for b in bars]
    runs=[]
    for i,x in enumerate(f):
        if runs and runs[-1][0]==x: runs[-1][2]=i+1
        else: runs.append([x,i,i+1])
    # merge short runs (< 4 bars) into the previous run
    m=[]
    for r in runs:
        if m and (r[2]-r[1]<4 or m[-1][0]==r[0]): m[-1][2]=r[2]
        else: m.append(r)
    if len(m)>1 and m[0][2]-m[0][1]<4 and m[0][0]!='no drums': m[1][1]=m[0][1]; m.pop(0)
    out=[]
    for j,(x,a,b) in enumerate(m):
        name=('Intro (no drums)' if x=='no drums' and a==0 else f'Part {j+1} · {x}' )
        out.append(dict(name=name,bars=bars[a:b],ticksPerStep=tps[a:b],timeSig=ts[a:b],bpm=bpm[a:b]))
    if len(out)==1:  # uniform texture: split into 8-bar phrases instead of one giant section
        o=out[0]; out=[]
        for a in range(0,len(o['bars']),8):
            b=min(len(o['bars']),a+8)
            out.append(dict(name=f'Groove · bars {a+1}–{b}',bars=o['bars'][a:b],ticksPerStep=o['ticksPerStep'][a:b],timeSig=o['timeSig'][a:b],bpm=o['bpm'][a:b]))
    return out
