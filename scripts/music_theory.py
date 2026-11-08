"""Notes écrites pour ténor : orthographe diatonique et correspondance concert."""
NATURAL={'C':0,'D':2,'E':4,'F':5,'G':7,'A':9,'B':11}
LETTERS=list(NATURAL)
FRENCH={'C':'Do','D':'Ré','E':'Mi','F':'Fa','G':'Sol','A':'La','B':'Si'}
KEYS=['C','G','D','A','E','B','F#','Db','Ab','Eb','Bb','F']
SCALES={'major':[0,2,4,5,7,9,11],'naturalMinor':[0,2,3,5,7,8,10],'harmonicMinor':[0,2,3,5,7,8,11],'melodicMinor':[0,2,3,5,7,9,11]}
QUALITIES={'maj7':([0,2,4,6],[0,4,7,11]),'7':([0,2,4,6],[0,4,7,10]),'m7':([0,2,4,6],[0,3,7,10]),'m7b5':([0,2,4,6],[0,3,6,10]),'dim7':([0,2,4,6],[0,3,6,9]),'mMaj7':([0,2,4,6],[0,3,7,11]),'m6':([0,2,4,5],[0,3,7,9]),'6':([0,2,4,5],[0,4,7,9])}
def pc(note): return (NATURAL[note[0]]+note.count('#')-note.count('b'))%12
def spell(root,degree,interval):
    letter=LETTERS[(LETTERS.index(root[0])+degree)%7]
    delta=(pc(root)+interval-NATURAL[letter])%12
    if delta>6: delta-=12
    return letter+('#'*delta if delta>0 else 'b'*(-delta))
def pretty(note):return note.replace('bb','♭♭').replace('##','♯♯').replace('b','♭').replace('#','♯')
def french(note):return FRENCH[note[0]]+pretty(note[1:])
def scale(root,kind='major'):return [spell(root,i,n) for i,n in enumerate(SCALES[kind])]
def concert(note):return spell(note,6,-2)
def symbol(root,quality):return pretty(root)+{'m7b5':'m7♭5','mMaj7':'m(maj7)','dim7':'°7'}.get(quality,quality)
def chord(root,quality):
    degrees,intervals=QUALITIES[quality]
    return {'root':root,'quality':quality,'symbol':symbol(root,quality),'notes':[spell(root,d,n) for d,n in zip(degrees,intervals)]}
def cadence(root,mode='major'):
    minor=mode=='minor'
    return [chord(spell(root,1,2),'m7b5' if minor else 'm7'),chord(spell(root,4,7),'7'),chord(root,'m7' if minor else 'maj7')]
def notes_text(notes):return ' · '.join(french(n)+' ('+pretty(n)+')' for n in notes)
def study_grid():
    a=[ [('F','m7',4)], [('Bb','7',4)], [('Eb','maj7',4)], [('Ab','maj7',4)], [('D','m7b5',4)], [('G','7',4)], [('C','m7',4)], [('C','7',4)] ]
    a2=[x[:] for x in a];a2[-1]=[('Eb','7',4)]
    b=[[('Ab','maj7',4)],[('Ab','maj7',4)],[('Bb','m7',2),('Eb','7',2)],[('Ab','maj7',4)],[('G','m7b5',4)],[('C','7',4)],[('F','m7',4)],[('Bb','7',4)]]
    a3=[x[:] for x in a];a3[-2]=[('C','m7',2),('F','m7',1),('Bb','7',1)];a3[-1]=[('Eb','maj7',4)]
    return [{'number':i+1,'section':['A₁','A₂','B','A₃'][i//8],'chords':[{**chord(r,q),'beats':beats} for r,q,beats in bar]} for i,bar in enumerate(a+a2+b+a3)]
